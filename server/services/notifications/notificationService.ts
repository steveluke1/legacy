import { NotificationRepository } from "@/server/repositories/notifications/NotificationRepository";

const notificationRepository = new NotificationRepository();

export class NotificationService {
  listByUserId(userId: string) {
    return notificationRepository.listByUserId(userId);
  }

  markRead(userId: string, notificationId: string) {
    return notificationRepository.markRead(userId, notificationId);
  }

  markAllRead(userId: string) {
    return notificationRepository.markAllRead(userId);
  }
}