import { UserRepository } from "@/server/repositories/users/UserRepository";
import { WalletRepository } from "@/server/repositories/wallets/WalletRepository";
import { MarketplaceRepository } from "@/server/repositories/marketplace/MarketplaceRepository";
import { NotificationRepository } from "@/server/repositories/notifications/NotificationRepository";
import type { AdminDashboardSummary } from "@/lib/types/admin-dashboard";

const userRepository = new UserRepository();
const walletRepository = new WalletRepository();
const marketplaceRepository = new MarketplaceRepository();
const notificationRepository = new NotificationRepository();

export class AdminDashboardService {
  async getSummary(): Promise<AdminDashboardSummary> {
    const [users, wallets, listings, orders] = await Promise.all([
      userRepository.listActive(),
      walletRepository.list(),
      marketplaceRepository.listOpenListings(),
      marketplaceRepository.listOrders(),
    ]);

    const notificationsByUser = await Promise.all(
      users.map((user) => notificationRepository.listByUserId(user.id))
    );

    return {
      activeUsers: users.length,
      openListings: listings.length,
      openOrders: orders.filter((order) => order.status !== "settled").length,
      unreadNotifications: notificationsByUser.flat().filter((notification) => !notification.readAt).length,
      totalCashInCirculation: wallets.reduce((sum, wallet) => sum + wallet.cashBalance, 0),
      totalAlzInCirculation: wallets.reduce((sum, wallet) => sum + wallet.alzBalance, 0),
    };
  }
}
