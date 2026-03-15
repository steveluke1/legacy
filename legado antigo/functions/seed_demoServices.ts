import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const serviceTemplates = [
  { category: 'DUNGEON_CARRY', title: 'Carry ICRH Full Drop', desc: 'Carrego ICRH completo com garantia de drop', duration: 45, cashPrice: 5000, brlPrice: 15 },
  { category: 'DUNGEON_CARRY', title: 'Carry FT B2F Speed Run', desc: 'Speed run FT B2F em menos de 10min', duration: 10, cashPrice: 3000, brlPrice: 10 },
  { category: 'DUNGEON_CARRY', title: 'Carry AOS B1F Farm', desc: 'Farm AOS B1F para drops valiosos', duration: 30, cashPrice: 4000, brlPrice: 12 },
  { category: 'LEVEL_RUSH', title: 'Rush 1-180 Express', desc: 'Level 1 a 180 em menos de 24h com mentoria', duration: 1440, cashPrice: 15000, brlPrice: 45 },
  { category: 'LEVEL_RUSH', title: 'Rush 180-200 Hardcore', desc: 'Level 180 a 200 com farm otimizado', duration: 720, cashPrice: 20000, brlPrice: 60 },
  { category: 'TG_SUPPORT', title: 'Suporte TG Party Fixa', desc: 'Entro na sua party para TG com build de suporte', duration: 120, cashPrice: 8000, brlPrice: 25 },
  { category: 'TG_SUPPORT', title: 'Estratégia TG Personalizada', desc: 'Ensino estratégias avançadas para dominar TG', duration: 60, cashPrice: 6000, brlPrice: 20 },
  { category: 'CRAFTING', title: 'Craft +15 com Garantia', desc: 'Crafto seu item até +15 usando minhas pedras', duration: 30, cashPrice: 10000, brlPrice: 30 },
  { category: 'QUEST_HELP', title: 'Ajuda Quest Storyline', desc: 'Completo todas quests de história para você', duration: 180, cashPrice: 7000, brlPrice: 22 },
  { category: 'OTHER', title: 'Consultoria Build Completa', desc: 'Analiso e otimizo seu build para máximo dano', duration: 45, cashPrice: 5000, brlPrice: 15 }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { count = 200 } = await req.json();

    // Get demo characters
    const characters = await base44.asServiceRole.entities.CharacterProfile.filter(
      {},
      undefined,
      300
    );

    if (characters.length === 0) {
      return Response.json({
        success: false,
        error: 'Nenhum personagem demo. Execute seed_demoPlayers primeiro.'
      });
    }

    // Get existing to avoid duplicates
    const existing = await base44.asServiceRole.entities.ServiceOffer.filter({ is_demo: true });
    if (existing.length >= count) {
      return Response.json({
        success: true,
        message: `${existing.length} ofertas demo já existem`,
        created: 0
      });
    }

    const offers = [];

    for (let i = 0; i < count; i++) {
      const seller = characters[Math.floor(Math.random() * characters.length)];
      const template = serviceTemplates[Math.floor(Math.random() * serviceTemplates.length)];
      const priceVariation = 0.8 + Math.random() * 0.4; // ±20%

      offers.push({
        provider_user_id: seller.character_id,
        provider_name: seller.character_name,
        category: template.category,
        title: template.title,
        description: template.desc,
        price_type: Math.random() > 0.5 ? 'CASH' : 'BRL',
        price_cash: Math.floor(template.cashPrice * priceVariation),
        price_brl: Math.round(template.brlPrice * priceVariation * 100) / 100,
        estimated_duration_minutes: template.duration,
        is_active: true,
        provider_rating: (4 + Math.random()).toFixed(1),
        provider_ratings_count: Math.floor(Math.random() * 50) + 5,
        is_demo: true
      });
    }

    // Batch create
    const batchSize = 100;
    for (let i = 0; i < offers.length; i += batchSize) {
      const batch = offers.slice(i, i + batchSize);
      await base44.asServiceRole.entities.ServiceOffer.bulkCreate(batch);
    }

    return Response.json({
      success: true,
      created: offers.length,
      message: `Criadas ${offers.length} ofertas de serviços demo`
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});