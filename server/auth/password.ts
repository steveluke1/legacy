import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string, salt = randomBytes(16).toString("base64url")) {
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, storedValue] = storedHash.split("$");

  if (algorithm !== "scrypt" || !salt || !storedValue) {
    return false;
  }

  const computed = scryptSync(password, salt, 64).toString("base64url");
  return timingSafeEqual(Buffer.from(computed), Buffer.from(storedValue));
}
