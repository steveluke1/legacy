import { setSessionCookie } from "@/server/session/session-cookies";
import { AdminAuthService } from "@/server/services/auth/adminAuthService";
import { getRequestMeta, jsonOk, parseJsonBody, toErrorResponse } from "@/app/api/_lib/http";
import { adminLoginSchema } from "@/lib/schemas/admin";

const adminAuthService = new AdminAuthService();

export async function POST(request: Request) {
  try {
    const payload = await parseJsonBody(request, adminLoginSchema);
    const result = await adminAuthService.login(payload, getRequestMeta(request));
    const response = jsonOk({ admin: result.admin });
    setSessionCookie(response, "admin", result.token, result.expiresAt);
    return response;
  } catch (error) {
    return toErrorResponse(error, "Falha no login admin.");
  }
}