import { UserAuthService } from "@/server/services/auth/userAuthService";
import { changePasswordSchema } from "@/lib/schemas/user";
import { jsonOk, parseJsonBody, toErrorResponse, unauthorized } from "@/app/api/_lib/http";

const authService = new UserAuthService();

export async function POST(request: Request) {
  try {
    const payload = await parseJsonBody(request, changePasswordSchema);
    const session = await authService.getCurrentSession();

    if (!session?.user) {
      return unauthorized();
    }

    await authService.changePassword(session.user.id, payload.currentPassword, payload.newPassword);
    return jsonOk();
  } catch (error) {
    return toErrorResponse(error, "Falha ao alterar senha.");
  }
}