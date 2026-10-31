import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";

export type PublicUser = { id: string; name: string; email: string };

const publicColumns = { id: true, name: true, email: true } as const;

export const userRepository = {
  findById(id: string): Promise<PublicUser | undefined> {
    return db().query.users.findFirst({ where: eq(users.id, id), columns: publicColumns });
  },

  /** Only used for login: the one place the password hash is read. */
  findCredentialsByEmail(email: string) {
    return db().query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true, passwordHash: true },
    });
  },

  async existsByEmail(email: string) {
    const row = await db().query.users.findFirst({ where: eq(users.email, email), columns: { id: true } });
    return Boolean(row);
  },

  async create(data: { name: string; email: string; passwordHash: string }) {
    const [row] = await db().insert(users).values(data).returning({ id: users.id });
    return row;
  },
};
