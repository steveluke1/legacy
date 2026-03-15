import { randomUUID } from "node:crypto";

import type { UserPublic, UserRecord } from "@/lib/types/user";
import { UserRepository } from "@/server/repositories/users/UserRepository";
import { SessionRepository } from "@/server/repositories/sessions/SessionRepository";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { generateSessionToken, hashSessionToken, readSessionCookie } from "@/server/session/session-cookies";
import { getSessionMaxAge } from "@/server/session/config";

export interface RequestMeta {
  ipAddress: string | null;
  userAgent: string | null;
}

const userRepository = new UserRepository();
const sessionRepository = new SessionRepository();

function toPublicUser(user: UserRecord): UserPublic {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    status: user.status,
    role: user.role,
  };
}

function buildExpiry(role: "user") {
  return new Date(Date.now() + getSessionMaxAge(role) * 1000).toISOString();
}

export class UserAuthService {
  async register(input: { email: string; username: string; displayName: string; password: string }, meta: RequestMeta) {
    const existingByEmail = await userRepository.findByEmail(input.email);
    if (existingByEmail) {
      throw new Error("Ja existe uma conta de usuario com este e-mail.");
    }

    const existingByUsername = await userRepository.findByUsername(input.username);
    if (existingByUsername) {
      throw new Error("Ja existe uma conta de usuario com este username.");
    }

    const now = new Date().toISOString();
    const user: UserRecord = {
      id: `user_${randomUUID()}`,
      email: input.email.trim().toLowerCase(),
      username: input.username.trim().toLowerCase(),
      displayName: input.displayName.trim(),
      passwordHash: hashPassword(input.password),
      status: "active",
      role: "user",
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      passwordUpdatedAt: now,
    };

    await userRepository.create(user);
    return this.createSession(user, meta);
  }

  async login(input: { email: string; password: string }, meta: RequestMeta) {
    const user = await userRepository.findByEmail(input.email);

    if (!user || user.status !== "active" || !verifyPassword(input.password, user.passwordHash)) {
      throw new Error("Credenciais de usuario invalidas.");
    }

    const now = new Date().toISOString();
    await userRepository.update(user.id, (current) => ({
      ...current,
      lastLoginAt: now,
      updatedAt: now,
    }));

    const refreshed = (await userRepository.findById(user.id)) ?? user;
    return this.createSession(refreshed, meta);
  }

  async logout() {
    const token = await readSessionCookie("user");
    if (!token) {
      return false;
    }

    return sessionRepository.revokeByTokenHash(hashSessionToken(token), new Date().toISOString());
  }

  async getCurrentSession() {
    const token = await readSessionCookie("user");
    if (!token) {
      return null;
    }

    const session = await sessionRepository.findByTokenHash(hashSessionToken(token));
    if (!session || session.revokedAt || new Date(session.expiresAt) <= new Date()) {
      return null;
    }

    const user = await userRepository.findById(session.subjectId);
    if (!user || user.status !== "active") {
      return null;
    }

    return {
      role: "user" as const,
      sessionId: session.id,
      expiresAt: session.expiresAt,
      user: toPublicUser(user),
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await userRepository.findById(userId);
    if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
      throw new Error("Senha atual invalida.");
    }

    const now = new Date().toISOString();
    await userRepository.update(userId, (current) => ({
      ...current,
      passwordHash: hashPassword(newPassword),
      passwordUpdatedAt: now,
      updatedAt: now,
    }));
  }

  private async createSession(user: UserRecord, meta: RequestMeta) {
    const token = generateSessionToken();
    const expiresAt = buildExpiry("user");

    await sessionRepository.create({
      id: `session_user_${randomUUID()}`,
      tokenHash: hashSessionToken(token),
      subjectId: user.id,
      role: "user",
      issuedAt: new Date().toISOString(),
      expiresAt,
      revokedAt: null,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return {
      token,
      expiresAt,
      user: toPublicUser(user),
    };
  }
}
