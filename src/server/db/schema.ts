import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () => integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date());

export const users = sqliteTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
});

export const briefs = sqliteTable(
  "briefs",
  {
    id: id(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    actionItems: text("action_items", { mode: "json" }).$type<string[]>().notNull(),
    source: text("source").notNull(),
    model: text("model").notNull(),
    // Idempotency key sent by the form. A double click or a retry sends the
    // same key, so it can never create two briefs or use two credits.
    requestId: text("request_id"),
    createdAt: createdAt(),
  },
  (t) => [
    // Every dashboard query and the daily limit filter by user and date.
    index("briefs_user_created_idx").on(t.userId, t.createdAt),
    // One brief per key per user. NULLs (old rows) do not collide in SQLite.
    uniqueIndex("briefs_user_request_idx").on(t.userId, t.requestId),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type BriefRow = typeof briefs.$inferSelect;
