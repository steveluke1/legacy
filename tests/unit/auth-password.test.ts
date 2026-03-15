import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/server/auth/password";

describe("password hashing", () => {
  it("hashes and verifies a password with scrypt", () => {
    const hash = hashPassword("secret123", "fixed-salt");

    expect(hash.startsWith("scrypt$fixed-salt$")).toBe(true);
    expect(verifyPassword("secret123", hash)).toBe(true);
    expect(verifyPassword("wrong-secret", hash)).toBe(false);
  });
});
