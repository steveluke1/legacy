export interface MarketplaceListingRecord {
  id: string;
  sellerUserId: string;
  sellerCharacterId: string;
  sellerName: string;
  title: string;
  description: string;
  unitPriceBrl: number;
  alzAmount: number;
  status: "open" | "sold" | "cancelled";
  createdAt: string;
}

export interface MarketplaceOrderRecord {
  id: string;
  listingId: string;
  buyerUserId: string;
  sellerUserId: string;
  sellerCharacterId: string;
  buyerCharacterId: string;
  sellerName: string;
  alzAmount: number;
  grossBrl: number;
  marketFeeBrl: number;
  netBrl: number;
  status: "awaiting_payment" | "paid" | "settled";
  createdAt: string;
}

export interface MarketSettingsRecord {
  feePercent: number;
  settlementWindowHours: number;
}