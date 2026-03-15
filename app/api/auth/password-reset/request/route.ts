import { PasswordResetService } from "@/server/services/auth/passwordResetService";
import { passwordResetRequestSchema } from "@/lib/schemas/user";
import { jsonOk, parseJsonBody, toErrorResponse } from "@/app/api/_lib/http";

const passwordResetService = new PasswordResetService();

export async function POST(request: Request) {
  try {
    const payload = await parseJsonBody(request, passwordResetRequestSchema);
    const result = await passwordResetService.request(payload.email);
    return jsonOk({ requested: result.requested, localOnlyToken: result.token });
  } catch (error) {
    return toErrorResponse(error, "Falha ao solicitar reset.");
  }
}