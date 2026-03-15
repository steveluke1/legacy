import { JsonFileStore } from "@/server/repositories/base/JsonFileStore";
import type { MarketSettingsRecord, MarketplaceListingRecord, MarketplaceOrderRecord } from "@/lib/types/marketplace";

const listingStore = new JsonFileStore<MarketplaceListingRecord[]>("data/json/marketplace-listings.json", "data/seeds/marketplace-listings.seed.json", []);
const orderStore = new JsonFileStore<MarketplaceOrderRecord[]>("data/json/marketplace-orders.json", "data/seeds/marketplace-orders.seed.json", []);
const settingsStore = new JsonFileStore<MarketSettingsRecord>("data/json/market-settings.json", "data/seeds/market-settings.seed.json", {
  feePercent: 6,
  settlementWindowHours: 2,
});

export class MarketplaceRepository {
  async listListings() {
    return listingStore.read();
  }

  async listOpenListings() {
    const listings = await listingStore.read();
    return listings.filter((listing) => listing.status === "open");
  }

  async findListingById(id: string) {
    const listings = await listingStore.read();
    return listings.find((listing) => listing.id === id) ?? null;
  }

  async createListing(listing: MarketplaceListingRecord) {
    await listingStore.update((current) => [listing, ...current]);
    return listing;
  }

  async updateListing(id: string, updater: (listing: MarketplaceListingRecord) => MarketplaceListingRecord) {
    let updated: MarketplaceListingRecord | null = null;
    await listingStore.update((listings) =>
      listings.map((listing) => {
        if (listing.id !== id) {
          return listing;
        }

        updated = updater(listing);
        return updated;
      })
    );
    return updated;
  }

  async createOrder(order: MarketplaceOrderRecord) {
    await orderStore.update((current) => [order, ...current]);
    return order;
  }

  async listOrders() {
    return orderStore.read();
  }

  async listOrdersByUserId(userId: string) {
    const orders = await orderStore.read();
    return orders.filter((order) => order.buyerUserId === userId || order.sellerUserId === userId);
  }

  async readSettings() {
    return settingsStore.read();
  }
}