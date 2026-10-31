import { describe, expect, it, vi } from "vitest";
import type { Brief, NewBrief } from "../types";
import type { BriefGenerator } from "./ai/generator";
import type { BriefRepository } from "./brief-repository";
import { createBriefService } from "./brief-service";

const NOTES = "Weekly sync. Ali will fix the login bug by Friday. Sara needs to update the docs.";

function fakeRepo(): BriefRepository & { rows: Brief[] } {
  const rows: Brief[] = [];
  return {
    rows,
    listByUser: async (userId) => rows.filter((r) => r.userId === userId),
    countSince: async (userId, since) => rows.filter((r) => r.userId === userId && r.createdAt >= since).length,
    insertWithinLimit: async (data: NewBrief, limit, since) => {
      const n = rows.filter((r) => r.userId === data.userId && r.createdAt >= since).length;
      if (n >= limit) return null;
      const row = { ...data, id: String(rows.length + 1), createdAt: new Date() };
      rows.push(row);
      return row;
    },
    deleteOwned: async (userId, id) => {
      const i = rows.findIndex((r) => r.id === id && r.userId === userId);
      if (i === -1) return false;
      rows.splice(i, 1);
      return true;
    },
  };
}

const okGenerator: BriefGenerator = {
  model: "fake",
  generate: async () => ({ title: "Weekly sync", summary: "A sync.", actionItems: ["Fix the login bug"] }),
};

const setup = (overrides: Partial<Parameters<typeof createBriefService>[0]> = {}) => {
  const repo = fakeRepo();
  const service = createBriefService({ repo, generator: okGenerator, dailyLimit: 2, ...overrides });
  return { repo, service };
};

describe("briefService.generate", () => {
  it("creates and saves a brief", async () => {
    const { service, repo } = setup();
    const result = await service.generate("u1", NOTES);
    expect(result.ok).toBe(true);
    expect(repo.rows).toHaveLength(1);
    expect(repo.rows[0]).toMatchObject({ userId: "u1", model: "fake", source: NOTES });
  });

  it("rejects notes that are too short without calling the AI", async () => {
    const generate = vi.fn(okGenerator.generate);
    const { service } = setup({ generator: { model: "fake", generate } });
    const result = await service.generate("u1", "too short");
    expect(result).toMatchObject({ ok: false, error: "INVALID_INPUT" });
    expect(generate).not.toHaveBeenCalled();
  });

  it("stops at the daily limit and skips the AI call", async () => {
    const generate = vi.fn(okGenerator.generate);
    const { service } = setup({ generator: { model: "fake", generate } });
    await service.generate("u1", NOTES);
    await service.generate("u1", NOTES);
    const third = await service.generate("u1", NOTES);
    expect(third).toMatchObject({ ok: false, error: "LIMIT_REACHED" });
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("counts limits per user", async () => {
    const { service } = setup({ dailyLimit: 1 });
    expect((await service.generate("u1", NOTES)).ok).toBe(true);
    expect((await service.generate("u2", NOTES)).ok).toBe(true);
  });

  it("returns AI_FAILED and reports the error when the provider throws", async () => {
    const onError = vi.fn();
    const { service, repo } = setup({
      generator: { model: "fake", generate: async () => { throw new Error("boom"); } },
      onError,
    });
    const result = await service.generate("u1", NOTES);
    expect(result).toMatchObject({ ok: false, error: "AI_FAILED" });
    expect(onError).toHaveBeenCalledOnce();
    expect(repo.rows).toHaveLength(0);
  });
});

describe("briefService.usage", () => {
  it("reports used and remaining", async () => {
    const { service } = setup({ dailyLimit: 5 });
    await service.generate("u1", NOTES);
    expect(await service.usage("u1")).toEqual({ used: 1, limit: 5, remaining: 4 });
  });
});

describe("briefService.remove", () => {
  it("only deletes the owner's brief", async () => {
    const { service, repo } = setup();
    await service.generate("u1", NOTES);
    const id = repo.rows[0].id;
    expect(await service.remove("u2", id)).toBe(false);
    expect(await service.remove("u1", id)).toBe(true);
  });
});
