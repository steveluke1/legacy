export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  body: string;
  kind: "order" | "wallet" | "system" | "shop";
  readAt: string | null;
  createdAt: string;
}