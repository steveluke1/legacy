import { randomUUID } from "node:crypto";

import { MarketplaceRepository } from "@/server/repositories/marketplace/MarketplaceRepository";
import { CharacterRepository } from "@/server/repositories/characters/CharacterRepository";
import { WalletRepository } from "@/server/repositories/wallets/WalletRepository";
import type { MarketplaceListingRecord } from "@/lib/types/marketplace";

const marketplaceRepository = new MarketplaceRepository();
const characterRepository = new CharacterRepository();
const walletRepository = new WalletRepository();

export class MarketplaceService {
  async getSnapshot(userId?: string) {
    const [listings, settings, orders] = await Promise.all([
      marketplaceRepository.listOpenListings(),
      marketplaceRepository.readSettings(),
      userId ? marketplaceRepository.listOrdersByUserId(userId) : Promise.resolve([]),
    ]);

    return { listings, settings, orders };
  }

  async createListing(userId: string, input: Omit<MarketplaceListingRecord, "id" | "sellerUserId" | "sellerName" | "status" | "createdAt">) {
    const character = await characterRepository.findById(input.sellerCharacterId);
    if (!character || character.ownerUserId !== userId) {
      throw new Error("Personagem invalido para anunciar.");
    }

    return marketplaceRepository.createListing({
      id: `listing_${randomUUID()}`,
      sellerUserId: userId,
      sellerCharacterId: input.sellerCharacterId,
      sellerName: character.name,
      title: input.title,
      description: input.description,
      unitPriceBrl: input.unitPriceBrl,
      alzAmount: input.alzAmount,
      status: "open",
      createdAt: new Date().toISOString(),
    });
  }

  async purchaseListing(userId: string, listingId: string, buyerCharacterId: string) {
    const [listing, buyerCharacter, buyerWallet, settings] = await Promise.all([
      marketplaceRepository.findListingById(listingId),
      characterRepository.findById(buyerCharacterId),
      walletRepository.findByUserId(userId),
      marketplaceRepository.readSettings(),
    ]);

    if (!listing || listing.status !== "open") {
      throw new Error("Anuncio indisponivel.");
    }

    if (!buyerCharacter || buyerCharacter.ownerUserId !== userId) {
      throw new Error("Personagem comprador invalido.");
    }

    if (!buyerWallet || buyerWallet.alzBalance < listing.alzAmount / 10) {
      throw new Error("Conta local sem saldo suficiente para simular a compra.");
    }

    const grossBrl = Number((listing.unitPriceBrl * listing.alzAmount).toFixed(2));
    const marketFeeBrl = Number((grossBrl * (settings.feePercent / 100)).toFixed(2));
    const netBrl = Number((grossBrl - marketFeeBrl).toFixed(2));
    const now = new Date().toISOString();

    await marketplaceRepository.updateListing(listing.id, (current) => ({ ...current, status: "sold" }));
    await walletRepository.updateByUserId(userId, (current) => ({
      ...current,
      alzBalance: current.alzBalance - Math.floor(listing.alzAmount / 10),
      updatedAt: now,
    }));

    return marketplaceRepository.createOrder({
      id: `order_${randomUUID()}`,
      listingId: listing.id,
      buyerUserId: userId,
      sellerUserId: listing.sellerUserId,
      sellerCharacterId: listing.sellerCharacterId,
      buyerCharacterId,
      sellerName: listing.sellerName,
      alzAmount: listing.alzAmount,
      grossBrl,
      marketFeeBrl,
      netBrl,
      status: "settled",
      createdAt: now,
    });
  }
}