"use server";

import { refresh } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { briefs } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { createBrief } from "@/lib/ai";
import { DAILY_LIMIT, usedToday } from "@/lib/usage";

export type BriefState = { error?: string; ok?: boolean; notes?: string } | undefined;

const NotesSchema = z
  .string()
  .trim()
  .min(30, "Paste at least a few sentences of notes")
  .max(6000, "Notes are too long (max 6,000 characters)");

export async function generateBrief(_: BriefState, formData: FormData): Promise<BriefState> {
  // 1. Who is asking? Never trust the client.
  const user = await getCurrentUser();

  // 2. Validate input before spending money on the AI call.
  const notes = String(formData.get("notes") ?? "");
  const parsed = NotesSchema.safeParse(notes);
  if (!parsed.success) return { error: parsed.error.issues[0].message, notes };

  // 3. Enforce the free plan limit.
  if ((await usedToday(user.id)) >= DAILY_LIMIT) {
    return { error: `You've used all ${DAILY_LIMIT} free briefs for today.`, notes };
  }

  // 4. Call the AI on the server, then save the result.
  try {
    const result = await createBrief(parsed.data);
    await db.insert(briefs).values({ ...result, userId: user.id, source: parsed.data });
  } catch (err) {
    console.error(err);
    return { error: "The AI request failed. Please try again.", notes };
  }

  refresh();
  return { ok: true };
}

export async function deleteBrief(id: string) {
  const user = await getCurrentUser();
  await db.delete(briefs).where(and(eq(briefs.id, id), eq(briefs.userId, user.id)));
  refresh();
}
