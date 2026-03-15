export interface CharacterStatBlock {
  attack: number;
  defense: number;
  criticalRate: number;
  accuracy: number;
}

export interface CharacterRecord {
  id: string;
  name: string;
  classCode: string;
  level: number;
  nation: "Capella" | "Procyon";
  guildId: string | null;
  guildName: string | null;
  ownerUserId: string | null;
  battlePower: number;
  honorLevel: number;
  headline: string;
  biography: string;
  stats: CharacterStatBlock;
  achievements: string[];
  activitySummary: {
    weeklyKills: number;
    weeklyRuns: number;
    lastSeenAt: string;
  };
}