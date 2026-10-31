import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

export const BriefSchema = z.object({
  title: z.string().describe("A short title, max 8 words"),
  summary: z.string().describe("A clear 2-3 sentence summary"),
  actionItems: z.array(z.string()).describe("Concrete next steps, each starting with a verb"),
});
export type BriefResult = z.infer<typeof BriefSchema>;

export const isDemoMode = !process.env.OPENAI_API_KEY;

export async function createBrief(notes: string): Promise<BriefResult> {
  if (isDemoMode) return demoBrief(notes);

  // The key only lives on the server. It never reaches the browser.
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.responses.parse({
    model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
    instructions:
      "You turn messy meeting notes into a brief. Be concise and factual. " +
      "Only use information that is in the notes.",
    input: notes,
    text: { format: zodTextFormat(BriefSchema, "brief") },
  });

  if (!response.output_parsed) throw new Error("The model returned no brief.");
  return response.output_parsed;
}

// Runs without an API key so anyone can try the app locally.
function demoBrief(notes: string): BriefResult {
  const lines = notes
    .split(/\n|(?<=[.!?])\s+/)
    .map((l) => l.replace(/^[-*•\d.)\s]+/, "").replace(/[.!?]+$/, "").trim())
    .filter(Boolean);
  const isTask = (l: string) => /\b(will|need to|needs to|should|must|todo|to do|by (mon|tue|wed|thu|fri|next|end))/i.test(l);
  const tasks = lines.filter(isTask);
  const facts = lines.filter((l) => !isTask(l));
  return {
    title: (facts[0] ?? lines[0] ?? "Untitled brief").split(" ").slice(0, 8).join(" "),
    summary: (facts.slice(0, 3).join(". ") || notes.slice(0, 220)) + ".",
    actionItems: tasks.length ? tasks.slice(0, 6) : ["Review the notes and add next steps"],
  };
}
