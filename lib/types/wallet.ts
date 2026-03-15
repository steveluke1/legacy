export interface WalletRecord {
  userId: string;
  cashBalance: number;
  alzBalance: number;
  premiumTier: "none" | "bronze" | "silver" | "gold";
  updatedAt: string;
}

export interface WalletLedgerRecord {
  id: string;
  userId: string;
  type: "credit" | "debit";
  currency: "cash" | "alz";
  amount: number;
  description: string;
  createdAt: string;
}