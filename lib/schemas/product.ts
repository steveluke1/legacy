import { z } from "zod";

export const purchasePremiumSchema = z.object({
  planId: z.string().min(2),
});