import { base44 } from '@/api/base44Client';

/**
 * Build store sales data from StoreOrder entities
 * 
 * @param {object} params - { limit: 100, days: 30 }
 * @returns {Promise<object>} Sales data
 */
export async function buildStoreSalesFromEntities({ limit = 100, days = 30 }) {
  try {
    // Calculate date range
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Fetch orders - safe limit
    const safeLimit = Math.min(limit, 1000);
    const allOrders = await base44.entities.StoreOrder.filter({
      created_date: { $gte: startDate.toISOString() }
    }, '-created_date', safeLimit);

    // Calculate summary
    const summary = {
      totalOrders: allOrders.length,
      totalRevenueBRL: 0,
      totalRevenueCash: 0,
      ordersByStatus: {
        pending: 0,
        paid: 0,
        fulfilled: 0,
        cancelled: 0,
        failed: 0
      },
      ordersByType: {}
    };

    const dailyRevenue = {};

    allOrders.forEach(order => {
      // Revenue
      if (order.payment_method === 'BRL' && order.price_brl) {
        summary.totalRevenueBRL += order.price_brl;
      }
      if (order.payment_method === 'CASH' && order.price_cash) {
        summary.totalRevenueCash += order.price_cash;
      }

      // Status
      if (order.status in summary.ordersByStatus) {
        summary.ordersByStatus[order.status]++;
      }

      // Type
      const itemType = order.item_type || 'OTHER';
      if (!summary.ordersByType[itemType]) {
        summary.ordersByType[itemType] = {
          count: 0,
          revenueBRL: 0,
          revenueCash: 0
        };
      }
      summary.ordersByType[itemType].count++;
      if (order.payment_method === 'BRL' && order.price_brl) {
        summary.ordersByType[itemType].revenueBRL += order.price_brl;
      }
      if (order.payment_method === 'CASH' && order.price_cash) {
        summary.ordersByType[itemType].revenueCash += order.price_cash;
      }

      // Daily revenue
      const dateKey = order.created_date.split('T')[0];
      if (!dailyRevenue[dateKey]) {
        dailyRevenue[dateKey] = 0;
      }
      if (order.payment_method === 'BRL' && order.price_brl) {
        dailyRevenue[dateKey] += order.price_brl;
      }
    });

    // Timeseries
    const timeseries = Object.entries(dailyRevenue)
      .map(([date, revenueBRL]) => ({ date, revenueBRL }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      summary,
      orders: allOrders,
      timeseries
    };

  } catch (error) {
    console.error('[buildStoreSalesFromEntities] Error:', error);
    
    // Return empty data
    return {
      summary: {
        totalOrders: 0,
        totalRevenueBRL: 0,
        totalRevenueCash: 0,
        ordersByStatus: {
          pending: 0,
          paid: 0,
          fulfilled: 0,
          cancelled: 0,
          failed: 0
        },
        ordersByType: {}
      },
      orders: [],
      timeseries: [],
      notes: { missingData: true, error: error.message }
    };
  }
}