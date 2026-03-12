import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { verify } from 'npm:djwt@3.0.2';
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts';

async function verifyJWT(token, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  return await verify(token, key);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { adminToken } = await req.json();

    // Verify admin
    if (!adminToken) {
      return Response.json({ success: false, error: 'Token não fornecido' }, { status: 401 });
    }

    const jwtSecret = Deno.env.get('ADMIN_JWT_SECRET') || 'admin-secret-change-me';
    try {
      await verifyJWT(adminToken, jwtSecret);
    } catch {
      return Response.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    // Generate test commerce events for the last 30 days
    const now = Date.now();
    const events = [];

    // VIP purchases
    for (let i = 0; i < 15; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const createdDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
      const plans = [
        { key: 'VIP_SIMPLE', cash: 3000, brl: 30 },
        { key: 'VIP_MEDIUM', cash: 6000, brl: 60 },
        { key: 'VIP_COMPLETE', cash: 8000, brl: 80 }
      ];
      const plan = plans[Math.floor(Math.random() * plans.length)];

      events.push({
        eventType: 'VIP_PURCHASE',
        actorUserId: `user_${i}`,
        actorAccountId: `account_${i}`,
        productKey: plan.key,
        productCategory: 'VIP',
        quantity: 1,
        currency: 'CASH',
        amount: plan.cash,
        amountCash: plan.cash,
        amountBrl: plan.brl,
        metadata: { plan_name: plan.key, duration_days: 30 },
        correlationId: crypto.randomUUID(),
        created_date: createdDate.toISOString()
      });
    }

    // Box purchases
    for (let i = 0; i < 20; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const createdDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
      const boxes = [
        { key: 'BOX_INSIGNIAS', price: 25 },
        { key: 'BOX_MYSTERY', price: 35 },
        { key: 'BOX_EXTENSOR', price: 30 }
      ];
      const box = boxes[Math.floor(Math.random() * boxes.length)];
      const qty = Math.floor(Math.random() * 5) + 1;

      events.push({
        eventType: 'BOX_PURCHASE',
        actorUserId: `user_${i + 100}`,
        productKey: box.key,
        productCategory: 'BOX',
        quantity: qty,
        currency: 'BRL',
        amount: box.price * qty,
        amountBrl: box.price * qty,
        metadata: {},
        correlationId: crypto.randomUUID(),
        created_date: createdDate.toISOString()
      });
    }

    // ALZ market orders (completed)
    for (let i = 0; i < 30; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const createdDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
      const alzAmount = (Math.floor(Math.random() * 50) + 10) * 1000000000; // 10B to 60B
      const brlPrice = Math.floor(Math.random() * 100) + 50; // 50 to 150 BRL

      events.push({
        eventType: 'ALZ_ORDER_COMPLETED',
        actorUserId: `buyer_${i}`,
        actorAccountId: `buyer_account_${i}`,
        targetAccountId: `seller_account_${i}`,
        listingId: `listing_${i}`,
        orderId: `order_${i}`,
        productCategory: 'ALZ',
        quantity: 1,
        currency: 'BRL',
        amount: brlPrice,
        amountBrl: brlPrice,
        amountAlz: alzAmount,
        metadata: { listing_type: 'ALZ' },
        correlationId: crypto.randomUUID(),
        created_date: createdDate.toISOString()
      });
    }

    // Bulk create
    const created = await base44.asServiceRole.entities.CommerceEvent.bulkCreate(events);

    return Response.json({
      success: true,
      message: `${created.length} eventos de comércio criados com sucesso`,
      breakdown: {
        vip: events.filter(e => e.eventType === 'VIP_PURCHASE').length,
        boxes: events.filter(e => e.eventType === 'BOX_PURCHASE').length,
        alz: events.filter(e => e.eventType === 'ALZ_ORDER_COMPLETED').length
      }
    });

  } catch (error) {
    console.error('Seed error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});