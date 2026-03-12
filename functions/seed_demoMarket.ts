import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const itemNames = [
  'Espada Osmium +15', 'Katana Mithril +15', 'Set Archridium +15 Completo',
  'Anel de Força +4', 'Orbe Arcano +15', 'Arco Titanium +15',
  'Luvas Osmium +15', 'Botas Archridium +14', 'Escudo Titanium +15',
  'Colar de Crítico +3', 'Brinco de Magia +4', 'Elmo Chaos +15',
  'Armadura Titanium +15', 'Calça Mithril +14', 'Capa de Batalha +7',
  'Bike Epic +7', 'Astral Board +7', 'Pet Armadilho Lv 10'
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { count = 300 } = await req.json();

    // Get demo characters for sellers
    const characters = await base44.asServiceRole.entities.CharacterProfile.filter(
      {},
      undefined,
      200
    );

    if (characters.length === 0) {
      return Response.json({
        success: false,
        error: 'Nenhum personagem demo. Execute seed_demoPlayers primeiro.'
      });
    }

    // Get existing to avoid duplicates
    const existing = await base44.asServiceRole.entities.MarketListing.filter({ is_demo: true });
    if (existing.length >= count) {
      return Response.json({
        success: true,
        message: `${existing.length} anúncios demo já existem`,
        created: 0
      });
    }

    const listings = [];

    // ALZ listings (40%)
    const alzCount = Math.floor(count * 0.4);
    for (let i = 0; i < alzCount; i++) {
      const seller = characters[Math.floor(Math.random() * characters.length)];
      const alzAmounts = [50000000, 100000000, 150000000, 200000000, 250000000];
      const amount = alzAmounts[Math.floor(Math.random() * alzAmounts.length)];
      const pricePerBase = 25 + Math.random() * 15; // R$ 25-40 per 100M
      const price = (amount / 100000000) * pricePerBase;

      listings.push({
        seller_user_id: seller.character_id,
        seller_username: seller.character_name,
        type: 'ALZ',
        alz_amount: amount,
        price_brl: Math.round(price * 100) / 100,
        status: 'ACTIVE',
        seller_notes: 'Entrega rápida via trade in-game',
        is_demo: true
      });
    }

    // Item listings (60%)
    const itemCount = count - alzCount;
    for (let i = 0; i < itemCount; i++) {
      const seller = characters[Math.floor(Math.random() * characters.length)];
      const itemName = itemNames[Math.floor(Math.random() * itemNames.length)];
      const price = Math.floor(Math.random() * 200) + 10;

      listings.push({
        seller_user_id: seller.character_id,
        seller_username: seller.character_name,
        type: 'ITEM',
        item_name: itemName,
        item_description: `${itemName} em excelente estado. Negociável.`,
        quantity_units: 1,
        price_brl: price,
        status: 'ACTIVE',
        seller_notes: 'Aceito propostas. Contato via Discord.',
        is_demo: true
      });
    }

    // Batch create
    const batchSize = 100;
    for (let i = 0; i < listings.length; i += batchSize) {
      const batch = listings.slice(i, i + batchSize);
      await base44.asServiceRole.entities.MarketListing.bulkCreate(batch);
    }

    return Response.json({
      success: true,
      created: listings.length,
      message: `Criados ${listings.length} anúncios demo (${alzCount} ALZ, ${itemCount} itens)`
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});