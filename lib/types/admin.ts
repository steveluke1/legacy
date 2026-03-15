export type AdminRole = "admin";
export type AdminStatus = "active" | "inactive" | "suspended";

export interface AdminRecord {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  status: AdminStatus;
  role: AdminRole;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  passwordUpdatedAt: string;
}

export interface AdminPublic {
  id: string;
  email: string;
  displayName: string;
  status: AdminStatus;
  role: AdminRole;
  permissions: string[];
}
