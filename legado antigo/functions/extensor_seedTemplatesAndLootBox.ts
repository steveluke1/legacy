import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // ExtensorTemplate entries
    const extensorTemplates = [
      {
        slug: 'extensor-baixo',
        name: 'Extensor Baixo',
        description: 'Aumenta levemente a capacidade de slot, um recurso básico e comum.',
        tier: 'baixo',
        rarityColorHex: '#9CA3AF',
        iconUrl: '',
        isActive: true
      },
      {
        slug: 'extensor-medio',
        name: 'Extensor Médio',
        description: 'Extensor confiável, oferece um equilíbrio entre custo e benefício.',
        tier: 'medio',
        rarityColorHex: '#60A5FA',
        iconUrl: '',
        isActive: true
      },
      {
        slug: 'extensor-alto',
        name: 'Extensor Alto',
        description: 'Um extensor valioso, muito desejado pelos aventureiros de Nevareth.',
        tier: 'alto',
        rarityColorHex: '#F97316',
        iconUrl: '',
        isActive: true
      },
      {
        slug: 'extensor-altissimo',
        name: 'Extensor Altíssimo',
        description: 'Extensor raro, encontrado apenas pelos mais dedicados jogadores.',
        tier: 'altissimo',
        rarityColorHex: '#A855F7',
        iconUrl: '',
        isActive: true
      },
      {
        slug: 'extensor-extremo',
        name: 'Extensor Extremo',
        description: 'O auge dos extensores, uma verdadeira relíquia de Nevareth.',
        tier: 'extremo',
        rarityColorHex: '#FACC15',
        iconUrl: '',
        isActive: true
      }
    ];

    // Upsert ExtensorTemplate entries
    for (const template of extensorTemplates) {
      const existing = await base44.asServiceRole.entities.ExtensorTemplate.filter({ slug: template.slug });
      
      if (existing.length === 0) {
        await base44.asServiceRole.entities.ExtensorTemplate.create(template);
      } else {
        await base44.asServiceRole.entities.ExtensorTemplate.update(existing[0].id, template);
      }
    }

    // Upsert LootBoxType for extensor box
    const lootBoxSlug = 'caixa-extensor-tchope';
    const existingLootBox = await base44.asServiceRole.entities.LootBoxType.filter({ slug: lootBoxSlug });

    const lootBoxData = {
      slug: lootBoxSlug,
      name: 'Caixa de Extensor Tchope',
      description: 'Cada caixa concede um extensor aleatório, com chances mínimas de obter o raríssimo Extensor Extremo.',
      priceCurrency: 'BRL',
      priceValue: 4.90,
      commonChance: 70.00,
      rareChance: 24.94,
      epicChance: 5.00,
      legendaryChance: 0.06,
      isActive: true
    };

    if (existingLootBox.length === 0) {
      await base44.asServiceRole.entities.LootBoxType.create(lootBoxData);
    } else {
      await base44.asServiceRole.entities.LootBoxType.update(existingLootBox[0].id, lootBoxData);
    }

    return Response.json({
      success: true,
      message: 'Extensor templates and loot box seeded successfully',
      templatesCreated: extensorTemplates.length
    });

  } catch (error) {
    console.error('Seed error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});