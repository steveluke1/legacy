import { JsonFileStore } from "@/server/repositories/base/JsonFileStore";
import type { WalletLedgerRecord, WalletRecord } from "@/lib/types/wallet";

const walletStore = new JsonFileStore<WalletRecord[]>("data/json/wallets.json", "data/seeds/wallets.seed.json", []);
const ledgerStore = new JsonFileStore<WalletLedgerRecord[]>("data/json/wallet-ledger.json", "data/seeds/wallet-ledger.seed.json", []);

export class WalletRepository {
  async findByUserId(userId: string) {
    const wallets = await walletStore.read();
    return wallets.find((wallet) => wallet.userId === userId) ?? null;
  }

  async list() {
    return walletStore.read();
  }

  async updateByUserId(userId: string, updater: (wallet: WalletRecord) => WalletRecord) {
    let updated: WalletRecord | null = null;
    await walletStore.update((wallets) =>
      wallets.map((wallet) => {
        if (wallet.userId !== userId) {
          return wallet;
        }

        updated = updater(wallet);
        return updated;
      })
    );
    return updated;
  }

  async appendLedger(record: WalletLedgerRecord) {
    await ledgerStore.update((current) => [record, ...current]);
    return record;
  }

  async listLedgerByUserId(userId: string) {
    const entries = await ledgerStore.read();
    return entries.filter((entry) => entry.userId === userId);
  }
}