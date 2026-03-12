import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error(`[${requestId}] Unauthorized badge box open attempt`);
      return Response.json({
        success: false,
        error: 'Usuário não autenticado'
      }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const userLootBoxId = body.userLootBoxId;
    
    console.log(`[${requestId}] User ${user.id} opening badge box ${userLootBoxId}`);

    if (!userLootBoxId) {
      console.error(`[${requestId}] Missing userLootBoxId`);
      return Response.json({
        success: false,
        error: 'ID da caixa não fornecido'
      }, { status: 400 });
    }

    // Load user loot box
    const userBoxes = await base44.asServiceRole.entities.UserLootBox.filter({
      id: userLootBoxId,
      user_id: user.id
    });

    if (userBoxes.length === 0) {
      console.error(`[${requestId}] Badge box not found: ${userLootBoxId}`);
      return Response.json({
        success: false,
        error: 'Caixa não encontrada'
      }, { status: 404 });
    }

    const userBox = userBoxes[0];

    // IDEMPOTENCY: If already opened, try to return existing badge
    if (userBox.status === "opened") {
      console.warn(`[${requestId}] Badge box already opened, idempotent response`);
      const existingBadges = await base44.asServiceRole.entities.UserBadge.filter({
        user_id: user.id,
        obtained_from: "loot_box"
      });
      
      if (existingBadges.length > 0) {
        const recentBadge = existingBadges.sort((a, b) => 
          new Date(b.obtained_at || b.created_date) - new Date(a.obtained_at || a.created_date)
        )[0];
        
        const templates = await base44.asServiceRole.entities.BadgeTemplate.filter({ 
          id: recentBadge.badge_template_id 
        });
        
        if (templates.length > 0) {
          const template = templates[0];
          return Response.json({
            success: true,
            alreadyOpened: true,
            userLootBoxId,
            rarity: template.rarity,
            badge: {
              id: recentBadge.id,
              templateSlug: template.slug,
              name: template.name,
              description: template.description,
              rarity: template.rarity,
              colorHex: template.colorHex,
              iconUrl: template.iconUrl,
              animatedEffectKey: template.animatedEffectKey
            }
          });
        }
      }
      
      return Response.json({
        success: false,
        error: 'Caixa já foi aberta anteriormente'
      }, { status: 400 });
    }
    
    if (userBox.status !== "unopened") {
      console.error(`[${requestId}] Invalid badge box status: ${userBox.status}`);
      return Response.json({
        success: false,
        error: 'Status da caixa inválido'
      }, { status: 400 });
    }

    // Get loot box type with probabilities
    const lootBoxTypes = await base44.asServiceRole.entities.LootBoxType.filter({
      id: userBox.loot_box_type_id
    });

    if (lootBoxTypes.length === 0) {
      return Response.json({
        success: false,
        error: 'Tipo de caixa não encontrado'
      }, { status: 404 });
    }

    const lootBoxType = lootBoxTypes[0];

    // Perform rarity draw with new tier system (backend secure random)
    // Probabilities: RARA 79.49%, UNICA 15%, EPICO 5%, MESTRE 0.5%, LENDARIA 0.01%
    const random = Math.random() * 100;
    let drawnRarity;
    
    const lendariaChance = lootBoxType.lendariaChance || 0.01;
    const mestreChance = lootBoxType.mestreChance || 0.5;
    const epicoChance = lootBoxType.epicoChance || 5.0;
    const unicaChance = lootBoxType.unicaChance || 15.0;
    // RARA is the remainder, but we check explicitly to ensure correctness

    if (random < lendariaChance) {
      drawnRarity = "LENDARIA";
    } else if (random < lendariaChance + mestreChance) {
      drawnRarity = "MESTRE";
    } else if (random < lendariaChance + mestreChance + epicoChance) {
      drawnRarity = "EPICO";
    } else if (random < lendariaChance + mestreChance + epicoChance + unicaChance) {
      drawnRarity = "UNICA";
    } else {
      drawnRarity = "RARA";
    }

    // Get all badges of that rarity
    const availableBadges = await base44.asServiceRole.entities.BadgeTemplate.filter({
      rarity: drawnRarity,
      isActive: true
    });

    if (availableBadges.length === 0) {
      return Response.json({
        success: false,
        error: 'Nenhuma insígnia disponível para esta raridade'
      }, { status: 500 });
    }

    // Randomly select one badge
    const selectedBadge = availableBadges[Math.floor(Math.random() * availableBadges.length)];

    // Mark box as opened
    await base44.asServiceRole.entities.UserLootBox.update(userBox.id, {
      status: "opened",
      opened_at: new Date().toISOString()
    });

    // Create user badge
    const userBadge = await base44.asServiceRole.entities.UserBadge.create({
      user_id: user.id,
      badge_template_id: selectedBadge.id,
      obtained_from: "loot_box",
      obtained_at: new Date().toISOString(),
      is_equipped: false
    });

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Success in ${duration}ms - user ${user.id} got ${selectedBadge.name} (${drawnRarity})`);

    return Response.json({
      success: true,
      userLootBoxId,
      rarity: drawnRarity,
      badge: {
        id: userBadge.id,
        templateSlug: selectedBadge.slug,
        name: selectedBadge.name,
        description: selectedBadge.description,
        rarity: selectedBadge.rarity,
        colorHex: selectedBadge.colorHex,
        iconUrl: selectedBadge.iconUrl,
        animatedEffectKey: selectedBadge.animatedEffectKey
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