import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Define badge templates with NEW rarity tiers
    const badgeTemplates = [
      // RARA (Verde) - 79.49%
      {
        slug: "badge-rara-guardiao-das-ruinas",
        name: "Guardião das Ruínas",
        description: "Uma insígnia que prova que você começou sua jornada em Nevareth.",
        rarity: "RARA",
        colorHex: "#22C55E",
        iconUrl: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=100&q=80",
        animatedEffectKey: "static-glow-green",
        isActive: true
      },
      {
        slug: "badge-rara-soldado-de-nevareth",
        name: "Soldado de Nevareth",
        description: "Reconhecimento para quem luta todos os dias no front.",
        rarity: "RARA",
        colorHex: "#22C55E",
        iconUrl: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=100&q=80",
        animatedEffectKey: "static-glow-green",
        isActive: true
      },
      // UNICA (Azul) - 15%
      {
        slug: "badge-unica-caçador-de-dungeons",
        name: "Caçador de Dungeons",
        description: "Você mergulha nas profundezas de Nevareth em busca de glória.",
        rarity: "UNICA",
        colorHex: "#3B82F6",
        iconUrl: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=100&q=80",
        animatedEffectKey: "pulsing-border-blue",
        isActive: true
      },
      {
        slug: "badge-unica-sombra-da-tg",
        name: "Sombra da TG",
        description: "Seus passos ecoam na Guerra entre Nações, sempre na sombra do inimigo.",
        rarity: "UNICA",
        colorHex: "#3B82F6",
        iconUrl: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=100&q=80",
        animatedEffectKey: "pulsing-border-blue",
        isActive: true
      },
      // EPICO (Roxo) - 5%
      {
        slug: "badge-epico-mestre-da-lamina",
        name: "Mestre da Lâmina",
        description: "Seu domínio sobre as artes marciais é temido em toda Nevareth.",
        rarity: "EPICO",
        colorHex: "#A855F7",
        iconUrl: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=100&q=80",
        animatedEffectKey: "epic-aura-purple",
        isActive: true
      },
      {
        slug: "badge-epico-comandante-da-tg",
        name: "Comandante da TG",
        description: "Você lidera exércitos na TG e deixa um rastro de destruição.",
        rarity: "EPICO",
        colorHex: "#A855F7",
        iconUrl: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=100&q=80",
        animatedEffectKey: "epic-aura-purple",
        isActive: true
      },
      // MESTRE (Vermelho) - 0.5%
      {
        slug: "badge-mestre-conquistador-imortal",
        name: "Conquistador Imortal",
        description: "Sua habilidade transcende a normalidade. Você é um mestre.",
        rarity: "MESTRE",
        colorHex: "#EF4444",
        iconUrl: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=100&q=80",
        animatedEffectKey: "master-aura-red",
        isActive: true
      },
      // LENDARIA (Dourado) - 0.01%
      {
        slug: "badge-lendaria-lenda-de-nevareth",
        name: "Lenda de Nevareth",
        description: "Poucos escrevem seu nome na história. Você é um deles.",
        rarity: "LENDARIA",
        colorHex: "#FACC15",
        iconUrl: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=100&q=80",
        animatedEffectKey: "radiant-legendary-gold",
        isActive: true
      },
      {
        slug: "badge-lendaria-deus-da-guerra",
        name: "Deus da Guerra",
        description: "Sua presença em batalha muda o destino de nações inteiras.",
        rarity: "LENDARIA",
        colorHex: "#FACC15",
        iconUrl: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=100&q=80",
        animatedEffectKey: "radiant-legendary-gold",
        isActive: true
      }
    ];

    // Upsert badge templates
    const createdBadges = [];
    for (const badge of badgeTemplates) {
      const existing = await base44.asServiceRole.entities.BadgeTemplate.filter({ slug: badge.slug });
      
      if (existing.length > 0) {
        await base44.asServiceRole.entities.BadgeTemplate.update(existing[0].id, badge);
        createdBadges.push({ ...existing[0], ...badge });
      } else {
        const created = await base44.asServiceRole.entities.BadgeTemplate.create(badge);
        createdBadges.push(created);
      }
    }

    // Upsert loot box type with NEW probabilities
    const lootBoxData = {
      slug: "caixa-insignias-ziron",
      name: "Caixa de Insígnias",
      description: "Abra para receber uma insígnia exclusiva. Pode conter insígnias de diferentes raridades.",
      priceCurrency: "BRL",
      priceValue: 4.90,
      raraChance: 79.49,
      unicaChance: 15.0,
      epicoChance: 5.0,
      mestreChance: 0.5,
      lendariaChance: 0.01,
      isActive: true
    };

    const existingLootBox = await base44.asServiceRole.entities.LootBoxType.filter({ slug: lootBoxData.slug });
    
    let lootBox;
    if (existingLootBox.length > 0) {
      await base44.asServiceRole.entities.LootBoxType.update(existingLootBox[0].id, lootBoxData);
      lootBox = { ...existingLootBox[0], ...lootBoxData };
    } else {
      lootBox = await base44.asServiceRole.entities.LootBoxType.create(lootBoxData);
    }

    return Response.json({
      success: true,
      message: "Badge templates and loot box seeded successfully",
      badgeTemplatesCreated: createdBadges.length,
      lootBoxCreated: true,
      lootBox: {
        slug: lootBox.slug,
        priceValue: lootBox.priceValue,
        probabilities: {
          RARA: lootBox.raraChance,
          UNICA: lootBox.unicaChance,
          EPICO: lootBox.epicoChance,
          MESTRE: lootBox.mestreChance,
          LENDARIA: lootBox.lendariaChance
        }
      }
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});