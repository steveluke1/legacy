import { UserAuthService } from "@/server/services/auth/userAuthService";
import { NotificationService } from "@/server/services/notifications/notificationService";
import { markNotificationSchema } from "@/lib/schemas/notification";
import { jsonOk, parseJsonBody, toErrorResponse, unauthorized } from "@/app/api/_lib/http";

const authService = new UserAuthService();
const notificationService = new NotificationService();

export async function POST(request: Request) {
  try {
    const session = await authService.getCurrentSession();
    if (!session?.user) {
      return unauthorized();
    }

    const payload = await parseJsonBody(request, markNotificationSchema);
    await notificationService.markRead(session.user.id, payload.notificationId);
    return jsonOk();
  } catch (error) {
    return toErrorResponse(error, "Falha ao marcar notificacao.");
  }
}