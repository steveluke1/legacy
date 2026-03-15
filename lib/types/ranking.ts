export interface RankingEntry {
  position: number;
  characterId: string;
  characterName: string;
  classCode: string;
  guildName: string | null;
  battlePower: number;
  weeklyKills: number;
  weeklyRuns: number;
}

export interface RankingDataset {
  power: RankingEntry[];
  weeklyKillers: RankingEntry[];
  weeklyRunners: RankingEntry[];
}