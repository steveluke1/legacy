import { JsonFileStore } from "@/server/repositories/base/JsonFileStore";
import type { GuildRecord } from "@/lib/types/guild";

const store = new JsonFileStore<GuildRecord[]>("data/json/guilds.json", "data/seeds/guilds.seed.json", []);

export class GuildRepository {
  async list() {
    return store.read();
  }

  async findBySlug(slug: string) {
    const guilds = await store.read();
    return guilds.find((guild) => guild.slug === slug) ?? null;
  }

  async findById(id: string) {
    const guilds = await store.read();
    return guilds.find((guild) => guild.id === id) ?? null;
  }
}