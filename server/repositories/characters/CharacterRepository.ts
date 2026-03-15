import { JsonFileStore } from "@/server/repositories/base/JsonFileStore";
import type { CharacterRecord } from "@/lib/types/character";

const store = new JsonFileStore<CharacterRecord[]>("data/json/characters.json", "data/seeds/characters.seed.json", []);

export class CharacterRepository {
  async list() {
    return store.read();
  }

  async findById(id: string) {
    const characters = await store.read();
    return characters.find((character) => character.id === id) ?? null;
  }

  async listByGuildId(guildId: string) {
    const characters = await store.read();
    return characters.filter((character) => character.guildId === guildId);
  }

  async listByOwnerUserId(userId: string) {
    const characters = await store.read();
    return characters.filter((character) => character.ownerUserId === userId);
  }
}