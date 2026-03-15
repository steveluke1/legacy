import { JsonFileStore } from "@/server/repositories/base/JsonFileStore";
import type { UserRecord } from "@/lib/types/user";

const store = new JsonFileStore<UserRecord[]>("data/json/users.json", "data/seeds/users.seed.json", []);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export class UserRepository {
  list() {
    return store.read();
  }

  async listActive() {
    const users = await store.read();
    return users.filter((user) => user.status === "active");
  }

  async findByEmail(email: string) {
    const users = await store.read();
    return users.find((user) => user.email === normalizeEmail(email)) ?? null;
  }

  async findByUsername(username: string) {
    const users = await store.read();
    return users.find((user) => user.username === normalizeUsername(username)) ?? null;
  }

  async findById(id: string) {
    const users = await store.read();
    return users.find((user) => user.id === id) ?? null;
  }

  async create(input: UserRecord) {
    await store.update((users) => [...users, input]);
    return input;
  }

  async update(id: string, updater: (user: UserRecord) => UserRecord) {
    let updatedRecord: UserRecord | null = null;

    await store.update((users) =>
      users.map((user) => {
        if (user.id !== id) {
          return user;
        }

        updatedRecord = updater(user);
        return updatedRecord;
      })
    );

    return updatedRecord;
  }
}
