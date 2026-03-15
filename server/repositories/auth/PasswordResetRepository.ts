import { JsonFileStore } from "@/server/repositories/base/JsonFileStore";

export interface PasswordResetRecord {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
}

const store = new JsonFileStore<PasswordResetRecord[]>(
  "data/json/password-resets.json",
  "data/seeds/password-resets.seed.json",
  []
);

export class PasswordResetRepository {
  async create(record: PasswordResetRecord) {
    await store.update((records) => [...records, record]);
    return record;
  }

  async findValidByTokenHash(tokenHash: string, nowIso: string) {
    const records = await store.read();
    return (
      records.find(
        (record) => record.tokenHash === tokenHash && !record.usedAt && new Date(record.expiresAt) > new Date(nowIso)
      ) ?? null
    );
  }

  async markUsed(id: string, usedAt: string) {
    await store.update((records) =>
      records.map((record) => (record.id === id ? { ...record, usedAt } : record))
    );
  }
}
