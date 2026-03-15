import { JsonFileStore } from "@/server/repositories/base/JsonFileStore";
import type { PremiumPlanRecord, ShopOrderRecord, ShopProductRecord } from "@/lib/types/product";

interface ProductDataset {
  premiumPlans: PremiumPlanRecord[];
  catalog: ShopProductRecord[];
}

const productStore = new JsonFileStore<ProductDataset>("data/json/products.json", "data/seeds/products.seed.json", {
  premiumPlans: [],
  catalog: [],
});
const orderStore = new JsonFileStore<ShopOrderRecord[]>("data/json/shop-orders.json", "data/seeds/shop-orders.seed.json", []);

export class ProductRepository {
  async readDataset() {
    return productStore.read();
  }

  async findPlanById(planId: string) {
    const dataset = await productStore.read();
    return dataset.premiumPlans.find((plan) => plan.id === planId) ?? null;
  }

  async createOrder(order: ShopOrderRecord) {
    await orderStore.update((current) => [order, ...current]);
    return order;
  }

  async listOrdersByUserId(userId: string) {
    const orders = await orderStore.read();
    return orders.filter((order) => order.userId === userId);
  }
}