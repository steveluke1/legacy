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

    // Build timeseries
    const timeseries = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const day_key = date.toISOString().split('T')[0];

      const dayEvents = events.filter(e => e.day_key === day_key);

      timeseries.push({
        date: day_key,
        visits: dayEvents.filter(e => e.event_type === 'page_view').length,
        signup_view: dayEvents.filter(e => e.event_type === 'funnel_signup_view').length,
        signup_complete: dayEvents.filter(e => e.event_type === 'funnel_signup_complete').length,
        premium_purchase: dayEvents.filter(e => e.event_type === 'premium_purchase').length,
        alz_trade: dayEvents.filter(e => e.event_type === 'alz_trade').length
      });
    }

    return Response.json({
      success: true,
      timeseries
    });

  } catch (error) {
    console.error('Admin get funnel timeseries error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});