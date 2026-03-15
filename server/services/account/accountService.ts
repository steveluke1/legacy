import { WalletRepository } from "@/server/repositories/wallets/WalletRepository";
import { ProductRepository } from "@/server/repositories/products/ProductRepository";
import { MarketplaceRepository } from "@/server/repositories/marketplace/MarketplaceRepository";
import { NotificationRepository } from "@/server/repositories/notifications/NotificationRepository";
import { CharacterRepository } from "@/server/repositories/characters/CharacterRepository";

const walletRepository = new WalletRepository();
const productRepository = new ProductRepository();
const marketplaceRepository = new MarketplaceRepository();
const notificationRepository = new NotificationRepository();
const characterRepository = new CharacterRepository();

export class AccountService {
  async getAccountSnapshot(userId: string) {
    const [wallet, ledger, shopOrders, marketOrders, notifications, characters] = await Promise.all([
      walletRepository.findByUserId(userId),
      walletRepository.listLedgerByUserId(userId),
      productRepository.listOrdersByUserId(userId),
      marketplaceRepository.listOrdersByUserId(userId),
      notificationRepository.listByUserId(userId),
      characterRepository.listByOwnerUserId(userId),
    ]);

    return {
      wallet,
      ledger: ledger.slice(0, 5),
      shopOrders: shopOrders.slice(0, 5),
      marketOrders: marketOrders.slice(0, 5),
      notifications: notifications.slice(0, 5),
      characters,
    };
  }
}