import "server-only";
import { and, count, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { briefs } from "@/db/schema";

export const DAILY_LIMIT = Number(process.env.FREE_DAILY_LIMIT ?? 5);

export async function usedToday(userId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [row] = await db
    .select({ n: count() })
    .from(briefs)
    .where(and(eq(briefs.userId, userId), gte(briefs.createdAt, startOfDay)));

  return row?.n ?? 0;
}
