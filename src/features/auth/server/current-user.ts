import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSession } from "./session";
import { userRepository, type PublicUser } from "./user-repository";

/**
 * Data Access Layer entry point: turns the session cookie into a user.
 * `cache` dedupes the lookup within a single request, so pages, layouts
 * and actions can all call it without extra database queries.
 */
export const getCurrentUser = cache(async (): Promise<PublicUser> => {
  const session = await readSession();
  if (!session) redirect("/login");

  const user = await userRepository.findById(session.userId);
  if (!user) redirect("/login");

  return user;
});
