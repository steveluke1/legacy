import { redirect } from "next/navigation";

import type { AdminPublic } from "@/lib/types/admin";
import type { SessionRole } from "@/lib/types/session";
import type { UserPublic } from "@/lib/types/user";
import { AdminAuthService } from "@/server/services/auth/adminAuthService";
import { UserAuthService } from "@/server/services/auth/userAuthService";

export interface AuthGuardResult {
  role: SessionRole;
  sessionId: string;
  expiresAt: string;
  user?: UserPublic;
  admin?: AdminPublic;
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

const userAuthService = new UserAuthService();
const adminAuthService = new AdminAuthService();

export async function requireUserSession() {
  const session = await userAuthService.getCurrentSession();

  if (!session) {
    redirect("/entrar");
  }

  return session;
}

export async function requireAdminSession() {
  const session = await adminAuthService.getCurrentSession();

  if (!session) {
    redirect("/admin/entrar");
  }

  return session;
}

export function assertAdminPermission(session: AuthGuardResult, permission: string) {
  if (!session.admin?.permissions.includes(permission)) {
    throw new AuthorizationError("Permissao administrativa insuficiente.");
  }
}
