import { beforeEach, describe, expect, it } from "vitest";

import { ProductRepository } from "@/server/repositories/products/ProductRepository";
import { MarketplaceRepository } from "@/server/repositories/marketplace/MarketplaceRepository";
import { WalletRepository } from "@/server/repositories/wallets/WalletRepository";
import { AdminDashboardService } from "@/server/services/admin/adminDashboardService";
import { MarketplaceService } from "@/server/services/marketplace/marketplaceService";
import { NotificationService } from "@/server/services/notifications/notificationService";
import { ShopService } from "@/server/services/shop/shopService";
import { resetLocalState } from "@/tests/unit/helpers/reset-local-state";

describe("domain services", () => {
  beforeEach(() => {
    resetLocalState();
  });

  it("activates premium locally and records the shop order", async () => {
    const service = new ShopService();
    const walletRepository = new WalletRepository();
    const productRepository = new ProductRepository();

    const order = await service.purchasePremium("user_demo_neutral", "premium_bronze");
    const wallet = await walletRepository.findByUserId("user_demo_neutral");
    const orders = await productRepository.listOrdersByUserId("user_demo_neutral");

    expect(order.kind).toBe("premium");
    expect(wallet?.premiumTier).toBe("bronze");
    expect(wallet?.cashBalance).toBe(4100);
    expect(orders[0]?.id).toBe(order.id);
  });

  it("settles a marketplace purchase and updates listing plus wallet", async () => {
    const service = new MarketplaceService();
    const walletRepository = new WalletRepository();
    const marketplaceRepository = new MarketplaceRepository();

    const order = await service.purchaseListing("user_demo_neutral", "listing_alz_1", "char_neutral_guard");
    const wallet = await walletRepository.findByUserId("user_demo_neutral");
    const listing = await marketplaceRepository.findListingById("listing_alz_1");

    expect(order.status).toBe("settled");
    expect(wallet?.alzBalance).toBe(6500);
    expect(listing?.status).toBe("sold");
  });

  it("marks all notifications as read for one user only", async () => {
    const service = new NotificationService();

    await service.markAllRead("user_demo_buyer");

    const buyerNotifications = await service.listByUserId("user_demo_buyer");
    const sellerNotifications = await service.listByUserId("user_demo_seller");

    expect(buyerNotifications.every((entry) => entry.readAt)).toBe(true);
    expect(sellerNotifications.some((entry) => entry.readAt === null)).toBe(true);
  });

  it("builds the deterministic admin summary from local stores", async () => {
    const service = new AdminDashboardService();
    const summary = await service.getSummary();

    expect(summary).toMatchObject({
      activeUsers: 3,
      openListings: 2,
      unreadNotifications: 3,
      totalCashInCirculation: 69000,
      totalAlzInCirculation: 134400,
    });
  });
});