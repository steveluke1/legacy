import { clearSessionCookie } from "@/server/session/session-cookies";
import { AdminAuthService } from "@/server/services/auth/adminAuthService";
import { jsonOk } from "@/app/api/_lib/http";

const adminAuthService = new AdminAuthService();

export async function POST() {
  await adminAuthService.logout();
  const response = jsonOk();
  clearSessionCookie(response, "admin");
  return response;
}