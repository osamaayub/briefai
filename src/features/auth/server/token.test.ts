import { describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken } from "./token";

const SECRET = "a".repeat(32);

describe("session token", () => {
  it("round-trips the user id", async () => {
    const token = await signSessionToken({ userId: "u1" }, SECRET);
    expect(await verifySessionToken(token, SECRET)).toEqual({ userId: "u1" });
  });

  it("rejects a token signed with another secret", async () => {
    const token = await signSessionToken({ userId: "u1" }, SECRET);
    expect(await verifySessionToken(token, "b".repeat(32))).toBeNull();
  });

  it("rejects tampered and missing tokens", async () => {
    const token = await signSessionToken({ userId: "u1" }, SECRET);
    expect(await verifySessionToken(token.slice(0, -2) + "xx", SECRET)).toBeNull();
    expect(await verifySessionToken(undefined, SECRET)).toBeNull();
  });
});
