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
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ 
        success: false, 
        error: 'Não autorizado' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const jwtSecret = Deno.env.get('ADMIN_JWT_SECRET');
    
    if (!jwtSecret) {
      console.error('ADMIN_JWT_SECRET not configured');
      return Response.json({ 
        success: false, 
        error: 'Erro de configuração' 
      }, { status: 500 });
    }

    try {
      await verifyJWT(token, jwtSecret);
    } catch {
      return Response.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    const { limit = 100, days = 30 } = await req.json().catch(() => ({ limit: 100, days: 30 }));

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    // Get all store orders
    const allOrders = await base44.asServiceRole.entities.StoreOrder.list('-created_date', limit);
    
    // Filter by date
    const orders = allOrders.filter(o => new Date(o.created_date) >= daysAgo);

    // Get commerce events for additional analytics
    const allEvents = await base44.asServiceRole.entities.CommerceEvent.list('-created_date', 1000);
    const events = allEvents.filter(e => new Date(e.created_date) >= daysAgo);

    // Calculate summary
    const summary = {
      totalOrders: orders.length,
      totalRevenueBRL: 0,
      totalRevenueCash: 0,
      ordersByType: {},
      ordersByStatus: {
        pending: 0,
        paid: 0,
        fulfilled: 0,
        cancelled: 0,
        failed: 0
      }
    };

    orders.forEach(order => {
      // Revenue
      if (order.payment_method === 'BRL' && order.price_brl) {
        summary.totalRevenueBRL += order.price_brl;
      }
      if (order.payment_method === 'CASH' && order.price_cash) {
        summary.totalRevenueCash += order.price_cash;
      }

      // By type
      if (!summary.ordersByType[order.item_type]) {
        summary.ordersByType[order.item_type] = { count: 0, revenueBRL: 0, revenueCash: 0 };
      }
      summary.ordersByType[order.item_type].count++;
      if (order.payment_method === 'BRL') {
        summary.ordersByType[order.item_type].revenueBRL += order.price_brl || 0;
      } else {
        summary.ordersByType[order.item_type].revenueCash += order.price_cash || 0;
      }

      // By status
      summary.ordersByStatus[order.status]++;
    });

    // Timeseries data (daily)
    const timeseries = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_date);
        return orderDate >= date && orderDate < nextDate;
      });

      const dayRevenueBRL = dayOrders
        .filter(o => o.payment_method === 'BRL')
        .reduce((sum, o) => sum + (o.price_brl || 0), 0);

      timeseries.push({
        date: date.toISOString().split('T')[0],
        orders: dayOrders.length,
        revenueBRL: dayRevenueBRL
      });
    }

    return Response.json({
      success: true,
      summary,
      orders: orders.slice(0, 50), // Last 50 orders
      timeseries,
      eventsCount: events.length
    });

  } catch (error) {
    console.error('Admin get store sales error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});