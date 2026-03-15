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
    
    // Extract admin token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ success: false, error: 'Token não fornecido' }, { status: 401 });
    }
    
    const adminToken = authHeader.substring(7);
    const jwtSecret = Deno.env.get('ADMIN_JWT_SECRET') || 'admin-secret-change-me';
    try {
      await verifyJWT(adminToken, jwtSecret);
    } catch {
      return Response.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    // Parse request body for parameters
    const body = await req.json().catch(() => ({}));
    const { rangeDays = 30 } = body;

    // Calculate date range
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - rangeDays);
    const dayKeyStart = daysAgo.toISOString().split('T')[0];

    // Fetch all events in range
    const allEvents = await base44.asServiceRole.entities.AnalyticsEvent.list('-created_date', 50000);
    const events = allEvents.filter(e => e.day_key >= dayKeyStart);

    // Page views breakdown
    const pageViews = {};
    const pageViewsByAnon = {};

    events.filter(e => e.event_type === 'page_view').forEach(event => {
      const pageName = event.event_name;
      if (!pageViews[pageName]) {
        pageViews[pageName] = { total: 0, unique: new Set() };
      }
      pageViews[pageName].total++;
      pageViews[pageName].unique.add(event.anon_id);
    });

    // Convert to array
    const pageViewsArray = Object.entries(pageViews).map(([name, data]) => ({
      name,
      total: data.total,
      unique: data.unique.size
    })).sort((a, b) => b.total - a.total);

    // Funnel metrics
    const visits = new Set();
    const visitsTotal = events.filter(e => e.event_type === 'page_view').length;
    events.filter(e => e.event_type === 'page_view').forEach(e => visits.add(e.anon_id));

    const signupViews = new Set();
    const signupViewsTotal = events.filter(e => e.event_type === 'funnel_signup_view').length;
    events.filter(e => e.event_type === 'funnel_signup_view').forEach(e => signupViews.add(e.anon_id));

    const signupCompletes = new Set();
    const signupCompletesTotal = events.filter(e => e.event_type === 'funnel_signup_complete').length;
    events.filter(e => e.event_type === 'funnel_signup_complete').forEach(e => {
      if (e.user_id) signupCompletes.add(e.user_id);
      else signupCompletes.add(e.anon_id);
    });

    const premiumPurchases = new Set();
    const premiumPurchasesTotal = events.filter(e => e.event_type === 'premium_purchase').length;
    events.filter(e => e.event_type === 'premium_purchase').forEach(e => {
      if (e.user_id) premiumPurchases.add(e.user_id);
    });

    const alzTrades = new Set();
    const alzTradesTotal = events.filter(e => e.event_type === 'alz_trade').length;
    events.filter(e => e.event_type === 'alz_trade').forEach(e => {
      if (e.user_id) alzTrades.add(e.user_id);
    });

    // Conversion rates
    const conversionRates = {
      visit_to_signup_view: visits.size > 0 ? (signupViews.size / visits.size) * 100 : 0,
      signup_view_to_signup_complete: signupViews.size > 0 ? (signupCompletes.size / signupViews.size) * 100 : 0,
      signup_complete_to_premium_purchase: signupCompletes.size > 0 ? (premiumPurchases.size / signupCompletes.size) * 100 : 0,
      signup_complete_to_alz_trade: signupCompletes.size > 0 ? (alzTrades.size / signupCompletes.size) * 100 : 0
    };

    return Response.json({
      success: true,
      pageViews: pageViewsArray,
      funnel: {
        visits_total: visitsTotal,
        visits_unique: visits.size,
        signup_view_total: signupViewsTotal,
        signup_view_unique: signupViews.size,
        signup_complete_total: signupCompletesTotal,
        signup_complete_unique: signupCompletes.size,
        premium_purchase_total: premiumPurchasesTotal,
        premium_purchase_unique: premiumPurchases.size,
        alz_trade_total: alzTradesTotal,
        alz_trade_unique: alzTrades.size
      },
      conversionRates
    });

  } catch (error) {
    console.error('Admin get funnel summary error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});