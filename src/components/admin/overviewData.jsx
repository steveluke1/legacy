// Admin Overview data builder - direct entities access
import { base44 } from '@/api/base44Client';

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

export async function buildOverviewFromEntities({ range = '30d', from, to }) {
  const missingEntities = [];
  const dataSources = {};
  const { start, end } = getRangeDate(range, from, to);

  console.log('[overviewData] Building overview from entities directly');
  console.log('[overviewData] Range:', start.toISOString(), 'to', end.toISOString());

  // Base counts
  let accounts = [];
  let characters = [];
  let guilds = [];

  try {
    accounts = await base44.entities.GameAccount.list(null, 10000);
    dataSources.accounts = 'GameAccount';
  } catch (e) {
    console.warn('[overviewData] GameAccount failed:', e.message);
    missingEntities.push('GameAccount');
    dataSources.accounts = 'unavailable';
  }

  try {
    characters = await base44.entities.GameCharacter.list(null, 10000);
    dataSources.characters = 'GameCharacter';
  } catch (e) {
    console.warn('[overviewData] GameCharacter failed:', e.message);
    missingEntities.push('GameCharacter');
    dataSources.characters = 'unavailable';
  }

  try {
    guilds = await base44.entities.Guild.list(null, 1000);
    dataSources.guilds = 'Guild';
  } catch (e) {
    console.warn('[overviewData] Guild failed:', e.message);
    missingEntities.push('Guild');
    dataSources.guilds = 'unavailable';
  }

  // Store orders (VIP/Box sales)
  let storeOrders = [];
  try {
    const allOrders = await base44.entities.StoreOrder.list('-created_date', 2000);
    storeOrders = allOrders.filter(o => {
      const orderDate = new Date(o.created_date);
      return orderDate >= start && orderDate <= end;
    });
    dataSources.vipBoxSales = 'StoreOrder';
  } catch (e) {
    console.warn('[overviewData] StoreOrder failed:', e.message);
    dataSources.vipBoxSales = 'unavailable';
  }

  // Process VIP and Box orders
  const vipOrders = storeOrders.filter(o => 
    o.item_type === 'PREMIUM' && ['paid', 'fulfilled'].includes(o.status)
  );
  const boxOrders = storeOrders.filter(o => 
    ['BOX', 'PACKAGE', 'ITEM'].includes(o.item_type) && ['paid', 'fulfilled'].includes(o.status)
  );

  const totalVipSoldBrl = vipOrders
    .filter(o => o.payment_method === 'BRL')
    .reduce((sum, o) => sum + (o.price_brl || 0), 0);

  const totalBoxesSoldBrl = boxOrders
    .filter(o => o.payment_method === 'BRL')
    .reduce((sum, o) => sum + (o.price_brl || 0), 0);

  // VIP by plan
  const vipByPlan = {};
  vipOrders.forEach(o => {
    const key = o.item_sku || o.item_name || 'UNKNOWN';
    if (!vipByPlan[key]) {
      vipByPlan[key] = { 
        productKey: key, 
        name: o.item_name || key, 
        soldCount: 0, 
        totalBrl: 0, 
        totalCash: 0 
      };
    }
    vipByPlan[key].soldCount += 1;
    if (o.payment_method === 'BRL') {
      vipByPlan[key].totalBrl += o.price_brl || 0;
    } else {
      vipByPlan[key].totalCash += o.price_cash || 0;
    }
  });

  // Boxes by type
  const boxesByType = {};
  boxOrders.forEach(o => {
    const key = o.item_sku || o.item_name || 'UNKNOWN';
    if (!boxesByType[key]) {
      boxesByType[key] = { 
        productKey: key, 
        name: o.item_name || key, 
        soldCount: 0, 
        totalBrl: 0, 
        totalCash: 0 
      };
    }
    boxesByType[key].soldCount += 1;
    if (o.payment_method === 'BRL') {
      boxesByType[key].totalBrl += o.price_brl || 0;
    } else {
      boxesByType[key].totalCash += o.price_cash || 0;
    }
  });

  // Try CommerceEvent for ALZ market (optional, don't fail if unavailable)
  let commerceEvents = [];
  let alzMarketTotalBrlVolume = 0;
  let alzMarketTotalOrders = 0;
  let volumeBrlSeries = [];
  let topSellers = [];
  let topBuyers = [];

  try {
    const allEvents = await base44.entities.CommerceEvent.list('-created_date', 5000);
    commerceEvents = allEvents.filter(e => {
      const eventDate = new Date(e.created_date);
      return eventDate >= start && eventDate <= end;
    });

    const alzCompletedEvents = commerceEvents.filter(e => 
      e.productCategory === 'ALZ' && e.eventType === 'ALZ_ORDER_COMPLETED'
    );

    alzMarketTotalBrlVolume = alzCompletedEvents.reduce((sum, e) => sum + (e.amountBrl || 0), 0);
    alzMarketTotalOrders = alzCompletedEvents.length;

    // Daily series
    const dailyBuckets = {};
    alzCompletedEvents.forEach(e => {
      const day = new Date(e.created_date).toISOString().split('T')[0];
      if (!dailyBuckets[day]) {
        dailyBuckets[day] = { date: day, valueBrl: 0, count: 0 };
      }
      dailyBuckets[day].valueBrl += e.amountBrl || 0;
      dailyBuckets[day].count += 1;
    });
    volumeBrlSeries = Object.values(dailyBuckets).sort((a, b) => a.date.localeCompare(b.date));

    // Top sellers/buyers
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
    topSellers = Object.values(sellerMap).sort((a, b) => b.totalBrl - a.totalBrl).slice(0, 5);
    topBuyers = Object.values(buyerMap).sort((a, b) => b.totalBrl - a.totalBrl).slice(0, 5);

    dataSources.alzMarket = 'CommerceEvent';
  } catch (e) {
    console.warn('[overviewData] CommerceEvent unavailable:', e.message);
    dataSources.alzMarket = 'unavailable';
  }

  // Disputes count
  let disputes = [];
  try {
    disputes = await base44.entities.MarketOrder.filter({ status: 'DISPUTA' });
    dataSources.disputes = 'MarketOrder';
  } catch (e) {
    console.warn('[overviewData] MarketOrder unavailable:', e.message);
    dataSources.disputes = 'unavailable';
  }

  // Recent events
  const recentEvents = commerceEvents.slice(0, 20).map(e => ({
    createdAt: e.created_date,
    eventType: e.eventType,
    productKey: e.productKey,
    amountBrl: e.amountBrl,
    amountCash: e.amountCash,
    amountAlz: e.amountAlz,
    actorDisplay: e.actorUserId ? e.actorUserId.substring(0, 8) : 'system'
  }));

  // Data quality check - only warn if StoreOrder is unavailable
  const missingInstrumentation = [];
  if (dataSources.vipBoxSales === 'unavailable') {
    missingInstrumentation.push('Sem StoreOrder no período');
  } else if (storeOrders.length === 0) {
    // StoreOrder exists but no data in range - expected for new/preview environments
    missingInstrumentation.push('Sem pedidos no período selecionado');
  }

  const dataQuality = (missingEntities.length === 0 && missingInstrumentation.length === 0) ? 'ok' : 'partial';

  console.log('[overviewData] Built overview successfully:', {
    accounts: accounts.length,
    characters: characters.length,
    guilds: guilds.length,
    vipOrders: vipOrders.length,
    boxOrders: boxOrders.length,
    dataQuality
  });

  return {
    success: true,
    source: 'EntitiesDirect',
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
      alzMarketAvgTicketBrl: alzMarketTotalOrders > 0 ? alzMarketTotalBrlVolume / alzMarketTotalOrders : 0,
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
      dataQuality,
      missingInstrumentation: missingInstrumentation.length > 0 ? missingInstrumentation : undefined,
      missingEntities: missingEntities.length > 0 ? missingEntities : undefined,
      dataSources
    }
  };
}