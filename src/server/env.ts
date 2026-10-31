import "server-only";
import { z } from "zod";

// Treat empty strings from .env files as "not set".
const optional = z.preprocess((v) => (v === "" ? undefined : v), z.string().optional());

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  DATABASE_URL: z.string().default("file:local.db"),
  DATABASE_AUTH_TOKEN: optional,
  OPENAI_API_KEY: optional,
  OPENAI_MODEL: z.string().default("gpt-5-mini"),
  FREE_DAILY_LIMIT: z.coerce.number().int().positive().default(5),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

/**
 * Validated, typed environment. Parsed lazily on first use so that
 * `next build` does not need production secrets, but the app fails fast
 * with a clear message the first time a misconfigured value is read.
 */
export function env(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
