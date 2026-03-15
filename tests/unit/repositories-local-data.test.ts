import { beforeEach, describe, expect, it } from "vitest";

import { MarketplaceRepository } from "@/server/repositories/marketplace/MarketplaceRepository";
import { NotificationRepository } from "@/server/repositories/notifications/NotificationRepository";
import { WalletRepository } from "@/server/repositories/wallets/WalletRepository";
import { resetLocalState } from "@/tests/unit/helpers/reset-local-state";

describe("local repositories", () => {
  beforeEach(() => {
    resetLocalState();
  });

  it("reads seed data and appends wallet ledger entries", async () => {
    const repository = new WalletRepository();
    const wallet = await repository.findByUserId("user_demo_buyer");

    expect(wallet?.cashBalance).toBe(42000);

    await repository.appendLedger({
      id: "ledger_test_local",
      userId: "user_demo_buyer",
      type: "debit",
      currency: "cash",
      amount: 123,
      description: "Teste local de ledger",
      createdAt: "2026-03-12T11:00:00.000Z",
    });

    const ledger = await repository.listLedgerByUserId("user_demo_buyer");
    expect(ledger[0]?.id).toBe("ledger_test_local");
  });

  it("marks one notification as read without touching another user", async () => {
    const repository = new NotificationRepository();

    const updated = await repository.markRead("user_demo_buyer", "notif_1");
    const buyerNotifications = await repository.listByUserId("user_demo_buyer");
    const sellerNotifications = await repository.listByUserId("user_demo_seller");

    expect(updated).not.toBeNull();
    if (!updated) {
      throw new Error("Expected notif_1 to be updated");
    }

    expect(updated.readAt).not.toBeNull();
    expect(buyerNotifications.find((entry) => entry.id === "notif_1")?.readAt).not.toBeNull();
    expect(sellerNotifications.some((entry) => entry.readAt === null)).toBe(true);
  });

  it("creates marketplace listings and orders in local JSON stores", async () => {
    const repository = new MarketplaceRepository();

    await repository.createListing({
      id: "listing_test_local",
      sellerUserId: "user_demo_buyer",
      sellerCharacterId: "char_buyer_mage",
      sellerName: "Astra Lyra",
      title: "Listing de teste",
      description: "Criada direto pelo repository para validar persistencia.",
      unitPriceBrl: 0.03,
      alzAmount: 5000,
      status: "open",
      createdAt: "2026-03-12T11:05:00.000Z",
    });

    await repository.createOrder({
      id: "order_test_local",
      listingId: "listing_test_local",
      buyerUserId: "user_demo_neutral",
      sellerUserId: "user_demo_buyer",
      sellerCharacterId: "char_buyer_mage",
      buyerCharacterId: "char_neutral_guard",
      sellerName: "Astra Lyra",
      alzAmount: 5000,
      grossBrl: 150,
      marketFeeBrl: 9,
      netBrl: 141,
      status: "settled",
      createdAt: "2026-03-12T11:06:00.000Z",
    });

    const listings = await repository.listListings();
    const orders = await repository.listOrdersByUserId("user_demo_neutral");

    expect(listings.some((entry) => entry.id === "listing_test_local")).toBe(true);
    expect(orders.some((entry) => entry.id === "order_test_local")).toBe(true);
  });
});