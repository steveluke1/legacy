import { JsonFileStore } from "@/server/repositories/base/JsonFileStore";
import type { PublicContentRecord } from "@/lib/types/public-content";

const store = new JsonFileStore<PublicContentRecord>("data/json/public-content.json", "data/seeds/public-content.seed.json", {
  heroTitle: "",
  heroSubtitle: "",
  highlights: [],
});

export class PublicContentRepository {
  read() {
    return store.read();
  }
}