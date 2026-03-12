import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        success: false, 
        error: 'Não autorizado' 
      }, { status: 401 });
    }

    const { userLootBoxId } = await req.json();

    if (!userLootBoxId) {
      return Response.json({
        success: false,
        error: 'ID da caixa não fornecido'
      }, { status: 400 });
    }

    // Load UserLootBox
    const userBoxes = await base44.entities.UserLootBox.filter({ id: userLootBoxId });
    
    if (userBoxes.length === 0) {
      return Response.json({
        success: false,
        error: 'Caixa de extensor inválida ou já aberta.'
      }, { status: 404 });
    }

    const userBox = userBoxes[0];

    // Verify ownership
    if (userBox.user_id !== user.id) {
      return Response.json({
        success: false,
        error: 'Você não tem permissão para abrir esta caixa.'
      }, { status: 403 });
    }

    // Verify status
    if (userBox.status !== 'unopened') {
      return Response.json({
        success: false,
        error: 'Caixa de extensor inválida ou já aberta.'
      }, { status: 400 });
    }

    // Verify loot box type
    const lootBoxTypes = await base44.entities.LootBoxType.filter({ id: userBox.loot_box_type_id });
    if (lootBoxTypes.length === 0 || lootBoxTypes[0].slug !== 'caixa-extensor-tchope') {
      return Response.json({
        success: false,
        error: 'Tipo de caixa inválido'
      }, { status: 400 });
    }

    // Probability distribution (exact percentages)
    // Extensor Extremo: 0.01%
    // Extensor Altíssimo: 0.05%
    // Extensor Alto: 5.00%
    // Extensor Médio: 24.94%
    // Extensor Baixo: 70.00%

    const rand = Math.random() * 100;
    let drawnTier;

    if (rand < 0.01) {
      drawnTier = 'extremo';
    } else if (rand < 0.06) { // 0.01 + 0.05
      drawnTier = 'altissimo';
    } else if (rand < 5.06) { // 0.06 + 5.00
      drawnTier = 'alto';
    } else if (rand < 30.00) { // 5.06 + 24.94
      drawnTier = 'medio';
    } else {
      drawnTier = 'baixo';
    }

    // Get ExtensorTemplate for this tier
    const templates = await base44.entities.ExtensorTemplate.filter({ tier: drawnTier });
    
    if (templates.length === 0) {
      return Response.json({
        success: false,
        error: 'Erro ao determinar extensor'
      }, { status: 500 });
    }

    const chosenTemplate = templates[0];

    // Update UserLootBox
    await base44.entities.UserLootBox.update(userBox.id, {
      status: 'opened',
      opened_at: new Date().toISOString()
    });

    // Create UserExtensor
    const userExtensor = await base44.entities.UserExtensor.create({
      user_id: user.id,
      extensor_template_id: chosenTemplate.id,
      obtained_from: 'extensor_loot_box',
      obtained_at: new Date().toISOString(),
      quantity: 1,
      is_consumed: false
    });

    return Response.json({
      success: true,
      userLootBoxId: userBox.id,
      extensor: {
        userExtensorId: userExtensor.id,
        templateSlug: chosenTemplate.slug,
        name: chosenTemplate.name,
        description: chosenTemplate.description,
        tier: chosenTemplate.tier,
        rarityColorHex: chosenTemplate.rarityColorHex,
        iconUrl: chosenTemplate.iconUrl,
        obtainedAt: userExtensor.obtained_at
      }
    });

  } catch (error) {
    console.error('Open box error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});