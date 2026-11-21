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
    findByRequestId: async (userId, requestId) =>
      rows.find((r) => r.userId === userId && r.requestId === requestId) ?? null,
    insertWithinLimit: async (data: NewBrief, limit, since) => {
      const dup = data.requestId && rows.find((r) => r.userId === data.userId && r.requestId === data.requestId);
      if (dup) return dup;
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

describe("briefService.generate idempotency", () => {
  const KEY = "3f1c2b9e-8a4d-4c6e-9b2f-1a2b3c4d5e6f";

  it("returns the same brief for a repeated request key without a second AI call or credit", async () => {
    const generate = vi.fn(okGenerator.generate);
    const { service, repo } = setup({ generator: { model: "fake", generate } });
    const first = await service.generate("u1", NOTES, KEY);
    const retry = await service.generate("u1", NOTES, KEY);
    expect(first.ok && retry.ok).toBe(true);
    if (first.ok && retry.ok) expect(retry.value.id).toBe(first.value.id);
    expect(repo.rows).toHaveLength(1);
    expect(generate).toHaveBeenCalledOnce();
    expect(await service.usage("u1")).toMatchObject({ used: 1 });
  });

  it("still returns the saved brief on retry when the user is now at the limit", async () => {
    const { service } = setup({ dailyLimit: 1 });
    expect((await service.generate("u1", NOTES, KEY)).ok).toBe(true);
    expect((await service.generate("u1", NOTES, KEY)).ok).toBe(true);
  });

  it("treats different keys as different requests", async () => {
    const { service, repo } = setup();
    await service.generate("u1", NOTES, KEY);
    await service.generate("u1", NOTES, "9d8c7b6a-5f4e-4d3c-8b2a-0f1e2d3c4b5a");
    expect(repo.rows).toHaveLength(2);
  });

  it("does not share keys between users", async () => {
    const { service, repo } = setup();
    await service.generate("u1", NOTES, KEY);
    await service.generate("u2", NOTES, KEY);
    expect(repo.rows).toHaveLength(2);
  });

  it("rejects a malformed key", async () => {
    const { service } = setup();
    expect(await service.generate("u1", NOTES, "not-a-uuid")).toMatchObject({ ok: false, error: "INVALID_INPUT" });
  });

  it("works without a key, like before", async () => {
    const { service } = setup();
    expect((await service.generate("u1", NOTES)).ok).toBe(true);
    expect((await service.generate("u1", NOTES, "")).ok).toBe(true);
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
