export interface GuildRecord {
  id: string;
  slug: string;
  name: string;
  faction: "Capella" | "Procyon";
  level: number;
  memberCount: number;
  recruiting: boolean;
  description: string;
  leaderCharacterId: string;
}