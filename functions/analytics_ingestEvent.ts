import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts';

const BUILD_SIGNATURE = 'analytics-ingest-v2-safe-20260115';

// Hash function for dedupe keys
async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

// Compute dedupe key based on event type
async function computeDedupeKey(event) {
  const { event_type, anon_id, user_id, path, timestamp, metadata } = event;
  
  const ts = new Date(timestamp).getTime();
  
  switch (event_type) {
    case 'page_view': {
      // Dedupe page views per anon within 30s window
      const window = Math.floor(ts / 30000);
      return await hashString(`${anon_id}:${path}:${window}`);
    }
    
    case 'funnel_signup_view': {
      // Dedupe signup view per anon within 5min window
      const window = Math.floor(ts / 300000);
      return await hashString(`${anon_id}:signup_view:${window}`);
    }
    
    case 'funnel_signup_complete': {
      // One signup completion per user (or anon if no user)
      const id = user_id || anon_id;
      return await hashString(`${id}:signup_complete`);
    }
    
    case 'premium_purchase': {
      // Use order_id if available, else user_id + day
      const orderId = metadata?.order_id;
      if (orderId) {
        return await hashString(`premium:${orderId}`);
      }
      const dayKey = event.day_key;
      return await hashString(`${user_id}:premium:${dayKey}`);
    }
    
    case 'alz_trade': {
      // Use trade_id/order_id if available
      const tradeId = metadata?.order_id || metadata?.trade_id;
      if (tradeId) {
        return await hashString(`alz:${tradeId}`);
      }
      const dayKey = event.day_key;
      const tradeType = metadata?.trade_type || 'unknown';
      return await hashString(`${user_id}:alz:${tradeType}:${dayKey}`);
    }
    
    default: {
      // Generic dedupe: event_type + anon_id + day
      const dayKey = event.day_key;
      return await hashString(`${event_type}:${anon_id}:${dayKey}`);
    }
  }
}

Deno.serve(async (req) => {
  const correlationId = `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse body defensively
    let payload;
    try {
      payload = await req.json();
    } catch (parseError) {
      // Best-effort: return success even if parsing fails
      console.warn(`[analytics:${correlationId}] JSON parse failed: ${parseError.message}`);
      return Response.json({
        ok: true,
        data: { stored: false, reason: 'invalid_json' },
        correlation_id: correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 200 });
    }

    // Validate required fields (best-effort)
    const { event_type, event_name, session_id, anon_id } = payload || {};
    
    if (!event_type || !event_name || !session_id || !anon_id) {
      // Best-effort: return success even if fields missing
      console.warn(`[analytics:${correlationId}] Missing required fields`);
      return Response.json({
        ok: true,
        data: { stored: false, reason: 'missing_fields' },
        correlation_id: correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 200 });
    }

    // Compute server-side timestamps
    const now = new Date();
    const day_key = now.toISOString().split('T')[0];

    // Build event object
    const event = {
      event_type,
      event_name,
      path: payload.path || null,
      role_context: payload.role_context || 'public',
      user_id: payload.user_id || null,
      session_id,
      anon_id,
      referrer: payload.referrer || null,
      utm_source: payload.utm_source || null,
      utm_medium: payload.utm_medium || null,
      utm_campaign: payload.utm_campaign || null,
      device: payload.device || null,
      day_key,
      metadata: payload.metadata || {},
      timestamp: payload.timestamp || now.toISOString()
    };

    // Compute dedupe key (best-effort)
    let dedupe_key;
    try {
      dedupe_key = await computeDedupeKey(event);
      event.dedupe_key = dedupe_key;
    } catch (dedupeError) {
      console.warn(`[analytics:${correlationId}] Dedupe key computation failed: ${dedupeError.message}`);
      // Continue without dedupe (will allow duplicates, but analytics shouldn't block)
    }

    // Try to store event (best-effort)
    try {
      // Check if event already exists (idempotency)
      if (dedupe_key) {
        const existing = await base44.asServiceRole.entities.AnalyticsEvent.filter({
          dedupe_key
        }, undefined, 1);

        if (existing.length > 0) {
          // Event already recorded, skip
          return Response.json({
            ok: true,
            data: { stored: false, reason: 'duplicate' },
            correlation_id: correlationId,
            build_signature: BUILD_SIGNATURE
          }, { status: 200 });
        }
      }

      // Insert event
      await base44.asServiceRole.entities.AnalyticsEvent.create(event);

      return Response.json({
        ok: true,
        data: { stored: true },
        correlation_id: correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 200 });

    } catch (storageError) {
      // Best-effort: return success even if storage fails (analytics should never break app)
      console.error(`[analytics:${correlationId}] Storage failed: ${storageError.message}`);
      return Response.json({
        ok: true,
        data: { stored: false, reason: 'storage_error' },
        correlation_id: correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 200 });
    }

  } catch (error) {
    // Best-effort: return success even on unexpected errors
    console.error(`[analytics:${correlationId}] Unexpected error: ${error.message}`);
    return Response.json({
      ok: true,
      data: { stored: false, reason: 'unexpected_error' },
      correlation_id: correlationId,
      build_signature: BUILD_SIGNATURE
    }, { status: 200 });
  }
});