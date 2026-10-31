import { describe, expect, it } from "vitest";
import { LoginSchema, SignupSchema } from "./schemas";

describe("auth schemas", () => {
  it("normalises email", () => {
    const r = LoginSchema.parse({ email: "  Osama@Example.COM ", password: "x" });
    expect(r.email).toBe("osama@example.com");
  });

  it("requires an 8+ character password on sign up", () => {
    const r = SignupSchema.safeParse({ name: "Osama", email: "a@b.co", password: "short" });
    expect(r.success).toBe(false);
  });
});
