import type { BriefContent } from "../../schemas";
import type { BriefGenerator } from "./generator";

const TASK = /\b(will|need to|needs to|should|must|todo|to do|by (mon|tue|wed|thu|fri|next|end))/i;

/** Deterministic, offline generator: lets anyone run the app without an API key. */
export class DemoBriefGenerator implements BriefGenerator {
  readonly model = "demo";

  async generate(notes: string): Promise<BriefContent> {
    const lines = notes
      .split(/\n|(?<=[.!?])\s+/)
      .map((l) => l.replace(/^[-*•\d.)\s]+/, "").replace(/[.!?]+$/, "").trim())
      .filter(Boolean);
    const tasks = lines.filter((l) => TASK.test(l));
    const facts = lines.filter((l) => !TASK.test(l));

    return {
      title: (facts[0] ?? lines[0] ?? "Untitled brief").split(" ").slice(0, 8).join(" "),
      summary: `${(facts.slice(0, 3).join(". ") || notes.slice(0, 220)).trim()}.`,
      actionItems: tasks.length ? tasks.slice(0, 6) : ["Review the notes and add next steps"],
    };
  }
}
