import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * DEBUG ENDPOINT - Admin only
 * Simulates opening a mystery box without consuming real inventory
 * For QA/testing purposes only
 */

const DROP_TABLE = [
  { slug: 'amuleto_yul_15', weight: 100 },
  { slug: 'anel_aniversario', weight: 100 },
  { slug: 'bracelete_yul_15', weight: 100 },
  { slug: 'brinco_yul_15', weight: 100 },
  { slug: 'entrada_dx_premium', weight: 1500 },
  { slug: 'dgs_aleatorias', weight: 8100 }
];

const TOTAL_WEIGHT = 10000;

const DG_POOL = [
  'DG: Torre Sombria (1 dia)',
  'DG: Caverna Gelada (1 dia)',
  'DG: Templo Perdido (1 dia)',
  'DG: Fortaleza Arcana (1 dia)',
  'DG: Abismo Profundo (1 dia)'
];

function selectReward() {
  const roll = Math.floor(Math.random() * TOTAL_WEIGHT);
  let cumulative = 0;
  
  for (const item of DROP_TABLE) {
    cumulative += item.weight;
    if (roll < cumulative) {
      return item.slug;
    }
  }
  
  return DROP_TABLE[DROP_TABLE.length - 1].slug;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ 
        success: false, 
        error: 'Admin only' 
      }, { status: 401 });
    }

    const { simulateCount = 1 } = await req.json().catch(() => ({}));

    const results = [];
    
    for (let i = 0; i < simulateCount; i++) {
      const selectedSlug = selectReward();
      
      const templates = await base44.asServiceRole.entities.MysteryReward.filter({ 
        slug: selectedSlug 
      });
      
      if (templates.length === 0) continue;
      
      const template = templates[0];
      let finalName = template.name;
      
      if (template.rewardType === 'random_dg') {
        finalName = DG_POOL[Math.floor(Math.random() * DG_POOL.length)];
      }
      
      results.push({
        slug: template.slug,
        name: finalName,
        rarity: template.rarity,
        rewardType: template.rewardType
      });
    }

    // Count distribution
    const distribution = {};
    results.forEach(r => {
      distribution[r.name] = (distribution[r.name] || 0) + 1;
    });

    return Response.json({
      success: true,
      simulateCount,
      results,
      distribution,
      note: 'This is a simulation - no inventory consumed'
    });

  } catch (error) {
    console.error('Debug error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});