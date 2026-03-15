import { z } from "zod";

export const userLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export const userRegisterSchema = z.object({
  email: z.string().trim().email(),
  username: z.string().trim().min(3).max(24).regex(/^[a-z0-9_]+$/i),
  displayName: z.string().trim().min(3).max(40),
  password: z.string().min(8),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email(),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().trim().min(12),
  newPassword: z.string().min(8),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});
