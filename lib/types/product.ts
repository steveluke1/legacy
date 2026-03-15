export interface PremiumPlanRecord {
  id: string;
  name: string;
  priceCash: number;
  durationDays: number;
  perks: string[];
  tier: "bronze" | "silver" | "gold";
}

export interface ShopProductRecord {
  id: string;
  name: string;
  description: string;
  priceCash: number;
  category: "utility" | "box" | "cosmetic";
}

export interface ShopOrderRecord {
  id: string;
  userId: string;
  productId: string;
  kind: "premium" | "catalog";
  totalCash: number;
  createdAt: string;
  status: "completed";
}