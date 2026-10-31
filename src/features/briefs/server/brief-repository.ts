import "server-only";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { db } from "@/server/db/client";
import { briefs } from "@/server/db/schema";
import type { Brief, NewBrief } from "../types";

/** Port used by the service. Keeps SQL out of business logic and makes it testable. */
export interface BriefRepository {
  listByUser(userId: string): Promise<Brief[]>;
  countSince(userId: string, since: Date): Promise<number>;
  /** Inserts only if the user is under `limit` since `since`. Atomic. */
  insertWithinLimit(data: NewBrief, limit: number, since: Date): Promise<Brief | null>;
  deleteOwned(userId: string, id: string): Promise<boolean>;
}

const ownedSince = (userId: string, since: Date) => and(eq(briefs.userId, userId), gte(briefs.createdAt, since));

export const briefRepository: BriefRepository = {
  listByUser(userId) {
    return db().query.briefs.findMany({ where: eq(briefs.userId, userId), orderBy: desc(briefs.createdAt), limit: 50 });
  },

  async countSince(userId, since) {
    const [row] = await db().select({ n: count() }).from(briefs).where(ownedSince(userId, since));
    return row?.n ?? 0;
  },

  // Count and insert in one write transaction, so two requests sent at the same
  // moment cannot both pass the check and go over the limit.
  insertWithinLimit(data, limit, since) {
    return db().transaction(
      async (tx) => {
        const [row] = await tx.select({ n: count() }).from(briefs).where(ownedSince(data.userId, since));
        if ((row?.n ?? 0) >= limit) return null;
        const [created] = await tx.insert(briefs).values(data).returning();
        return created;
      },
      { behavior: "immediate" },
    );
  },

  async deleteOwned(userId, id) {
    const deleted = await db()
      .delete(briefs)
      .where(and(eq(briefs.id, id), eq(briefs.userId, userId)))
      .returning({ id: briefs.id });
    return deleted.length > 0;
  },
};
