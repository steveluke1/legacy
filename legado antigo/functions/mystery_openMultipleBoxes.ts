import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Canonical drop table (weights out of 10,000)
const DROP_TABLE = [
  { slug: 'amuleto_yul_15', weight: 100 },
  { slug: 'anel_aniversario', weight: 100 },
  { slug: 'bracelete_yul_15', weight: 100 },
  { slug: 'brinco_yul_15', weight: 100 },
  { slug: 'entrada_dx_premium', weight: 1500 },
  { slug: 'caixa_protecao', weight: 200 },
  { slug: 'acessorios_15', weight: 300 },
  { slug: 'perola_wexp', weight: 400 },
  { slug: 'perola_exp', weight: 400 },
  { slug: 'perola_pet_xp', weight: 400 },
  { slug: 'dgs_aleatorias', weight: 6400 }
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
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error(`[${requestId}] Unauthorized bulk open`);
      return Response.json({ 
        success: false, 
        error: 'Não autorizado' 
      }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { quantity = 1 } = body;
    
    console.log(`[${requestId}] User ${user.id} opening ${quantity} mystery boxes`);

    if (!quantity || quantity < 1 || quantity > 100) {
      console.error(`[${requestId}] Invalid quantity: ${quantity}`);
      return Response.json({
        success: false,
        error: 'Quantidade inválida (mínimo 1, máximo 100)'
      }, { status: 400 });
    }

    // Get mystery box type
    const mysteryBoxTypes = await base44.asServiceRole.entities.LootBoxType.filter({ 
      slug: 'caixa-misteriosa-tchapi' 
    });
    
    if (mysteryBoxTypes.length === 0) {
      console.error(`[${requestId}] Mystery box type not found`);
      return Response.json({
        success: false,
        error: 'Tipo de caixa não encontrado'
      }, { status: 404 });
    }
    
    const mysteryBoxTypeId = mysteryBoxTypes[0].id;
    
    // Get user's unopened mystery boxes
    const unopenedBoxes = await base44.asServiceRole.entities.UserLootBox.filter({
      user_id: user.id,
      status: 'unopened',
      loot_box_type_id: mysteryBoxTypeId
    });

    if (unopenedBoxes.length === 0) {
      console.warn(`[${requestId}] User ${user.id} has no unopened mystery boxes`);
      return Response.json({
        success: false,
        error: 'Você não tem caixas misteriosas para abrir'
      }, { status: 400 });
    }

    const actualQuantity = Math.min(quantity, unopenedBoxes.length);
    const boxesToOpen = unopenedBoxes.slice(0, actualQuantity);
    
    console.log(`[${requestId}] Opening ${boxesToOpen.length} boxes`);

    // Pre-load all reward templates
    const allRewardTemplates = await base44.asServiceRole.entities.MysteryReward.filter({
      isActive: true
    });
    
    const templatesBySlug = {};
    for (const template of allRewardTemplates) {
      templatesBySlug[template.slug] = template;
    }

    // Process boxes in parallel
    const results = [];
    const updatePromises = [];
    const createPromises = [];

    for (const box of boxesToOpen) {
      const selectedSlug = selectReward();
      const template = templatesBySlug[selectedSlug];
      
      if (!template) {
        console.error(`[${requestId}] Template not found: ${selectedSlug}`);
        continue;
      }

      // Resolve random_dg
      let finalName = template.name;
      let finalDescription = template.description;
      
      if (template.rewardType === 'random_dg') {
        const randomDG = DG_POOL[Math.floor(Math.random() * DG_POOL.length)];
        finalName = randomDG;
        finalDescription = `Entrada aleatória: ${randomDG}`;
      }

      // Mark box as opened
      updatePromises.push(
        base44.asServiceRole.entities.UserLootBox.update(box.id, {
          status: 'opened',
          opened_at: new Date().toISOString()
        })
      );

      // Create reward
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (template.duration_days || 1));
      
      createPromises.push(
        base44.asServiceRole.entities.UserMysteryReward.create({
          user_id: user.id,
          reward_template_id: template.id,
          obtained_from: 'mystery_box',
          obtained_at: new Date().toISOString(),
          is_consumed: false,
          expires_at: expiresAt.toISOString()
        }).then(userReward => {
          results.push({
            userRewardId: userReward.id,
            templateSlug: template.slug,
            name: finalName,
            description: finalDescription,
            rewardType: template.rewardType,
            rarity: template.rarity,
            colorHex: template.colorHex,
            obtainedAt: userReward.obtained_at,
            expiresAt: userReward.expires_at
          });
        })
      );
    }

    // Execute all operations
    await Promise.all([...updatePromises, ...createPromises]);

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Success in ${duration}ms - opened ${boxesToOpen.length} boxes`);

    return Response.json({
      success: true,
      rewards: results,
      totalOpened: boxesToOpen.length
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] CRITICAL ERROR after ${duration}ms:`, error);
    console.error(`[${requestId}] Stack:`, error.stack);
    return Response.json({
      success: false,
      error: 'Erro ao abrir caixas. Tente novamente.'
    }, { status: 500 });
  }
});