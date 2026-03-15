export type SessionRole = "user" | "admin";

export interface SessionRecord {
  id: string;
  tokenHash: string;
  subjectId: string;
  role: SessionRole;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}
