import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { NewBrief } from "../types";

// Runs the real repository against a real SQLite file, so the transaction and
// the unique index are tested for real, not with a fake.
const dir = mkdtempSync(join(tmpdir(), "briefai-test-"));
process.env.DATABASE_URL = `file:${join(dir, "test.db")}`;
process.env.SESSION_SECRET ??= "x".repeat(32);

const { db } = await import("@/server/db/client");
const { users } = await import("@/server/db/schema");
const { briefRepository: repo } = await import("./brief-repository");
const { migrate } = await import("drizzle-orm/libsql/migrator");

const since = new Date(0);
const brief = (userId: string, requestId: string | null): NewBrief => ({
  userId,
  requestId,
  title: "Weekly sync",
  summary: "A sync.",
  actionItems: ["Fix the login bug"],
  source: "notes",
  model: "fake",
});

beforeAll(async () => {
  await migrate(db(), { migrationsFolder: "drizzle" });
  await db().insert(users).values([
    { id: "u1", name: "Ali", email: "ali@example.com", passwordHash: "x" },
    { id: "u2", name: "Sara", email: "sara@example.com", passwordHash: "x" },
  ]);
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("briefRepository.insertWithinLimit (real SQLite)", () => {
  it("saves one brief when the same key is sent twice at the same moment", async () => {
    const key = "11111111-1111-4111-8111-111111111111";
    const [a, b] = await Promise.all([
      repo.insertWithinLimit(brief("u1", key), 5, since),
      repo.insertWithinLimit(brief("u1", key), 5, since),
    ]);
    expect(a?.id).toBeDefined();
    expect(b?.id).toBe(a?.id);
    expect(await repo.countSince("u1", since)).toBe(1);
    expect((await repo.findByRequestId("u1", key))?.id).toBe(a?.id);
  });

  it("never goes over the limit with many concurrent requests", async () => {
    const results = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        repo.insertWithinLimit(brief("u2", `22222222-2222-4222-8222-22222222222${i}`), 3, since),
      ),
    );
    expect(results.filter(Boolean)).toHaveLength(3);
    expect(await repo.countSince("u2", since)).toBe(3);
  });

  it("has a unique index that rejects a duplicate key even outside the repository", async () => {
    const { briefs } = await import("@/server/db/schema");
    const key = "33333333-3333-4333-8333-333333333333";
    await db().insert(briefs).values(brief("u2", key));
    await expect(db().insert(briefs).values(brief("u2", key))).rejects.toThrow();
  });

  it("allows many briefs without a key (old clients)", async () => {
    await repo.insertWithinLimit(brief("u1", null), 10, since);
    await repo.insertWithinLimit(brief("u1", null), 10, since);
    expect(await repo.countSince("u1", since)).toBe(3);
  });
});
