import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Canonical drop table (weights out of 10,000 for precision)
const DROP_TABLE = [
  { slug: 'amuleto_yul_15', weight: 100 },      // 1%
  { slug: 'anel_aniversario', weight: 100 },    // 1%
  { slug: 'bracelete_yul_15', weight: 100 },    // 1%
  { slug: 'brinco_yul_15', weight: 100 },       // 1%
  { slug: 'entrada_dx_premium', weight: 1500 }, // 15%
  { slug: 'caixa_protecao', weight: 200 },      // 2%
  { slug: 'acessorios_15', weight: 300 },       // 3%
  { slug: 'perola_wexp', weight: 400 },         // 4%
  { slug: 'perola_exp', weight: 400 },          // 4%
  { slug: 'perola_pet_xp', weight: 400 },       // 4%
  { slug: 'dgs_aleatorias', weight: 6400 }      // 64%
];

const TOTAL_WEIGHT = 10000;

// Mock DG pool for random_dg resolution
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
  
  return DROP_TABLE[DROP_TABLE.length - 1].slug; // fallback
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error(`[${requestId}] Unauthorized attempt`);
      return Response.json({ 
        success: false, 
        error: 'Não autorizado' 
      }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { userLootBoxId } = body;
    
    console.log(`[${requestId}] User ${user.id} opening mystery box ${userLootBoxId}`);

    if (!userLootBoxId) {
      console.error(`[${requestId}] Missing userLootBoxId`);
      return Response.json({
        success: false,
        error: 'ID da caixa não fornecido'
      }, { status: 400 });
    }

    // Load box
    const userBoxes = await base44.asServiceRole.entities.UserLootBox.filter({ 
      id: userLootBoxId 
    });
    
    if (userBoxes.length === 0) {
      console.error(`[${requestId}] Box not found: ${userLootBoxId}`);
      return Response.json({
        success: false,
        error: 'Caixa não encontrada'
      }, { status: 404 });
    }

    const userBox = userBoxes[0];

    // Verify ownership
    if (userBox.user_id !== user.id) {
      console.error(`[${requestId}] Ownership mismatch`);
      return Response.json({
        success: false,
        error: 'Você não tem permissão para abrir esta caixa'
      }, { status: 403 });
    }

    // IDEMPOTENCY
    if (userBox.status === 'opened') {
      console.warn(`[${requestId}] Box already opened`);
      const existingRewards = await base44.asServiceRole.entities.UserMysteryReward.filter({
        user_id: user.id,
        obtained_from: 'mystery_box'
      });
      
      if (existingRewards.length > 0) {
        const recent = existingRewards.sort((a, b) => 
          new Date(b.obtained_at || b.created_date) - new Date(a.obtained_at || a.created_date)
        )[0];
        
        const templates = await base44.asServiceRole.entities.MysteryReward.filter({ 
          id: recent.reward_template_id 
        });
        
        if (templates.length > 0) {
          const template = templates[0];
          return Response.json({
            success: true,
            alreadyOpened: true,
            userLootBoxId,
            reward: {
              userRewardId: recent.id,
              templateSlug: template.slug,
              name: template.name,
              description: template.description,
              rewardType: template.rewardType,
              rarity: template.rarity,
              colorHex: template.colorHex,
              obtainedAt: recent.obtained_at
            }
          });
        }
      }
      
      return Response.json({
        success: false,
        error: 'Caixa já foi aberta'
      }, { status: 400 });
    }
    
    if (userBox.status !== 'unopened') {
      console.error(`[${requestId}] Invalid status: ${userBox.status}`);
      return Response.json({
        success: false,
        error: 'Status da caixa inválido'
      }, { status: 400 });
    }

    // Verify it's a mystery box
    const lootBoxTypes = await base44.asServiceRole.entities.LootBoxType.filter({ 
      id: userBox.loot_box_type_id 
    });
    
    if (lootBoxTypes.length === 0) {
      console.error(`[${requestId}] Box type not found`);
      return Response.json({
        success: false,
        error: 'Tipo de caixa não encontrado'
      }, { status: 404 });
    }

    const boxType = lootBoxTypes[0];
    if (boxType.slug !== 'caixa-misteriosa-tchapi') {
      console.error(`[${requestId}] Wrong box type: ${boxType.slug}`);
      return Response.json({
        success: false,
        error: 'Esta caixa não é uma Caixa Misteriosa tchapi'
      }, { status: 400 });
    }

    // Select reward
    const selectedSlug = selectReward();
    
    const rewardTemplates = await base44.asServiceRole.entities.MysteryReward.filter({ 
      slug: selectedSlug,
      isActive: true
    });
    
    if (rewardTemplates.length === 0) {
      console.error(`[${requestId}] Reward template not found: ${selectedSlug}`);
      return Response.json({
        success: false,
        error: 'Recompensa não disponível'
      }, { status: 500 });
    }

    const template = rewardTemplates[0];
    
    // Resolve random_dg to specific DG
    let finalName = template.name;
    let finalDescription = template.description;
    
    if (template.rewardType === 'random_dg') {
      const randomDG = DG_POOL[Math.floor(Math.random() * DG_POOL.length)];
      finalName = randomDG;
      finalDescription = `Entrada aleatória: ${randomDG}`;
    }

    // Mark box as opened
    await base44.asServiceRole.entities.UserLootBox.update(userBox.id, {
      status: 'opened',
      opened_at: new Date().toISOString()
    });

    // Create user reward
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (template.duration_days || 1));
    
    const userReward = await base44.asServiceRole.entities.UserMysteryReward.create({
      user_id: user.id,
      reward_template_id: template.id,
      obtained_from: 'mystery_box',
      obtained_at: new Date().toISOString(),
      is_consumed: false,
      expires_at: expiresAt.toISOString()
    });

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Success in ${duration}ms - user ${user.id} got ${finalName}`);

    return Response.json({
      success: true,
      userLootBoxId: userBox.id,
      reward: {
        userRewardId: userReward.id,
        templateSlug: template.slug,
        name: finalName,
        description: finalDescription,
        rewardType: template.rewardType,
        rarity: template.rarity,
        colorHex: template.colorHex,
        obtainedAt: userReward.obtained_at,
        expiresAt: userReward.expires_at
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] CRITICAL ERROR after ${duration}ms:`, error);
    console.error(`[${requestId}] Stack:`, error.stack);
    return Response.json({
      success: false,
      error: 'Erro ao abrir caixa. Tente novamente.'
    }, { status: 500 });
  }
});