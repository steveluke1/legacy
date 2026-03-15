import { AdminAuthService } from "@/server/services/auth/adminAuthService";
import { jsonOk, unauthorized } from "@/app/api/_lib/http";

const adminAuthService = new AdminAuthService();

export async function GET() {
  const session = await adminAuthService.getCurrentSession();
  if (!session) {
    return unauthorized();
  }

  return jsonOk({ session });
}