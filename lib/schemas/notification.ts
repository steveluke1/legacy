import { z } from "zod";

export const markNotificationSchema = z.object({
  notificationId: z.string().min(3),
});