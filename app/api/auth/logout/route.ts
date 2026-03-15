import { clearSessionCookie } from "@/server/session/session-cookies";
import { UserAuthService } from "@/server/services/auth/userAuthService";
import { jsonOk } from "@/app/api/_lib/http";

const authService = new UserAuthService();

export async function POST() {
  await authService.logout();
  const response = jsonOk();
  clearSessionCookie(response, "user");
  return response;
}