import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Canonical drop table for Caixa Misteriosa tchapi
const MYSTERY_BOX_DROPS = [
  {
    slug: 'amuleto_yul_15',
    name: 'amuleto da yul +15 (1 dia)',
    description: 'Amuleto premium temporário',
    rewardType: 'premium_item',
    duration_days: 1,
    rarity: 'legendary',
    colorHex: '#FFD700',
    weight: 100 // 1%
  },
  {
    slug: 'anel_aniversario',
    name: 'anel de aniversario (1 dia)',
    description: 'Anel especial de aniversário',
    rewardType: 'premium_item',
    duration_days: 1,
    rarity: 'legendary',
    colorHex: '#FFD700',
    weight: 100 // 1%
  },
  {
    slug: 'bracelete_yul_15',
    name: 'Bracelete da yul +15 (1 dia)',
    description: 'Bracelete premium temporário',
    rewardType: 'premium_item',
    duration_days: 1,
    rarity: 'legendary',
    colorHex: '#FFD700',
    weight: 100 // 1%
  },
  {
    slug: 'brinco_yul_15',
    name: 'Brinco da yul +15 (1 dia)',
    description: 'Brinco premium temporário',
    rewardType: 'premium_item',
    duration_days: 1,
    rarity: 'legendary',
    colorHex: '#FFD700',
    weight: 100 // 1%
  },
  {
    slug: 'entrada_dx_premium',
    name: 'Entrada de dx premiun (1 dia)',
    description: 'Acesso premium a dungeons',
    rewardType: 'dg_entry',
    duration_days: 1,
    rarity: 'epic',
    colorHex: '#A855F7',
    weight: 1500 // 15%
  },
  {
    slug: 'caixa_protecao',
    name: 'caixa de proteção',
    description: 'Caixa de proteção para equipamentos',
    rewardType: 'premium_item',
    duration_days: 1,
    rarity: 'epic',
    colorHex: '#A855F7',
    weight: 200 // 2%
  },
  {
    slug: 'acessorios_15',
    name: 'acessórios +15 (1 dia)',
    description: 'Acessórios aprimorados temporários',
    rewardType: 'premium_item',
    duration_days: 1,
    rarity: 'epic',
    colorHex: '#A855F7',
    weight: 300 // 3%
  },
  {
    slug: 'perola_wexp',
    name: 'perola wexp 1000% (8 horas)',
    description: 'Pérola de experiência de guerra 1000%',
    rewardType: 'premium_item',
    duration_days: 1,
    rarity: 'rare',
    colorHex: '#19E0FF',
    weight: 400 // 4%
  },
  {
    slug: 'perola_exp',
    name: 'perola EXP 1000% (12 horas)',
    description: 'Pérola de experiência 1000%',
    rewardType: 'premium_item',
    duration_days: 1,
    rarity: 'rare',
    colorHex: '#19E0FF',
    weight: 400 // 4%
  },
  {
    slug: 'perola_pet_xp',
    name: 'perola XP de pet 1000% (12 horas)',
    description: 'Pérola de experiência de pet 1000%',
    rewardType: 'premium_item',
    duration_days: 1,
    rarity: 'rare',
    colorHex: '#19E0FF',
    weight: 400 // 4%
  },
  {
    slug: 'dgs_aleatorias',
    name: 'Dgs aleatórias',
    description: 'Entrada aleatória para dungeons',
    rewardType: 'random_dg',
    duration_days: 1,
    rarity: 'rare',
    colorHex: '#19E0FF',
    weight: 6400 // 64% (100 - 36 = 64)
  }
];

// Validate total weight = 10,000
const totalWeight = MYSTERY_BOX_DROPS.reduce((sum, drop) => sum + drop.weight, 0);
if (totalWeight !== 10000) {
  throw new Error(`CRITICAL: Drop table total weight is ${totalWeight}, expected 10,000`);
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    console.log(`[${requestId}] Seeding mystery box rewards`);

    // Create/update MysteryReward templates
    for (const reward of MYSTERY_BOX_DROPS) {
      const existing = await base44.asServiceRole.entities.MysteryReward.filter({ 
        slug: reward.slug 
      });
      
      const rewardData = {
        slug: reward.slug,
        name: reward.name,
        description: reward.description,
        rewardType: reward.rewardType,
        duration_days: reward.duration_days,
        rarity: reward.rarity,
        colorHex: reward.colorHex,
        iconUrl: '',
        isActive: true
      };

      if (existing.length === 0) {
        await base44.asServiceRole.entities.MysteryReward.create(rewardData);
      } else {
        await base44.asServiceRole.entities.MysteryReward.update(existing[0].id, rewardData);
      }
    }

    // Update LootBoxType for mystery box
    const mysteryBoxSlug = 'caixa-misteriosa-tchapi';
    const existingBox = await base44.asServiceRole.entities.LootBoxType.filter({ 
      slug: mysteryBoxSlug 
    });

    const boxData = {
      slug: mysteryBoxSlug,
      name: 'Caixa Misteriosa tchapi',
      description: 'Caixa com recompensas premium e DGs aleatórias',
      priceCurrency: 'BRL',
      priceValue: 4.90,
      commonChance: 64.0,  // Dgs aleatórias (updated)
      rareChance: 12.0,    // 3 pérolas @ 4% cada
      epicChance: 20.0,    // Entrada dx (15%) + caixa proteção (2%) + acessórios (3%)
      legendaryChance: 4.0, // 4 itens premium @ 1% cada
      isActive: true
    };

    if (existingBox.length === 0) {
      await base44.asServiceRole.entities.LootBoxType.create(boxData);
    } else {
      await base44.asServiceRole.entities.LootBoxType.update(existingBox[0].id, boxData);
    }

    // DEACTIVATE old extensor box
    const oldBoxes = await base44.asServiceRole.entities.LootBoxType.filter({ 
      slug: 'caixa-extensor-tchope' 
    });
    
    for (const oldBox of oldBoxes) {
      await base44.asServiceRole.entities.LootBoxType.update(oldBox.id, {
        isActive: false
      });
    }

    // DEACTIVATE old extensor templates
    const oldTemplates = await base44.asServiceRole.entities.ExtensorTemplate.list();
    for (const template of oldTemplates) {
      await base44.asServiceRole.entities.ExtensorTemplate.update(template.id, {
        isActive: false
      });
    }

    console.log(`[${requestId}] Mystery box seeded successfully`);

    return Response.json({
      success: true,
      message: 'Caixa Misteriosa tchapi configurada com sucesso',
      rewardsCreated: MYSTERY_BOX_DROPS.length,
      dropTable: MYSTERY_BOX_DROPS.map(r => ({
        name: r.name,
        probability: `${(r.weight / 100).toFixed(2)}%`
      }))
    });

  } catch (error) {
    console.error(`[${requestId}] Seed error:`, error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});