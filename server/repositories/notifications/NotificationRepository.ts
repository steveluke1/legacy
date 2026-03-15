import { JsonFileStore } from "@/server/repositories/base/JsonFileStore";
import type { NotificationRecord } from "@/lib/types/notification";

const store = new JsonFileStore<NotificationRecord[]>("data/json/notifications.json", "data/seeds/notifications.seed.json", []);

export class NotificationRepository {
  async listByUserId(userId: string): Promise<NotificationRecord[]> {
    const notifications = await store.read();
    return notifications.filter((notification) => notification.userId === userId);
  }

  async markRead(userId: string, notificationId: string): Promise<NotificationRecord | null> {
    let updated: NotificationRecord | null = null;
    await store.update((notifications) =>
      notifications.map((notification) => {
        if (notification.userId !== userId || notification.id !== notificationId) {
          return notification;
        }

        updated = {
          ...notification,
          readAt: notification.readAt ?? new Date().toISOString(),
        };
        return updated;
      })
    );
    return updated;
  }

  async markAllRead(userId: string): Promise<void> {
    const timestamp = new Date().toISOString();
    await store.update((notifications) =>
      notifications.map((notification) =>
        notification.userId === userId && !notification.readAt ? { ...notification, readAt: timestamp } : notification
      )
    );
  }
}