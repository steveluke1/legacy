import { PasswordResetService } from "@/server/services/auth/passwordResetService";
import { passwordResetConfirmSchema } from "@/lib/schemas/user";
import { jsonOk, parseJsonBody, toErrorResponse } from "@/app/api/_lib/http";

const passwordResetService = new PasswordResetService();

export async function POST(request: Request) {
  try {
    const payload = await parseJsonBody(request, passwordResetConfirmSchema);
    await passwordResetService.confirm(payload.token, payload.newPassword);
    return jsonOk();
  } catch (error) {
    return toErrorResponse(error, "Falha ao confirmar reset.");
  }
}