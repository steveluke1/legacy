import { PublicContentRepository } from "@/server/repositories/public/PublicContentRepository";
import { RankingRepository } from "@/server/repositories/rankings/RankingRepository";
import { GuildRepository } from "@/server/repositories/guilds/GuildRepository";
import { CharacterRepository } from "@/server/repositories/characters/CharacterRepository";
import { MarketplaceRepository } from "@/server/repositories/marketplace/MarketplaceRepository";
import { ProductRepository } from "@/server/repositories/products/ProductRepository";

const publicContentRepository = new PublicContentRepository();
const rankingRepository = new RankingRepository();
const guildRepository = new GuildRepository();
const characterRepository = new CharacterRepository();
const marketplaceRepository = new MarketplaceRepository();
const productRepository = new ProductRepository();

export async function getHomePageData() {
  const [content, rankings, guilds, listings, products] = await Promise.all([
    publicContentRepository.read(),
    rankingRepository.read(),
    guildRepository.list(),
    marketplaceRepository.listOpenListings(),
    productRepository.readDataset(),
  ]);

  return {
    content,
    spotlightCharacters: rankings.power.slice(0, 3),
    featuredGuilds: guilds.slice(0, 3),
    featuredListings: listings.slice(0, 2),
    featuredPlans: products.premiumPlans,
  };
}

export async function getRankingsPageData() {
  return rankingRepository.read();
}

export async function getGuildsPageData() {
  const [guilds, characters] = await Promise.all([guildRepository.list(), characterRepository.list()]);
  return guilds.map((guild) => ({
    ...guild,
    roster: characters.filter((character) => character.guildId === guild.id),
  }));
}

export async function getGuildDetailData(slug: string) {
  const guild = await guildRepository.findBySlug(slug);
  if (!guild) {
    return null;
  }

  const roster = await characterRepository.listByGuildId(guild.id);
  return { guild, roster };
}

export async function getCharacterDetailData(id: string) {
  return characterRepository.findById(id);
}