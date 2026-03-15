import { randomUUID } from "node:crypto";

import type { AdminPublic, AdminRecord } from "@/lib/types/admin";
import { AdminRepository } from "@/server/repositories/admins/AdminRepository";
import { SessionRepository } from "@/server/repositories/sessions/SessionRepository";
import { verifyPassword } from "@/server/auth/password";
import { generateSessionToken, hashSessionToken, readSessionCookie } from "@/server/session/session-cookies";
import { getSessionMaxAge } from "@/server/session/config";

export interface AdminRequestMeta {
  ipAddress: string | null;
  userAgent: string | null;
}

const adminRepository = new AdminRepository();
const sessionRepository = new SessionRepository();

function toPublicAdmin(admin: AdminRecord): AdminPublic {
  return {
    id: admin.id,
    email: admin.email,
    displayName: admin.displayName,
    status: admin.status,
    role: admin.role,
    permissions: admin.permissions,
  };
}

function buildExpiry(role: "admin") {
  return new Date(Date.now() + getSessionMaxAge(role) * 1000).toISOString();
}

export class AdminAuthService {
  async login(input: { email: string; password: string }, meta: AdminRequestMeta) {
    const admin = await adminRepository.findByEmail(input.email);

    if (!admin || admin.status !== "active" || !verifyPassword(input.password, admin.passwordHash)) {
      throw new Error("Credenciais administrativas invalidas.");
    }

    const now = new Date().toISOString();
    await adminRepository.update(admin.id, (current) => ({
      ...current,
      lastLoginAt: now,
      updatedAt: now,
    }));

    const refreshed = (await adminRepository.findById(admin.id)) ?? admin;
    return this.createSession(refreshed, meta);
  }

  async logout() {
    const token = await readSessionCookie("admin");
    if (!token) {
      return false;
    }

    return sessionRepository.revokeByTokenHash(hashSessionToken(token), new Date().toISOString());
  }

  async getCurrentSession() {
    const token = await readSessionCookie("admin");
    if (!token) {
      return null;
    }

    const session = await sessionRepository.findByTokenHash(hashSessionToken(token));
    if (!session || session.revokedAt || new Date(session.expiresAt) <= new Date()) {
      return null;
    }

    const admin = await adminRepository.findById(session.subjectId);
    if (!admin || admin.status !== "active") {
      return null;
    }

    return {
      role: "admin" as const,
      sessionId: session.id,
      expiresAt: session.expiresAt,
      admin: toPublicAdmin(admin),
    };
  }

  private async createSession(admin: AdminRecord, meta: AdminRequestMeta) {
    const token = generateSessionToken();
    const expiresAt = buildExpiry("admin");

    await sessionRepository.create({
      id: `session_admin_${randomUUID()}`,
      tokenHash: hashSessionToken(token),
      subjectId: admin.id,
      role: "admin",
      issuedAt: new Date().toISOString(),
      expiresAt,
      revokedAt: null,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return {
      token,
      expiresAt,
      admin: toPublicAdmin(admin),
    };
  }
}
