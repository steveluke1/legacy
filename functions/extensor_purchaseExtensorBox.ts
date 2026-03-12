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

    const { quantity = 1 } = await req.json();

    if (!quantity || quantity < 1 || quantity > 100) {
      return Response.json({
        success: false,
        error: 'Quantidade inválida (mínimo 1, máximo 100)'
      }, { status: 400 });
    }

    // Load LootBoxType
    const lootBoxes = await base44.entities.LootBoxType.filter({ slug: 'caixa-extensor-tchope' });
    
    if (lootBoxes.length === 0 || !lootBoxes[0].isActive) {
      return Response.json({
        success: false,
        error: 'Caixa de Extensor Tchope não disponível'
      }, { status: 404 });
    }

    const lootBox = lootBoxes[0];
    const unitPriceBRL = lootBox.priceValue;
    const totalPriceBRL = unitPriceBRL * quantity;

    // For now, simulate successful payment (integrate with real payment later)
    // TODO: Integrate with PIX/MercadoPago payment flow

    // Create UserLootBox records in bulk
    const boxesData = Array.from({ length: quantity }, () => ({
      user_id: user.id,
      loot_box_type_id: lootBox.id,
      status: 'unopened'
    }));
    
    const createdBoxes = await base44.entities.UserLootBox.bulkCreate(boxesData);

    const orderId = crypto.randomUUID();
    const idempotencyKey = `extensor_${user.id}_${lootBox.slug}_${quantity}_${Date.now()}`;

    // Check for existing order with same idempotency key
    const existingOrders = await base44.asServiceRole.entities.StoreOrder.filter({
      idempotency_key: idempotencyKey
    });

    if (existingOrders.length > 0) {
      const existingOrder = existingOrders[0];
      return Response.json({
        success: true,
        message: 'Caixas de Extensor Tchope compradas com sucesso.',
        quantityCreated: createdBoxes.length,
        totalPriceBRL,
        boxes: createdBoxes,
        order_id: existingOrder.order_id,
        note: 'Pedido já processado'
      });
    }

    // Create store order with idempotency
    await base44.asServiceRole.entities.StoreOrder.create({
      order_id: orderId,
      idempotency_key: idempotencyKey,
      buyer_user_id: user.id,
      item_type: 'BOX',
      item_sku: lootBox.slug,
      item_name: 'Caixa de Extensor Tchope',
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
        productKey: 'BOX_EXTENSOR',
        productCategory: 'BOX',
        quantity,
        currency: 'BRL',
        amount: totalPriceBRL,
        amountBrl: totalPriceBRL,
        metadata: { loot_box_slug: lootBox.slug, order_id: orderId },
        correlationId: orderId
      });
    } catch (logError) {
      console.warn('Failed to log commerce event:', orderId, logError.message);
    }

    return Response.json({
      success: true,
      message: 'Caixas de Extensor Tchope compradas com sucesso.',
      quantityCreated: createdBoxes.length,
      totalPriceBRL,
      boxes: createdBoxes,
      order_id: orderId
    });

  } catch (error) {
    console.error('Purchase error:', error);
    return Response.json({
      success: false,
      error: 'Falha ao processar pagamento, tente novamente.'
    }, { status: 500 });
  }
});