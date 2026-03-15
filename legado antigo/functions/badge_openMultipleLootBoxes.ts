import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error(`[${requestId}] Unauthorized badge bulk open attempt`);
      return Response.json({
        success: false,
        error: 'Usuário não autenticado'
      }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const quantity = body.quantity || 10;
    
    console.log(`[${requestId}] User ${user.id} opening ${quantity} badge boxes`);

    if (quantity < 1 || quantity > 100) {
      return Response.json({
        success: false,
        error: 'Quantidade deve ser entre 1 e 100'
      }, { status: 400 });
    }

    // Get badge loot box type to filter correctly
    const badgeLootBoxTypes = await base44.asServiceRole.entities.LootBoxType.filter({ 
      slug: 'caixa-insignias-ziron' 
    });
    
    if (badgeLootBoxTypes.length === 0) {
      console.error(`[${requestId}] Badge loot box type not found`);
      return Response.json({
        success: false,
        error: 'Tipo de caixa não encontrado'
      }, { status: 404 });
    }
    
    const badgeLootBoxTypeId = badgeLootBoxTypes[0].id;

    // Get user's unopened badge boxes
    const userBoxes = await base44.asServiceRole.entities.UserLootBox.filter({
      user_id: user.id,
      status: 'unopened',
      loot_box_type_id: badgeLootBoxTypeId
    });

    if (userBoxes.length === 0) {
      console.warn(`[${requestId}] User ${user.id} has no unopened badge boxes`);
      return Response.json({
        success: false,
        error: 'Você não possui caixas de insígnia fechadas'
      }, { status: 400 });
    }

    const actualQuantity = Math.min(quantity, userBoxes.length);
    const boxesToOpen = userBoxes.slice(0, actualQuantity);
    
    console.log(`[${requestId}] Opening ${boxesToOpen.length} badge boxes (requested ${quantity})`);
    const results = [];

    // Get loot box type (assume all boxes are same type)
    const lootBoxTypes = await base44.asServiceRole.entities.LootBoxType.filter({
      id: boxesToOpen[0].loot_box_type_id
    });

    if (lootBoxTypes.length === 0) {
      return Response.json({
        success: false,
        error: 'Tipo de caixa não encontrado'
      }, { status: 404 });
    }

    const lootBoxType = lootBoxTypes[0];

    // Pre-load all badge templates once (optimization)
    const allBadgeTemplates = await base44.asServiceRole.entities.BadgeTemplate.filter({
      isActive: true
    });
    
    const badgesByRarity = {
      legendary: allBadgeTemplates.filter(b => b.rarity === 'legendary'),
      epic: allBadgeTemplates.filter(b => b.rarity === 'epic'),
      rare: allBadgeTemplates.filter(b => b.rarity === 'rare'),
      common: allBadgeTemplates.filter(b => b.rarity === 'common')
    };

    // Open boxes in parallel batches
    const updatePromises = [];
    const createPromises = [];

    for (const userBox of boxesToOpen) {
      // Perform rarity draw
      const random = Math.random() * 100;
      let drawnRarity;

      if (random < lootBoxType.legendaryChance) {
        drawnRarity = "legendary";
      } else if (random < lootBoxType.legendaryChance + lootBoxType.epicChance) {
        drawnRarity = "epic";
      } else if (random < lootBoxType.legendaryChance + lootBoxType.epicChance + lootBoxType.rareChance) {
        drawnRarity = "rare";
      } else {
        drawnRarity = "common";
      }

      const availableBadges = badgesByRarity[drawnRarity];

      if (availableBadges.length === 0) {
        continue;
      }

      const selectedBadge = availableBadges[Math.floor(Math.random() * availableBadges.length)];

      // Mark box as opened
      updatePromises.push(
        base44.asServiceRole.entities.UserLootBox.update(userBox.id, {
          status: "opened",
          opened_at: new Date().toISOString()
        })
      );

      // Create user badge
      createPromises.push(
        base44.asServiceRole.entities.UserBadge.create({
          user_id: user.id,
          badge_template_id: selectedBadge.id,
          obtained_from: "loot_box",
          obtained_at: new Date().toISOString(),
          is_equipped: false
        }).then(userBadge => {
          results.push({
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
        })
      );
    }

    // Execute all updates and creations in parallel
    await Promise.all([...updatePromises, ...createPromises]);

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Success in ${duration}ms - opened ${boxesToOpen.length} badge boxes`);

    return Response.json({
      success: true,
      quantity: results.length,
      results
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