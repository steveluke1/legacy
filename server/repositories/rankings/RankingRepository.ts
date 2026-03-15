import { JsonFileStore } from "@/server/repositories/base/JsonFileStore";
import type { RankingDataset } from "@/lib/types/ranking";

const store = new JsonFileStore<RankingDataset>("data/json/rankings.json", "data/seeds/rankings.seed.json", {
  power: [],
  weeklyKillers: [],
  weeklyRunners: [],
});

export class RankingRepository {
  read() {
    return store.read();
  }
}