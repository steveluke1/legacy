import { randomUUID } from "node:crypto";

import { ProductRepository } from "@/server/repositories/products/ProductRepository";
import { WalletRepository } from "@/server/repositories/wallets/WalletRepository";

const productRepository = new ProductRepository();
const walletRepository = new WalletRepository();

export class ShopService {
  async getShopSnapshot(userId: string) {
    const [dataset, wallet, orders] = await Promise.all([
      productRepository.readDataset(),
      walletRepository.findByUserId(userId),
      productRepository.listOrdersByUserId(userId),
    ]);

    return {
      ...dataset,
      wallet,
      orders,
    };
  }

  async purchasePremium(userId: string, planId: string) {
    const [plan, wallet] = await Promise.all([
      productRepository.findPlanById(planId),
      walletRepository.findByUserId(userId),
    ]);

    if (!plan) {
      throw new Error("Plano premium nao encontrado.");
    }

    if (!wallet || wallet.cashBalance < plan.priceCash) {
      throw new Error("Saldo de CASH insuficiente para ativar o premium.");
    }

    const now = new Date().toISOString();
    await walletRepository.updateByUserId(userId, (current) => ({
      ...current,
      cashBalance: current.cashBalance - plan.priceCash,
      premiumTier: plan.tier,
      updatedAt: now,
    }));

    await walletRepository.appendLedger({
      id: `ledger_${randomUUID()}`,
      userId,
      type: "debit",
      currency: "cash",
      amount: plan.priceCash,
      description: `Compra do plano ${plan.name}`,
      createdAt: now,
    });

    return productRepository.createOrder({
      id: `shop_order_${randomUUID()}`,
      userId,
      productId: plan.id,
      kind: "premium",
      totalCash: plan.priceCash,
      createdAt: now,
      status: "completed",
    });
  }
}