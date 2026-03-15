import { UserAuthService } from "@/server/services/auth/userAuthService";
import { NotificationService } from "@/server/services/notifications/notificationService";
import { jsonOk, unauthorized } from "@/app/api/_lib/http";

const authService = new UserAuthService();
const notificationService = new NotificationService();

export async function POST() {
  const session = await authService.getCurrentSession();
  if (!session?.user) {
    return unauthorized();
  }

  await notificationService.markAllRead(session.user.id);
  return jsonOk();
}