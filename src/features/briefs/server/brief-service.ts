import { err, ok, type Result } from "@/lib/result";
import { NotesSchema } from "../schemas";
import type { Brief } from "../types";
import type { BriefGenerator } from "./ai/generator";
import type { BriefRepository } from "./brief-repository";

export type BriefError = "INVALID_INPUT" | "LIMIT_REACHED" | "AI_FAILED";

type Deps = {
  repo: BriefRepository;
  generator: BriefGenerator;
  dailyLimit: number;
  now?: () => Date;
  onError?: (error: unknown, context: Record<string, unknown>) => void;
};

/**
 * Business rules for briefs. Framework-free: no Next.js, no database driver,
 * no SDK imports, so it is fully unit-tested with fakes.
 */
export function createBriefService({ repo, generator, dailyLimit, now = () => new Date(), onError }: Deps) {
  const startOfDay = () => {
    const d = new Date(now());
    d.setHours(0, 0, 0, 0);
    return d;
  };

  return {
    dailyLimit,

    list: (userId: string) => repo.listByUser(userId),

    async usage(userId: string) {
      const used = await repo.countSince(userId, startOfDay());
      return { used, limit: dailyLimit, remaining: Math.max(0, dailyLimit - used) };
    },

    async generate(userId: string, rawNotes: unknown): Promise<Result<Brief, BriefError>> {
      const parsed = NotesSchema.safeParse(rawNotes);
      if (!parsed.success) return err("INVALID_INPUT", parsed.error.issues[0].message);
      const notes = parsed.data;

      // Cheap pre-check so we don't pay for an AI call the user can't keep.
      if ((await repo.countSince(userId, startOfDay())) >= dailyLimit) {
        return err("LIMIT_REACHED", `You've used all ${dailyLimit} free briefs for today.`);
      }

      let content;
      try {
        content = await generator.generate(notes);
      } catch (error) {
        onError?.(error, { userId, model: generator.model });
        return err("AI_FAILED", "The AI request failed. Please try again.");
      }

      // Authoritative, atomic check at write time.
      const saved = await repo.insertWithinLimit(
        { ...content, userId, source: notes, model: generator.model },
        dailyLimit,
        startOfDay(),
      );
      if (!saved) return err("LIMIT_REACHED", `You've used all ${dailyLimit} free briefs for today.`);
      return ok(saved);
    },

    remove: (userId: string, id: string) => repo.deleteOwned(userId, id),
  };
}

export type BriefService = ReturnType<typeof createBriefService>;
