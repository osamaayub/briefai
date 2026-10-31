import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { BriefContentSchema, type BriefContent } from "../../schemas";
import type { BriefGenerator } from "./generator";

const INSTRUCTIONS =
  "You turn messy meeting notes into a brief. Be concise and factual. " +
  "Only use information that is in the notes. Write action items as short imperative sentences.";

export class OpenAIBriefGenerator implements BriefGenerator {
  private readonly client: OpenAI;

  constructor(apiKey: string, readonly model: string) {
    // The SDK retries transient errors (429/5xx) with backoff; cap time per request.
    this.client = new OpenAI({ apiKey, maxRetries: 2, timeout: 30_000 });
  }

  async generate(notes: string, opts?: { signal?: AbortSignal }): Promise<BriefContent> {
    const response = await this.client.responses.parse(
      {
        model: this.model,
        instructions: INSTRUCTIONS,
        input: notes,
        text: { format: zodTextFormat(BriefContentSchema, "brief") },
      },
      { signal: opts?.signal },
    );
    if (!response.output_parsed) throw new Error("Model returned no structured output");
    return response.output_parsed;
  }
}
