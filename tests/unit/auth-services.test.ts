import { beforeEach, describe, expect, it } from "vitest";

import { hashSessionToken } from "@/server/session/session-cookies";
import { SessionRepository } from "@/server/repositories/sessions/SessionRepository";
import { AdminAuthService } from "@/server/services/auth/adminAuthService";
import { PasswordResetService } from "@/server/services/auth/passwordResetService";
import { UserAuthService } from "@/server/services/auth/userAuthService";
import { UserRepository } from "@/server/repositories/users/UserRepository";
import { resetLocalState } from "@/tests/unit/helpers/reset-local-state";

describe("auth services", () => {
  beforeEach(() => {
    resetLocalState();
  });

  it("creates a user session from deterministic local credentials", async () => {
    const service = new UserAuthService();
    const sessionRepository = new SessionRepository();

    const result = await service.login(
      {
        email: "buyer@legacy.local",
        password: "buyer123",
      },
      {
        ipAddress: "127.0.0.1",
        userAgent: "vitest",
      },
    );

    const storedSession = await sessionRepository.findByTokenHash(hashSessionToken(result.token));

    expect(result.user.displayName).toBe("Buyer Demo");
    expect(storedSession?.subjectId).toBe("user_demo_buyer");
    expect(storedSession?.role).toBe("user");
  });

  it("creates an admin session from deterministic local credentials", async () => {
    const service = new AdminAuthService();
    const sessionRepository = new SessionRepository();

    const result = await service.login(
      {
        email: "admin@legacy.local",
        password: "admin123",
      },
      {
        ipAddress: "127.0.0.1",
        userAgent: "vitest",
      },
    );

    const storedSession = await sessionRepository.findByTokenHash(hashSessionToken(result.token));

    expect(result.admin.displayName).toBe("Admin Demo");
    expect(storedSession?.subjectId).toBe("admin_demo_primary");
    expect(storedSession?.role).toBe("admin");
  });

  it("registers a new local user and creates a session", async () => {
    const service = new UserAuthService();
    const sessionRepository = new SessionRepository();

    const result = await service.register(
      {
        email: "novo@legacy.local",
        username: "novo_local",
        displayName: "Novo Local",
        password: "novaSenha123",
      },
      {
        ipAddress: "127.0.0.1",
        userAgent: "vitest",
      },
    );

    const storedSession = await sessionRepository.findByTokenHash(hashSessionToken(result.token));

    expect(result.user.email).toBe("novo@legacy.local");
    expect(result.user.displayName).toBe("Novo Local");
    expect(storedSession?.role).toBe("user");
  });

  it("requests and confirms a local password reset token", async () => {
    const passwordResetService = new PasswordResetService();
    const userRepository = new UserRepository();
    const userAuthService = new UserAuthService();

    const request = await passwordResetService.request("buyer@legacy.local");
    expect(request.requested).toBe(true);
    expect(request.token).toBeTruthy();

    await passwordResetService.confirm(request.token!, "buyer45678");

    const login = await userAuthService.login(
      {
        email: "buyer@legacy.local",
        password: "buyer45678",
      },
      {
        ipAddress: "127.0.0.1",
        userAgent: "vitest",
      },
    );

    const updatedUser = await userRepository.findById(login.user.id);
    expect(login.user.displayName).toBe("Buyer Demo");
    expect(updatedUser?.passwordUpdatedAt).toBeTruthy();
  });
});

