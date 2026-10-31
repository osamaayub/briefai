import "server-only";
import { env } from "@/server/env";
import { logger } from "@/server/logger";
import { getBriefGenerator } from "./ai";
import { briefRepository } from "./brief-repository";
import { createBriefService, type BriefService } from "./brief-service";

let service: BriefService | undefined;

/** Composition root: wires real adapters into the service. */
export function briefService(): BriefService {
  service ??= createBriefService({
    repo: briefRepository,
    generator: getBriefGenerator(),
    dailyLimit: env().FREE_DAILY_LIMIT,
    onError: (error, ctx) => logger.error("brief.generate_failed", { ...ctx, error: String(error) }),
  });
  return service;
}

export { isDemoMode } from "./ai";
