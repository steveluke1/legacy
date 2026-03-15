import { JsonFileStore } from "@/server/repositories/base/JsonFileStore";
import type { AdminRecord } from "@/lib/types/admin";

const store = new JsonFileStore<AdminRecord[]>("data/json/admins.json", "data/seeds/admins.seed.json", []);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export class AdminRepository {
  async findByEmail(email: string) {
    const admins = await store.read();
    return admins.find((admin) => admin.email === normalizeEmail(email)) ?? null;
  }

  async findById(id: string) {
    const admins = await store.read();
    return admins.find((admin) => admin.id === id) ?? null;
  }

  async update(id: string, updater: (admin: AdminRecord) => AdminRecord) {
    let updatedRecord: AdminRecord | null = null;

    await store.update((admins) =>
      admins.map((admin) => {
        if (admin.id !== id) {
          return admin;
        }

        updatedRecord = updater(admin);
        return updatedRecord;
      })
    );

    return updatedRecord;
  }
}
