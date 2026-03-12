import { base44 } from '@/api/base44Client';

const ANON_ID_KEY = 'cz_anon_id';
const SESSION_ID_KEY = 'cz_session_id';
const UTM_KEY = 'cz_utm';

// Generate or get stable anonymous ID
function getOrCreateAnonId() {
  let anonId = localStorage.getItem(ANON_ID_KEY);
  if (!anonId) {
    anonId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(ANON_ID_KEY, anonId);
  }
  return anonId;
}

// Generate or get session ID (per tab)
function getOrCreateSessionId() {
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

// Parse and store UTM params on first landing
function captureUTM() {
  const stored = localStorage.getItem(UTM_KEY);
  if (stored) return JSON.parse(stored);

  const params = new URLSearchParams(window.location.search);
  const utm = {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign')
  };

  if (utm.utm_source || utm.utm_medium || utm.utm_campaign) {
    localStorage.setItem(UTM_KEY, JSON.stringify(utm));
  }

  return utm;
}

// Get basic device info
function getDeviceInfo() {
  return {
    ua: navigator.userAgent,
    platform: navigator.platform,
    isMobile: /Mobile|Android|iPhone/i.test(navigator.userAgent)
  };
}

// Debounce map to prevent duplicate page views
const recentEvents = new Map();

function shouldTrack(dedupeKey, windowMs = 10000) {
  const now = Date.now();
  const last = recentEvents.get(dedupeKey);
  
  if (last && (now - last) < windowMs) {
    return false;
  }
  
  recentEvents.set(dedupeKey, now);
  return true;
}

// Main tracking function
export async function trackEvent({
  event_type,
  event_name,
  path,
  metadata = {}
}) {
  try {
    const anon_id = getOrCreateAnonId();
    const session_id = getOrCreateSessionId();
    const utm = captureUTM();
    const device = getDeviceInfo();

    // Client-side deduplication for page views
    if (event_type === 'page_view') {
      const dedupeKey = `${event_type}:${path}`;
      if (!shouldTrack(dedupeKey)) {
        return; // Skip duplicate
      }
    }

    // Get user_id from localStorage token if exists (custom auth)
    let user_id = null;
    try {
      const token = localStorage.getItem('lon_auth_token');
      if (token) {
        // Token exists, analytics function will resolve user_id server-side
        // Just send a flag that user is authenticated
        user_id = 'authenticated';
      }
    } catch {
      // Keep null
    }

    const payload = {
      event_type,
      event_name,
      path: path || window.location.pathname,
      role_context: user_id ? 'user' : 'public',
      user_id,
      session_id,
      anon_id,
      referrer: document.referrer || null,
      ...utm,
      device,
      metadata,
      timestamp: new Date().toISOString()
    };

    // Fire and forget - don't await to avoid blocking UI
    base44.functions.invoke('analytics_ingestEvent', payload).catch(() => {
      // Silently fail - analytics should never break app
    });

  } catch (error) {
    // Silently fail - analytics should never break app
  }
}

// Track page view
export function trackPageView(path, pageName) {
  trackEvent({
    event_type: 'page_view',
    event_name: pageName,
    path
  });
}

// Track funnel stage
export function trackFunnel(stageName, metadata = {}) {
  trackEvent({
    event_type: `funnel_${stageName}`,
    event_name: stageName,
    path: window.location.pathname,
    metadata
  });
}