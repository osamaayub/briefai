import "server-only";
import bcrypt from "bcryptjs";

const ROUNDS = 12;
// Compared against when the email does not exist, so a failed login takes
// the same time either way and cannot be used to discover registered emails.
const DUMMY_HASH = "$2b$12$LynWY7IgEm6EZ5OzBEnJ2OqAKh5E9aofbLcpbuMD8Bo.NaKPDZsQC";

export const hashPassword = (plain: string) => bcrypt.hash(plain, ROUNDS);

export async function verifyPassword(plain: string, hash: string | undefined) {
  const ok = await bcrypt.compare(plain, hash ?? DUMMY_HASH);
  return Boolean(hash) && ok;
}
