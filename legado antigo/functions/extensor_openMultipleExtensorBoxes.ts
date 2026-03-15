import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const { quantity = 1 } = await req.json();

    if (!quantity || quantity < 1 || quantity > 100) {
      return Response.json({
        success: false,
        error: 'Quantidade inválida (mínimo 1, máximo 100)'
      }, { status: 400 });
    }

    // Get user's unopened boxes
    const unopenedBoxes = await base44.asServiceRole.entities.UserLootBox.filter({
      user_id: user.id,
      status: 'unopened'
    });

    if (unopenedBoxes.length === 0) {
      return Response.json({
        success: false,
        error: 'Você não tem caixas de extensor para abrir'
      }, { status: 400 });
    }

    const boxesToOpen = unopenedBoxes.slice(0, Math.min(quantity, unopenedBoxes.length));

    // Get loot box type
    const lootBoxTypeId = boxesToOpen[0].loot_box_type_id;
    const lootBoxType = await base44.asServiceRole.entities.LootBoxType.filter({ id: lootBoxTypeId });
    
    if (lootBoxType.length === 0) {
      return Response.json({
        success: false,
        error: 'Tipo de caixa não encontrado'
      }, { status: 404 });
    }

    // Get all extensor templates
    const templates = await base44.asServiceRole.entities.ExtensorTemplate.filter({ isActive: true });

    if (templates.length === 0) {
      return Response.json({
        success: false,
        error: 'Nenhum template de extensor disponível'
      }, { status: 404 });
      
    }

    const tierTemplates = {
      baixo: templates.filter(t => t.tier === 'baixo'),
      medio: templates.filter(t => t.tier === 'medio'),
      alto: templates.filter(t => t.tier === 'alto'),
      altissimo: templates.filter(t => t.tier === 'altissimo'),
      extremo: templates.filter(t => t.tier === 'extremo')
    };

    // Tier probabilities
    const tierChances = [
      { tier: 'baixo', chance: 70.0 },
      { tier: 'medio', chance: 24.94 },
      { tier: 'alto', chance: 5.0 },
      { tier: 'altissimo', chance: 0.05 },
      { tier: 'extremo', chance: 0.01 }
    ];

    function drawTier() {
      const roll = Math.random() * 100;
      let cumulative = 0;
      for (const { tier, chance } of tierChances) {
        cumulative += chance;
        if (roll <= cumulative) return tier;
      }
      return 'baixo';
    }

    // Open boxes and create extensors
    const obtainedExtensors = [];
    const updatePromises = [];
    const createPromises = [];

    for (const box of boxesToOpen) {
      const tier = drawTier();
      const tierTemplatesList = tierTemplates[tier];
      
      if (tierTemplatesList.length === 0) continue;

      const template = tierTemplatesList[Math.floor(Math.random() * tierTemplatesList.length)];

      updatePromises.push(
        base44.asServiceRole.entities.UserLootBox.update(box.id, {
          status: 'opened',
          opened_at: new Date().toISOString()
        })
      );

      createPromises.push(
        base44.asServiceRole.entities.UserExtensor.create({
          user_id: user.id,
          extensor_template_id: template.id,
          obtained_from: 'extensor_loot_box',
          obtained_at: new Date().toISOString(),
          quantity: 1
        }).then(userExtensor => {
          obtainedExtensors.push({
            ...template,
            userExtensorId: userExtensor.id
          });
        })
      );
    }

    await Promise.all([...updatePromises, ...createPromises]);

    return Response.json({
      success: true,
      extensors: obtainedExtensors,
      totalOpened: boxesToOpen.length
    });

  } catch (error) {
    console.error('Open multiple boxes error:', error);
    return Response.json({
      success: false,
      error: 'Falha ao abrir caixas, tente novamente.'
    }, { status: 500 });
  }
});