import "server-only";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "@/server/env";
import * as schema from "./schema";

function createDb() {
  const { DATABASE_URL, DATABASE_AUTH_TOKEN } = env();
  return drizzle({
    connection: {
      url: DATABASE_URL,
      authToken: DATABASE_AUTH_TOKEN,
      // Local file: databases fail at once with SQLITE_BUSY by default when a
      // second write transaction starts. Wait for the lock instead, so two
      // submits at the same moment run one after the other. Remote Turso ignores it.
      timeout: 5_000,
    },
    schema,
  });
}

type Db = ReturnType<typeof createDb>;

// Reuse one client across hot reloads in development.
const globalForDb = globalThis as unknown as { __db?: Db };

export function db(): Db {
  globalForDb.__db ??= createDb();
  return globalForDb.__db;
}

export type Transaction = Parameters<Parameters<Db["transaction"]>[0]>[0];
