import { base44 } from '@/api/base44Client';

/**
 * Build funnel data from AnalyticsEvent entities
 * 
 * @param {object} params - { type: 'summary'|'timeseries', rangeDays: 30 }
 * @returns {Promise<object>} Funnel data
 */
export async function buildFunnelFromEntities({ type, rangeDays = 30 }) {
  try {
    // Calculate date range
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - rangeDays);
    const startDayKey = startDate.toISOString().split('T')[0];

    // Fetch analytics events - limit to avoid performance issues
    const events = await base44.entities.AnalyticsEvent.filter({
      day_key: { $gte: startDayKey }
    }, '-created_date', 2000);

    // Process events
    const funnelCounts = {
      visits_unique: new Set(),
      visits_total: 0,
      signup_view_unique: new Set(),
      signup_complete_unique: new Set(),
      premium_purchase_unique: new Set(),
      alz_trade_unique: new Set()
    };

    const pageViewCounts = {};
    const dailyData = {};

    events.forEach(event => {
      const anonId = event.anon_id || event.session_id;
      const dayKey = event.day_key || event.created_date.split('T')[0];

      // Funnel stages
      if (event.event_type === 'page_view') {
        funnelCounts.visits_unique.add(anonId);
        funnelCounts.visits_total++;

        // Page views
        const pageName = getPageName(event.path);
        if (!pageViewCounts[pageName]) {
          pageViewCounts[pageName] = { total: 0, unique: new Set() };
        }
        pageViewCounts[pageName].total++;
        pageViewCounts[pageName].unique.add(anonId);
      }

      if (event.event_type === 'signup_view') {
        funnelCounts.signup_view_unique.add(anonId);
      }

      if (event.event_type === 'signup_complete') {
        funnelCounts.signup_complete_unique.add(anonId);
      }

      if (event.event_type === 'premium_purchase') {
        funnelCounts.premium_purchase_unique.add(anonId);
      }

      if (event.event_type === 'alz_trade') {
        funnelCounts.alz_trade_unique.add(anonId);
      }

      // Daily aggregation for timeseries
      if (!dailyData[dayKey]) {
        dailyData[dayKey] = {
          visits: new Set(),
          signup_view: new Set(),
          signup_complete: new Set(),
          premium_purchase: new Set(),
          alz_trade: new Set()
        };
      }

      if (event.event_type === 'page_view') dailyData[dayKey].visits.add(anonId);
      if (event.event_type === 'signup_view') dailyData[dayKey].signup_view.add(anonId);
      if (event.event_type === 'signup_complete') dailyData[dayKey].signup_complete.add(anonId);
      if (event.event_type === 'premium_purchase') dailyData[dayKey].premium_purchase.add(anonId);
      if (event.event_type === 'alz_trade') dailyData[dayKey].alz_trade.add(anonId);
    });

    // Convert to numbers
    const funnel = {
      visits_unique: funnelCounts.visits_unique.size,
      visits_total: funnelCounts.visits_total,
      signup_view_unique: funnelCounts.signup_view_unique.size,
      signup_complete_unique: funnelCounts.signup_complete_unique.size,
      premium_purchase_unique: funnelCounts.premium_purchase_unique.size,
      alz_trade_unique: funnelCounts.alz_trade_unique.size
    };

    // Conversion rates
    const conversionRates = {
      visit_to_signup_view: (funnel.signup_view_unique / Math.max(funnel.visits_unique, 1)) * 100,
      signup_view_to_signup_complete: (funnel.signup_complete_unique / Math.max(funnel.signup_view_unique, 1)) * 100,
      signup_complete_to_premium_purchase: (funnel.premium_purchase_unique / Math.max(funnel.signup_complete_unique, 1)) * 100,
      signup_complete_to_alz_trade: (funnel.alz_trade_unique / Math.max(funnel.signup_complete_unique, 1)) * 100
    };

    // Page views array
    const pageViews = Object.entries(pageViewCounts).map(([name, data]) => ({
      name,
      total: data.total,
      unique: data.unique.size
    })).sort((a, b) => b.total - a.total);

    if (type === 'summary') {
      return {
        funnel,
        conversionRates,
        pageViews
      };
    }

    // Timeseries
    const timeseries = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        visits: data.visits.size,
        signup_view: data.signup_view.size,
        signup_complete: data.signup_complete.size,
        premium_purchase: data.premium_purchase.size,
        alz_trade: data.alz_trade.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { timeseries };

  } catch (error) {
    console.error('[buildFunnelFromEntities] Error:', error);
    
    // Return empty data instead of throwing
    if (type === 'summary') {
      return {
        funnel: {
          visits_unique: 0,
          visits_total: 0,
          signup_view_unique: 0,
          signup_complete_unique: 0,
          premium_purchase_unique: 0,
          alz_trade_unique: 0
        },
        conversionRates: {
          visit_to_signup_view: 0,
          signup_view_to_signup_complete: 0,
          signup_complete_to_premium_purchase: 0,
          signup_complete_to_alz_trade: 0
        },
        pageViews: [],
        notes: { missingData: true, error: error.message }
      };
    }
    
    return { 
      timeseries: [],
      notes: { missingData: true, error: error.message }
    };
  }
}

function getPageName(path) {
  const pathMap = {
    '/': 'Início',
    '/Home': 'Início',
    '/Ranking': 'Ranking',
    '/Enquetes': 'Enquetes',
    '/Loja': 'Loja',
    '/Wiki': 'Wiki',
    '/Guildas': 'Guildas',
    '/TGAoVivo': 'TG ao Vivo',
    '/Mercado': 'Mercado',
    '/Suporte': 'Suporte',
    '/MinhaConta': 'Minha Conta',
    '/Registrar': 'Cadastro',
    '/Login': 'Login'
  };
  return pathMap[path] || path;
}