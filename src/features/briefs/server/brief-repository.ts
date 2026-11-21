import "server-only";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { db } from "@/server/db/client";
import { briefs } from "@/server/db/schema";
import type { Brief, NewBrief } from "../types";

/** Port used by the service. Keeps SQL out of business logic and makes it testable. */
export interface BriefRepository {
  listByUser(userId: string): Promise<Brief[]>;
  countSince(userId: string, since: Date): Promise<number>;
  /** The brief this user already saved for an idempotency key, if any. */
  findByRequestId(userId: string, requestId: string): Promise<Brief | null>;
  /**
   * Inserts only if the user is under `limit` since `since`. Atomic.
   * If a brief with the same `requestId` already exists, returns it instead
   * of inserting, so a retried request never uses a second credit.
   */
  insertWithinLimit(data: NewBrief, limit: number, since: Date): Promise<Brief | null>;
  deleteOwned(userId: string, id: string): Promise<boolean>;
}

const ownedSince = (userId: string, since: Date) => and(eq(briefs.userId, userId), gte(briefs.createdAt, since));
const ownedRequest = (userId: string, requestId: string) =>
  and(eq(briefs.userId, userId), eq(briefs.requestId, requestId));

// Promise chain that runs write transactions one at a time in this process.
let writeQueue: Promise<unknown> = Promise.resolve();
function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(fn, fn);
  writeQueue = run.catch(() => {});
  return run;
}

function isUniqueViolation(error: unknown): boolean {
  for (let e: unknown = error; e instanceof Error; e = e.cause) {
    if (/UNIQUE constraint failed/i.test(e.message)) return true;
  }
  return false;
}

export const briefRepository: BriefRepository = {
  listByUser(userId) {
    return db().query.briefs.findMany({ where: eq(briefs.userId, userId), orderBy: desc(briefs.createdAt), limit: 50 });
  },

  async countSince(userId, since) {
    const [row] = await db().select({ n: count() }).from(briefs).where(ownedSince(userId, since));
    return row?.n ?? 0;
  },

  async findByRequestId(userId, requestId) {
    const row = await db().query.briefs.findFirst({ where: ownedRequest(userId, requestId) });
    return row ?? null;
  },

  // Count and insert in one write transaction. "immediate" (BEGIN IMMEDIATE)
  // takes SQLite's write lock at the start, so two requests sent at the same
  // moment run one after the other: they cannot both pass the check and go
  // over the limit, and the second one sees the first one's idempotency key.
  insertWithinLimit(data, limit, since) {
    // The local SQLite driver is synchronous: a second BEGIN IMMEDIATE in the
    // same process would block the event loop while the first transaction
    // can't finish, then fail with SQLITE_BUSY. Queue writes in-process first.
    return withWriteLock(async () => {
      try {
        return await db().transaction(
          async (tx) => {
            if (data.requestId) {
              const existing = await tx.query.briefs.findFirst({ where: ownedRequest(data.userId, data.requestId) });
              if (existing) return existing;
            }
            const [row] = await tx.select({ n: count() }).from(briefs).where(ownedSince(data.userId, since));
            if ((row?.n ?? 0) >= limit) return null;
            const [created] = await tx.insert(briefs).values(data).returning();
            return created;
          },
          { behavior: "immediate" },
        );
      } catch (error) {
        // Last line of defence across servers: the unique index rejected a
        // duplicate key, so the other request won. Return its brief.
        if (data.requestId && isUniqueViolation(error)) {
          const existing = await briefRepository.findByRequestId(data.userId, data.requestId);
          if (existing) return existing;
        }
        throw error;
      }
    });
  },

  async deleteOwned(userId, id) {
    const deleted = await db()
      .delete(briefs)
      .where(and(eq(briefs.id, id), eq(briefs.userId, userId)))
      .returning({ id: briefs.id });
    return deleted.length > 0;
  },
};
