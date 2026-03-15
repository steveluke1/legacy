import { randomUUID } from "node:crypto";

import { UserRepository } from "@/server/repositories/users/UserRepository";
import {
  PasswordResetRepository,
  type PasswordResetRecord,
} from "@/server/repositories/auth/PasswordResetRepository";
import { hashPassword } from "@/server/auth/password";
import { hashSessionToken } from "@/server/session/session-cookies";

const userRepository = new UserRepository();
const passwordResetRepository = new PasswordResetRepository();

export class PasswordResetService {
  async request(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user || user.status !== "active") {
      return { requested: true, token: null as string | null };
    }

    const token = `${randomUUID()}${randomUUID()}`.replace(/-/g, "");
    const now = new Date();

    const record: PasswordResetRecord = {
      id: `reset_${randomUUID()}`,
      userId: user.id,
      tokenHash: hashSessionToken(token),
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 1000 * 60 * 30).toISOString(),
      usedAt: null,
    };

    await passwordResetRepository.create(record);

    return {
      requested: true,
      token,
    };
  }

  async confirm(token: string, newPassword: string) {
    const now = new Date().toISOString();
    const record = await passwordResetRepository.findValidByTokenHash(hashSessionToken(token), now);

    if (!record) {
      throw new Error("Token de reset invalido ou expirado.");
    }

    await userRepository.update(record.userId, (user) => ({
      ...user,
      passwordHash: hashPassword(newPassword),
      passwordUpdatedAt: now,
      updatedAt: now,
    }));

    await passwordResetRepository.markUsed(record.id, now);
  }
}
