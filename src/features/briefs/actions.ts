"use server";

import { refresh } from "next/cache";
import type { ActionState } from "@/lib/result";
import { getCurrentUser } from "@/features/auth/server/current-user";
import { logger } from "@/server/logger";
import { briefService } from "./server";

export type GenerateState = ActionState<{ notes: string }>;

export async function generateBrief(_: GenerateState, formData: FormData): Promise<GenerateState> {
  const user = await getCurrentUser(); // never trust the client
  const notes = String(formData.get("notes") ?? "");

  const result = await briefService().generate(user.id, notes);
  if (!result.ok) return { status: "error", message: result.message, fields: { notes } };

  logger.info("brief.created", { userId: user.id, briefId: result.value.id, model: result.value.model });
  refresh();
  return { status: "success" };
}

export async function deleteBrief(id: string) {
  const user = await getCurrentUser();
  await briefService().remove(user.id, id);
  refresh();
}
