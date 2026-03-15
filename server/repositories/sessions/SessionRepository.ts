import { JsonFileStore } from "@/server/repositories/base/JsonFileStore";
import type { SessionRecord } from "@/lib/types/session";

const store = new JsonFileStore<SessionRecord[]>("data/json/sessions.json", "data/seeds/sessions.seed.json", []);

export class SessionRepository {
  async create(record: SessionRecord) {
    await store.update((sessions) => [...sessions, record]);
    return record;
  }

  async findByTokenHash(tokenHash: string) {
    const sessions = await store.read();
    return sessions.find((session) => session.tokenHash === tokenHash) ?? null;
  }

  async revokeByTokenHash(tokenHash: string, revokedAt: string) {
    let revoked = false;

    await store.update((sessions) =>
      sessions.map((session) => {
        if (session.tokenHash !== tokenHash || session.revokedAt) {
          return session;
        }

        revoked = true;
        return {
          ...session,
          revokedAt,
        };
      })
    );

    return revoked;
  }
}
