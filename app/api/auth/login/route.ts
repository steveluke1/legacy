import { setSessionCookie } from "@/server/session/session-cookies";
import { UserAuthService } from "@/server/services/auth/userAuthService";
import { getRequestMeta, jsonOk, parseJsonBody, toErrorResponse } from "@/app/api/_lib/http";
import { userLoginSchema } from "@/lib/schemas/user";

const authService = new UserAuthService();

export async function POST(request: Request) {
  try {
    const payload = await parseJsonBody(request, userLoginSchema);
    const result = await authService.login(payload, getRequestMeta(request));
    const response = jsonOk({ user: result.user });
    setSessionCookie(response, "user", result.token, result.expiresAt);
    return response;
  } catch (error) {
    return toErrorResponse(error, "Falha no login de usuario.");
  }
}