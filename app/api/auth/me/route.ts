import { UserAuthService } from "@/server/services/auth/userAuthService";
import { jsonOk, unauthorized } from "@/app/api/_lib/http";

const authService = new UserAuthService();

export async function GET() {
  const session = await authService.getCurrentSession();
  if (!session) {
    return unauthorized();
  }

  return jsonOk({ session });
}