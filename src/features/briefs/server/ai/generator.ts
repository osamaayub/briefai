import type { BriefContent } from "../../schemas";

/**
 * Port for anything that can turn notes into a brief. The service depends on
 * this interface, not on OpenAI, so providers can be swapped or faked in tests.
 */
export interface BriefGenerator {
  readonly model: string;
  generate(notes: string, opts?: { signal?: AbortSignal }): Promise<BriefContent>;
}
