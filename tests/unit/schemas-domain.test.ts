import { describe, expect, it } from "vitest";

import { createListingSchema, createOrderSchema } from "@/lib/schemas/marketplace";
import { markNotificationSchema } from "@/lib/schemas/notification";
import { purchasePremiumSchema } from "@/lib/schemas/product";

describe("domain schemas", () => {
  it("accepts valid marketplace inputs", () => {
    expect(
      createListingSchema.parse({
        sellerCharacterId: "char_buyer_mage",
        title: "Lote local 15k ALZ",
        description: "Oferta seeded para validar o schema do marketplace.",
        unitPriceBrl: "0.028",
        alzAmount: "15000",
      }),
    ).toMatchObject({
      sellerCharacterId: "char_buyer_mage",
      alzAmount: 15000,
    });

    expect(
      createOrderSchema.parse({
        listingId: "listing_alz_1",
        buyerCharacterId: "char_neutral_guard",
      }),
    ).toMatchObject({
      listingId: "listing_alz_1",
      buyerCharacterId: "char_neutral_guard",
    });
  });

  it("rejects invalid marketplace listing payloads", () => {
    expect(() =>
      createListingSchema.parse({
        sellerCharacterId: "x",
        title: "bad",
        description: "short",
        unitPriceBrl: 0,
        alzAmount: 0,
      }),
    ).toThrow();
  });

  it("validates premium purchase and notification payloads", () => {
    expect(purchasePremiumSchema.parse({ planId: "premium_bronze" }).planId).toBe("premium_bronze");
    expect(markNotificationSchema.parse({ notificationId: "notif_1" }).notificationId).toBe("notif_1");
    expect(() => markNotificationSchema.parse({ notificationId: "x" })).toThrow();
  });
});