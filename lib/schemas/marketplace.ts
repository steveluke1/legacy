import { z } from "zod";

export const createListingSchema = z.object({
  sellerCharacterId: z.string().min(2),
  title: z.string().trim().min(4).max(80),
  description: z.string().trim().min(8).max(240),
  unitPriceBrl: z.coerce.number().positive(),
  alzAmount: z.coerce.number().int().positive(),
});

export const createOrderSchema = z.object({
  listingId: z.string().min(2),
  buyerCharacterId: z.string().min(2),
});