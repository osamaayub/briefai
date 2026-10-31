import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

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
    createdAt: createdAt(),
  },
  // Every dashboard query and the daily limit filter by user and date.
  (t) => [index("briefs_user_created_idx").on(t.userId, t.createdAt)],
);

export type UserRow = typeof users.$inferSelect;
export type BriefRow = typeof briefs.$inferSelect;
