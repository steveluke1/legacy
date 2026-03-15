import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error(`[${requestId}] Unauthorized badge box list attempt`);
      return Response.json({
        success: false,
        error: 'Usuário não autenticado'
      }, { status: 401 });
    }
    
    console.log(`[${requestId}] User ${user.id} fetching badge boxes`);

    // Get badge loot box type
    const lootBoxType = await base44.asServiceRole.entities.LootBoxType.filter({
      slug: "caixa-insignias-ziron"
    });

    if (lootBoxType.length === 0) {
      return Response.json({
        success: true,
        lootBoxes: []
      });
    }

    const lootBoxInfo = lootBoxType[0];

    // Get user's badge loot boxes only
    const userBoxes = await base44.asServiceRole.entities.UserLootBox.filter({
      user_id: user.id,
      loot_box_type_id: lootBoxInfo.id
    });

    const lootBoxes = userBoxes.map(box => ({
      id: box.id,
      status: box.status,
      lootBoxTypeSlug: lootBoxInfo.slug || "caixa-insignias-ziron",
      lootBoxTypeName: lootBoxInfo.name || "Caixa de Insígnias",
      createdAt: box.created_date,
      openedAt: box.opened_at || null
    }));

    console.log(`[${requestId}] Returning ${lootBoxes.length} badge boxes`);

    return Response.json({
      success: true,
      lootBoxes
    });

  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});