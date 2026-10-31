import "server-only";
import { env } from "@/server/env";
import { DemoBriefGenerator } from "./demo-generator";
import type { BriefGenerator } from "./generator";
import { OpenAIBriefGenerator } from "./openai-generator";

let instance: BriefGenerator | undefined;

/** Picks the provider from configuration. Add Anthropic, Gemini, etc. here. */
export function getBriefGenerator(): BriefGenerator {
  if (instance) return instance;
  const { OPENAI_API_KEY, OPENAI_MODEL } = env();
  instance = OPENAI_API_KEY ? new OpenAIBriefGenerator(OPENAI_API_KEY, OPENAI_MODEL) : new DemoBriefGenerator();
  return instance;
}

export const isDemoMode = () => !env().OPENAI_API_KEY;
export type { BriefGenerator } from "./generator";
