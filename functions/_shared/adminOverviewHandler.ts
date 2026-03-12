import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { verifyAdminToken } from './authHelpers.js';

async function safeParseJson(req) {
  try {
    const text = await req.text();
    if (!text || text.trim() === '') {
      return {};
    }
    return JSON.parse(text);
  } catch (e) {
    console.warn('Failed to parse JSON body, using empty object:', e.message);
    return {};
  }
}

function getRangeDate(range, from, to) {
  const now = new Date();
  
  if (range === 'custom' && from && to) {
    return { start: new Date(from), end: new Date(to) };
  }
  
  switch (range) {
    case '7d':
      return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now };
    case '30d':
      return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: now };
    case '90d':
      return { start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), end: now };
    case 'this_month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfMonth, end: now };
    default:
      return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: now };
  }
}

export async function handleAdminOverview(req) {
  const correlationId = crypto.randomUUID();
  
  try {
    console.log(`[adminOverview:${correlationId}] START - Method: ${req.method}, URL: ${req.url}`);
    
    const base44 = createClientFromRequest(req);
    
    // Verify admin token
    try {
      const adminPayload = await verifyAdminToken(req, base44);
      console.log(`[adminOverview:${correlationId}] Admin authenticated: ${adminPayload.email}`);
    } catch (authError) {
      console.log(`[adminOverview:${correlationId}] Auth failed:`, authError.message);
      return Response.json({ 
        success: false, 
        error: authError.message,
        correlationId 
      }, { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Safe parse request body for parameters
    const body = await safeParseJson(req);
    const { range = '30d', from, to, debug = false } = body;
    console.log(`[adminOverview:${correlationId}] Parameters: range=${range}, debug=${debug}`);

    // Get date range
    const { start, end } = getRangeDate(range, from, to);
    console.log(`[adminOverview:${correlationId}] Range: ${start.toISOString()} to ${end.toISOString()}`);

    // Track missing entities and data sources
    const missingEntities = [];
    const dataSources = {};
    const debugInfo = {};

    // Base KPIs - with error handling
    let accounts = [];
    let characters = [];
    let guilds = [];
    
    try {
      accounts = await base44.asServiceRole.entities.GameAccount.list(null, 10000);
      debugInfo.accountsCount = accounts.length;
      dataSources.accounts = 'GameAccount';
    } catch (e) {
      console.warn(`[adminOverview:${correlationId}] GameAccount query failed:`, e.message);
      missingEntities.push('GameAccount');
      dataSources.accounts = 'unavailable';
    }
    
    try {
      characters = await base44.asServiceRole.entities.GameCharacter.list(null, 10000);
      debugInfo.charactersCount = characters.length;
      dataSources.characters = 'GameCharacter';
    } catch (e) {
      console.warn(`[adminOverview:${correlationId}] GameCharacter query failed:`, e.message);
      missingEntities.push('GameCharacter');
      dataSources.characters = 'unavailable';
    }
    
    try {
      guilds = await base44.asServiceRole.entities.Guild.list(null, 1000);
      debugInfo.guildsCount = guilds.length;
      dataSources.guilds = 'Guild';
    } catch (e) {
      console.warn(`[adminOverview:${correlationId}] Guild query failed:`, e.message);
      missingEntities.push('Guild');
      dataSources.guilds = 'unavailable';
    }

    // Try StoreOrder first for VIP/Box sales (preferred source)
    let storeOrders = [];
    try {
      const allOrders = await base44.asServiceRole.entities.StoreOrder.list('-created_date', 5000);
      storeOrders = allOrders.filter(o => {
        const orderDate = new Date(o.created_date);
        return orderDate >= start && orderDate <= end;
      });
      debugInfo.storeOrdersInRange = storeOrders.length;
      dataSources.vipBoxSales = 'StoreOrder';
    } catch (e) {
      console.warn(`[adminOverview:${correlationId}] StoreOrder query failed:`, e.message);
      dataSources.vipBoxSales = 'unavailable';
    }

    // Compute VIP/Box sales from StoreOrder
    const vipOrders = storeOrders.filter(o => o.item_type === 'PREMIUM');
    const boxOrders = storeOrders.filter(o => o.item_type === 'BOX' || o.item_type === 'PACKAGE');

    const totalVipSoldBrl = vipOrders.filter(o => o.payment_method === 'BRL').reduce((sum, o) => sum + (o.price_brl || 0), 0);
    const totalBoxesSoldBrl = boxOrders.filter(o => o.payment_method === 'BRL').reduce((sum, o) => sum + (o.price_brl || 0), 0);

    // VIP by SKU
    const vipByPlan = {};
    vipOrders.forEach(o => {
      const key = o.item_sku || o.item_name || 'UNKNOWN';
      if (!vipByPlan[key]) {
        vipByPlan[key] = { productKey: key, name: o.item_name || key, soldCount: 0, totalBrl: 0, totalCash: 0 };
      }
      vipByPlan[key].soldCount += 1;
      if (o.payment_method === 'BRL') {
        vipByPlan[key].totalBrl += o.price_brl || 0;
      } else {
        vipByPlan[key].totalCash += o.price_cash || 0;
      }
    });

    // Boxes by SKU
    const boxesByType = {};
    boxOrders.forEach(o => {
      const key = o.item_sku || o.item_name || 'UNKNOWN';
      if (!boxesByType[key]) {
        boxesByType[key] = { productKey: key, name: o.item_name || key, soldCount: 0, totalBrl: 0, totalCash: 0 };
      }
      boxesByType[key].soldCount += 1;
      if (o.payment_method === 'BRL') {
        boxesByType[key].totalBrl += o.price_brl || 0;
      } else {
        boxesByType[key].totalCash += o.price_cash || 0;
      }
    });

    // CommerceEvent as fallback/supplement for ALZ market
    let commerceEvents = [];
    try {
      const allEvents = await base44.asServiceRole.entities.CommerceEvent.list('-created_date', 5000);
      commerceEvents = allEvents.filter(e => {
        const eventDate = new Date(e.created_date);
        return eventDate >= start && eventDate <= end;
      });
      debugInfo.commerceEventsInRange = commerceEvents.length;
      dataSources.alzMarket = 'CommerceEvent';
    } catch (e) {
      console.warn(`[adminOverview:${correlationId}] CommerceEvent query failed:`, e.message);
      dataSources.alzMarket = 'unavailable';
    }

    const alzCompletedEvents = commerceEvents.filter(e => 
      e.productCategory === 'ALZ' && e.eventType === 'ALZ_ORDER_COMPLETED'
    );

    // ALZ market totals
    const alzMarketTotalBrlVolume = alzCompletedEvents.reduce((sum, e) => sum + (e.amountBrl || 0), 0);
    const alzMarketTotalOrders = alzCompletedEvents.length;
    const alzMarketAvgTicketBrl = alzMarketTotalOrders > 0 ? alzMarketTotalBrlVolume / alzMarketTotalOrders : 0;

    // Time series for ALZ market (daily buckets)
    const dailyBuckets = {};
    alzCompletedEvents.forEach(e => {
      const day = new Date(e.created_date).toISOString().split('T')[0];
      if (!dailyBuckets[day]) {
        dailyBuckets[day] = { date: day, valueBrl: 0, count: 0 };
      }
      dailyBuckets[day].valueBrl += e.amountBrl || 0;
      dailyBuckets[day].count += 1;
    });
    const volumeBrlSeries = Object.values(dailyBuckets).sort((a, b) => a.date.localeCompare(b.date));

    // Top sellers and buyers
    const sellerMap = {};
    const buyerMap = {};
    alzCompletedEvents.forEach(e => {
      const seller = e.targetAccountId || 'UNKNOWN';
      const buyer = e.actorAccountId || 'UNKNOWN';
      
      if (!sellerMap[seller]) {
        sellerMap[seller] = { accountId: seller, displayName: seller.substring(0, 12), totalBrl: 0, orders: 0 };
      }
      sellerMap[seller].totalBrl += e.amountBrl || 0;
      sellerMap[seller].orders += 1;

      if (!buyerMap[buyer]) {
        buyerMap[buyer] = { accountId: buyer, displayName: buyer.substring(0, 12), totalBrl: 0, orders: 0 };
      }
      buyerMap[buyer].totalBrl += e.amountBrl || 0;
      buyerMap[buyer].orders += 1;
    });
    const topSellers = Object.values(sellerMap).sort((a, b) => b.totalBrl - a.totalBrl).slice(0, 5);
    const topBuyers = Object.values(buyerMap).sort((a, b) => b.totalBrl - a.totalBrl).slice(0, 5);

    // Disputes count
    let disputes = [];
    try {
      disputes = await base44.asServiceRole.entities.MarketOrder.filter({ status: 'DISPUTA' });
      debugInfo.disputesCount = disputes.length;
      dataSources.disputes = 'MarketOrder';
    } catch (e) {
      console.warn(`[adminOverview:${correlationId}] MarketOrder query failed:`, e.message);
      missingEntities.push('MarketOrder');
      dataSources.disputes = 'unavailable';
    }

    // Recent commerce events
    const recentEvents = commerceEvents.slice(0, 20).map(e => ({
      createdAt: e.created_date,
      eventType: e.eventType,
      productKey: e.productKey,
      amountBrl: e.amountBrl,
      amountCash: e.amountCash,
      amountAlz: e.amountAlz,
      actorDisplay: e.actorUserId ? e.actorUserId.substring(0, 8) : 'system'
    }));

    // Data quality check
    const missingInstrumentation = [];
    if (vipOrders.length === 0 && dataSources.vipBoxSales === 'StoreOrder') {
      missingInstrumentation.push('VIP purchases');
    }
    if (boxOrders.length === 0 && dataSources.vipBoxSales === 'StoreOrder') {
      missingInstrumentation.push('Box purchases');
    }
    if (alzCompletedEvents.length === 0 && dataSources.alzMarket === 'CommerceEvent') {
      missingInstrumentation.push('ALZ market completions');
    }

    console.log(`[adminOverview:${correlationId}] SUCCESS - Generated full payload`);

    const response = {
      success: true,
      correlationId,
      kpis: {
        totalAccounts: accounts.length,
        totalCharacters: characters.length,
        totalGuilds: guilds.length,
        onlineNow: 0,
        totalVipSoldCount: vipOrders.length,
        totalVipSoldBrl,
        totalBoxesSoldCount: boxOrders.length,
        totalBoxesSoldBrl,
        alzMarketTotalBrlVolume,
        alzMarketTotalOrders,
        alzMarketAvgTicketBrl,
        servicesTotalBrl: 0,
        disputesOpenCount: disputes.length
      },
      vipByPlan: Object.values(vipByPlan),
      boxesByType: Object.values(boxesByType),
      alzMarket: {
        volumeBrlSeries,
        ordersSeries: volumeBrlSeries.map(d => ({ date: d.date, count: d.count })),
        topSellers,
        topBuyers
      },
      recentCommerceEvents: recentEvents,
      notes: {
        dataQuality: missingInstrumentation.length === 0 && missingEntities.length === 0 ? 'ok' : 'partial',
        missingInstrumentation,
        missingEntities: missingEntities.length > 0 ? missingEntities : undefined,
        dataSources
      }
    };

    if (debug) {
      response.debugInfo = debugInfo;
    }

    return Response.json(response, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[adminOverview:${correlationId}] CRITICAL ERROR:`, error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Erro interno do servidor',
      correlationId 
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}