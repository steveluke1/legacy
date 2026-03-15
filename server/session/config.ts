import { ADMIN_SESSION_MAX_AGE_SECONDS, USER_SESSION_MAX_AGE_SECONDS } from "@/lib/constants/auth";
import type { SessionRole } from "@/lib/types/session";

export function getSessionMaxAge(role: SessionRole) {
  return role === "admin" ? ADMIN_SESSION_MAX_AGE_SECONDS : USER_SESSION_MAX_AGE_SECONDS;
}
