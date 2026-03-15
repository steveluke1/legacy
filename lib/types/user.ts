export type UserRole = "user";
export type UserStatus = "active" | "inactive" | "suspended";

export interface UserRecord {
  id: string;
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  passwordUpdatedAt: string;
}

export interface UserPublic {
  id: string;
  email: string;
  username: string;
  displayName: string;
  status: UserStatus;
  role: UserRole;
}
