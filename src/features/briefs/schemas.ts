import { z } from "zod";

export const NOTES_MIN = 30;
export const NOTES_MAX = 6000;

export const NotesSchema = z
  .string()
  .trim()
  .min(NOTES_MIN, "Paste at least a few sentences of notes")
  .max(NOTES_MAX, `Notes are too long (max ${NOTES_MAX.toLocaleString("en-US")} characters)`);

/** The structured output we ask the AI for. Also validates demo output. */
export const BriefContentSchema = z.object({
  title: z.string().min(1).max(120).describe("A short title, max 8 words"),
  summary: z.string().min(1).describe("A clear 2-3 sentence summary"),
  actionItems: z.array(z.string().min(1)).max(12).describe("Concrete next steps, each starting with a verb"),
});

export type BriefContent = z.infer<typeof BriefContentSchema>;
