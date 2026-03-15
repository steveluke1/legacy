import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error(`[${requestId}] Unauthorized purchase`);
      return Response.json({ 
        success: false, 
        error: 'Não autorizado' 
      }, { status: 401 });
    }

    const { quantity = 1 } = await req.json().catch(() => ({}));

    if (!quantity || quantity < 1 || quantity > 100) {
      return Response.json({
        success: false,
        error: 'Quantidade inválida (mínimo 1, máximo 100)'
      }, { status: 400 });
    }

    console.log(`[${requestId}] User ${user.id} purchasing ${quantity} mystery boxes`);

    // Load mystery box type
    const lootBoxes = await base44.asServiceRole.entities.LootBoxType.filter({ 
      slug: 'caixa-misteriosa-tchapi' 
    });
    
    if (lootBoxes.length === 0 || !lootBoxes[0].isActive) {
      return Response.json({
        success: false,
        error: 'Caixa Misteriosa tchapi não disponível'
      }, { status: 404 });
    }

    const lootBox = lootBoxes[0];
    const unitPriceBRL = lootBox.priceValue;
    const totalPriceBRL = unitPriceBRL * quantity;

    // TODO: Integrate with real payment
    // For now, simulate payment success

    // Create UserLootBox records
    const boxesData = Array.from({ length: quantity }, () => ({
      user_id: user.id,
      loot_box_type_id: lootBox.id,
      status: 'unopened'
    }));
    
    const createdBoxes = await base44.asServiceRole.entities.UserLootBox.bulkCreate(boxesData);

    console.log(`[${requestId}] Created ${createdBoxes.length} boxes for user ${user.id}`);

    const idempotencyKey = `mystery_${user.id}_${lootBox.slug}_${quantity}_${requestId}`;

    // Check for existing order with same idempotency key
    const existingOrders = await base44.asServiceRole.entities.StoreOrder.filter({
      idempotency_key: idempotencyKey
    });

    if (existingOrders.length > 0) {
      const existingOrder = existingOrders[0];
      return Response.json({
        success: true,
        message: 'Caixas Misteriosas tchapi compradas com sucesso',
        quantityCreated: createdBoxes.length,
        totalPriceBRL,
        boxes: createdBoxes,
        order_id: existingOrder.order_id,
        note: 'Pedido já processado'
      });
    }

    // Create store order with idempotency
    await base44.asServiceRole.entities.StoreOrder.create({
      order_id: requestId,
      idempotency_key: idempotencyKey,
      buyer_user_id: user.id,
      item_type: 'BOX',
      item_sku: lootBox.slug,
      item_name: 'Caixa Misteriosa tchapi',
      quantity,
      price_brl: totalPriceBRL,
      payment_method: 'BRL',
      status: 'fulfilled',
      fulfilled_at: new Date().toISOString(),
      metadata: { loot_box_type_id: lootBox.id }
    });

    // Log commerce event for analytics (non-blocking)
    try {
      await base44.asServiceRole.entities.CommerceEvent.create({
        eventType: 'BOX_PURCHASE',
        actorUserId: user.id,
        productKey: 'BOX_MYSTERY',
        productCategory: 'BOX',
        quantity,
        currency: 'BRL',
        amount: totalPriceBRL,
        amountBrl: totalPriceBRL,
        metadata: { loot_box_slug: lootBox.slug, order_id: requestId },
        correlationId: requestId
      });
    } catch (logError) {
      console.warn('Failed to log commerce event:', requestId, logError.message);
    }

    return Response.json({
      success: true,
      message: 'Caixas Misteriosas tchapi compradas com sucesso',
      quantityCreated: createdBoxes.length,
      totalPriceBRL,
      boxes: createdBoxes,
      order_id: requestId
    });

  } catch (error) {
    console.error(`[${requestId}] Purchase error:`, error);
    return Response.json({
      success: false,
      error: 'Falha ao processar pagamento, tente novamente.'
    }, { status: 500 });
  }
});