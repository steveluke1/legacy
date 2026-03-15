/**
 * Security Helpers
 * Shared utilities for rate limiting and IP hashing
 */

/**
 * Get client IP from request headers (best-effort)
 * @param {Request} req - HTTP request
 * @returns {string} - Client IP or "unknown"
 */
export function getClientIp(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',');
    return ips[0].trim();
  }
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  
  return 'unknown';
}

/**
 * Hash IP address (SHA-256, truncated)
 * @param {string} ip - IP address
 * @returns {Promise<string>} - Hashed IP (16 chars hex)
 */
export async function hashIp(ip) {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16);
}

/**
 * Hash string (SHA-256, truncated)
 * @param {string} value - String to hash
 * @returns {Promise<string>} - Hashed value (16 chars hex)
 */
export async function hashString(value) {
  if (!value || typeof value !== 'string') return 'null';
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16);
}

/**
 * Rate limit check with concurrency-safe logic
 * @param {object} base44ServiceRole - Base44 service role client
 * @param {string} bucketKey - Unique bucket key (e.g., "login:hash123")
 * @param {number} limit - Max requests per window
 * @param {number} windowSeconds - Window duration in seconds
 * @param {number} blockSeconds - Block duration in seconds after exceeding limit
 * @returns {Promise<{allowed: boolean, remaining: number, blockedUntil?: string}>}
 */
export async function rateLimitCheck(base44ServiceRole, bucketKey, limit, windowSeconds, blockSeconds) {
  const now = new Date();
  const nowMs = now.getTime();
  
  // Query existing bucket
  const buckets = await base44ServiceRole.entities.RateLimitBucket.filter({ key: bucketKey }, undefined, 1);
  
  if (buckets.length === 0) {
    // Create new bucket
    await base44ServiceRole.entities.RateLimitBucket.create({
      key: bucketKey,
      window_start: now.toISOString(),
      count: 1,
      updated_at_iso: now.toISOString()
    });
    
    return { allowed: true, remaining: limit - 1 };
  }
  
  const bucket = buckets[0];
  
  // Check if blocked
  if (bucket.blocked_until) {
    const blockedUntil = new Date(bucket.blocked_until);
    if (blockedUntil.getTime() > nowMs) {
      return {
        allowed: false,
        remaining: 0,
        blockedUntil: bucket.blocked_until
      };
    }
  }
  
  // Check if window expired
  const windowStart = new Date(bucket.window_start);
  const windowEnd = windowStart.getTime() + (windowSeconds * 1000);
  
  if (nowMs > windowEnd) {
    // Reset window
    await base44ServiceRole.entities.RateLimitBucket.update(bucket.id, {
      window_start: now.toISOString(),
      count: 1,
      blocked_until: null,
      updated_at_iso: now.toISOString()
    });
    
    return { allowed: true, remaining: limit - 1 };
  }
  
  // Increment count
  const newCount = bucket.count + 1;
  
  if (newCount > limit) {
    // Block
    const blockUntil = new Date(nowMs + (blockSeconds * 1000));
    await base44ServiceRole.entities.RateLimitBucket.update(bucket.id, {
      count: newCount,
      blocked_until: blockUntil.toISOString(),
      updated_at_iso: now.toISOString()
    });
    
    return {
      allowed: false,
      remaining: 0,
      blockedUntil: blockUntil.toISOString()
    };
  }
  
  // Update count
  await base44ServiceRole.entities.RateLimitBucket.update(bucket.id, {
    count: newCount,
    updated_at_iso: now.toISOString()
  });
  
  return { allowed: true, remaining: limit - newCount };
}

/**
 * Sanitize metadata object (remove sensitive keys, truncate long strings)
 * @param {object} metadata - Raw metadata object
 * @returns {object} - Sanitized metadata
 */
function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return {};
  
  const sensitive = ['password', 'secret', 'token', 'key', 'email', 'pix', 'cpf', 'hash', 'salt'];
  const sanitized = {};
  
  for (const [key, value] of Object.entries(metadata)) {
    const keyLower = key.toLowerCase();
    if (sensitive.some(s => keyLower.includes(s))) continue;
    
    if (typeof value === 'string' && value.length > 200) {
      sanitized[key] = value.substring(0, 200) + '...';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = '[object]';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Log security event (forensics/audit)
 * @param {object} params - Event parameters
 * @param {object} params.base44ServiceClient - Base44 service role client
 * @param {string} params.event_type - Event type
 * @param {string} params.severity - Severity level
 * @param {string} params.actor_type - Actor type
 * @param {string} params.actor_id_raw - Optional raw actor ID (will be hashed)
 * @param {string} params.ip - Optional IP (will be hashed)
 * @param {string} params.user_agent - Optional user agent (will be hashed)
 * @param {string} params.route - Optional route/function name
 * @param {object} params.metadata - Optional metadata (will be sanitized)
 */
export async function logSecurityEvent({
  base44ServiceClient,
  event_type,
  severity,
  actor_type,
  actor_id_raw,
  ip,
  user_agent,
  route,
  metadata
}) {
  try {
    const eventData = {
      event_type,
      severity,
      actor_type
    };
    
    if (actor_id_raw) {
      eventData.actor_id_hash = await hashString(actor_id_raw);
    }
    
    if (ip) {
      eventData.ip_hash = await hashIp(ip);
    }
    
    if (user_agent) {
      eventData.user_agent_hash = await hashString(user_agent);
    }
    
    if (route) {
      eventData.route = route;
    }
    
    if (metadata) {
      eventData.metadata = sanitizeMetadata(metadata);
    }
    
    await base44ServiceClient.entities.SecurityEvent.create(eventData);
  } catch (error) {
    console.error('[logSecurityEvent] Failed to write event:', error.message);
  }
}

/**
 * Create JSON response with security headers
 * @param {object|string} data - Response data
 * @param {number} status - HTTP status code
 * @param {object} extraHeaders - Additional headers
 * @returns {Response} - Response with security headers
 */
export function jsonResponse(data, status = 200, extraHeaders = {}) {
  const headers = {
    'content-type': 'application/json',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'no-referrer',
    'cache-control': 'no-store',
    'content-security-policy': "default-src 'none'",
    'permissions-policy': 'geolocation=(), microphone=(), camera=()',
    'strict-transport-security': 'max-age=15552000; includeSubDomains',
    ...extraHeaders
  };
  
  return new Response(JSON.stringify(data), { status, headers });
}

/**
 * Create standardized error response
 * @param {string} code - Error code (uppercase snake case)
 * @param {string} messagePTBR - Error message in Portuguese
 * @param {number} status - HTTP status code
 * @param {object} metaSafe - Safe metadata (no secrets)
 * @returns {Response} - Error response
 */
export function errorResponse(code, messagePTBR, status, metaSafe = {}) {
  const body = {
    ok: false,
    error: {
      code,
      message: messagePTBR
    }
  };
  
  if (Object.keys(metaSafe).length > 0) {
    body.meta = metaSafe;
  }
  
  return jsonResponse(body, status);
}

/**
 * Require specific HTTP methods
 * @param {Request} req - HTTP request
 * @param {Array<string>} allowedMethods - Allowed methods (e.g., ["GET", "POST"])
 * @param {object} base44ServiceClient - Base44 service role client (for logging)
 * @param {string} route - Function name (for logging)
 * @returns {Response|null} - Error response if method not allowed, null if ok
 */
export async function requireMethods(req, allowedMethods, base44ServiceClient, route) {
  if (!allowedMethods.includes(req.method)) {
    // Log security event (non-blocking)
    if (base44ServiceClient && route) {
      try {
        const clientIp = getClientIp(req);
        const userAgent = req.headers.get('user-agent') || 'unknown';
        
        await logSecurityEvent({
          base44ServiceClient,
          event_type: 'METHOD_NOT_ALLOWED',
          severity: 'low',
          actor_type: 'anon',
          ip: clientIp,
          user_agent: userAgent,
          route,
          metadata: {
            method: req.method,
            allowed: allowedMethods.join(',')
          }
        });
      } catch (logError) {
        console.error('[requireMethods] Logging failed:', logError.message);
      }
    }
    
    return errorResponse('METHOD_NOT_ALLOWED', 'Método não permitido.', 405);
  }
  
  return null;
}

/**
 * Read and parse JSON with size limit
 * @param {Request} req - HTTP request
 * @param {number} maxBytes - Maximum payload size in bytes
 * @returns {Promise<{ok: boolean, data?: object, response?: Response}>}
 */
export async function readJsonWithLimit(req, maxBytes) {
  // GET/HEAD have no body
  if (req.method === 'GET' || req.method === 'HEAD') {
    return { ok: true, data: null };
  }
  
  try {
    // Read body as ArrayBuffer
    const buffer = await req.arrayBuffer();
    
    // Check size
    if (buffer.byteLength > maxBytes) {
      return {
        ok: false,
        response: errorResponse('PAYLOAD_TOO_LARGE', 'Payload muito grande.', 413, {
          max_bytes: maxBytes,
          received_bytes: buffer.byteLength
        })
      };
    }
    
    // Parse JSON
    const text = new TextDecoder().decode(buffer);
    
    if (!text || text.trim() === '') {
      return { ok: true, data: {} };
    }
    
    const data = JSON.parse(text);
    return { ok: true, data };
    
  } catch (parseError) {
    return {
      ok: false,
      response: errorResponse('INVALID_JSON', 'JSON inválido.', 400)
    };
  }
}

/**
 * Enforce CORS allowlist for browser endpoints
 * @param {Request} req - HTTP request
 * @param {string} allowlistEnvName - ENV var name for allowlist (comma-separated origins)
 * @returns {Promise<{ok: boolean, corsHeaders?: object, response?: Response}>}
 */
export function enforceCors(req, allowlistEnvName = 'ORIGIN_ALLOWLIST') {
  const origin = req.headers.get('origin');
  
  // No Origin header = not a browser request, skip CORS
  if (!origin) {
    return { ok: true, corsHeaders: {} };
  }
  
  // Read allowlist from ENV
  const allowlistRaw = Deno.env.get(allowlistEnvName);
  
  // Fail-closed: if ENV not set, deny all browser requests
  if (!allowlistRaw || allowlistRaw.trim() === '') {
    return {
      ok: false,
      response: errorResponse('FORBIDDEN_ORIGIN', 'Origem não permitida.', 403)
    };
  }
  
  const allowlist = allowlistRaw.split(',').map(o => o.trim()).filter(Boolean);
  
  // Check if origin is allowed
  if (!allowlist.includes(origin)) {
    return {
      ok: false,
      response: errorResponse('FORBIDDEN_ORIGIN', 'Origem não permitida.', 403)
    };
  }
  
  // Origin allowed, return CORS headers
  return {
    ok: true,
    corsHeaders: {
      'access-control-allow-origin': origin,
      'vary': 'Origin'
    }
  };
}

/**
 * Read raw body with size limit (for webhooks/binary data)
 * @param {Request} req - HTTP request
 * @param {number} maxBytes - Maximum payload size
 * @returns {Promise<{ok: boolean, rawText?: string, response?: Response}>}
 */
export async function readRawBodyWithLimit(req, maxBytes) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return { ok: true, rawText: '' };
  }
  
  try {
    const buffer = await req.arrayBuffer();
    
    if (buffer.byteLength > maxBytes) {
      return {
        ok: false,
        response: errorResponse('PAYLOAD_TOO_LARGE', 'Payload muito grande.', 413, {
          max_bytes: maxBytes,
          received_bytes: buffer.byteLength
        })
      };
    }
    
    const rawText = new TextDecoder().decode(buffer);
    return { ok: true, rawText };
    
  } catch (error) {
    return {
      ok: false,
      response: errorResponse('INTERNAL_ERROR', 'Erro ao ler payload.', 500)
    };
  }
}

/**
 * Safe JSON parse from text
 * @param {string} rawText - Raw text to parse
 * @returns {{ok: boolean, data?: object, response?: Response}}
 */
export function safeParseJsonText(rawText) {
  if (!rawText || rawText.trim() === '') {
    return { ok: true, data: {} };
  }
  
  try {
    const data = JSON.parse(rawText);
    return { ok: true, data };
  } catch (parseError) {
    return {
      ok: false,
      response: errorResponse('INVALID_JSON', 'JSON inválido.', 400)
    };
  }
}

/**
 * Constant-time string comparison (for secrets)
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} - True if equal
 */
export function constantTimeEquals(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Require header secret with constant-time comparison
 * @param {Request} req - HTTP request
 * @param {string} headerName - Header name (e.g., "x-cron-secret")
 * @param {string} envVarName - ENV var name (e.g., "CRON_SECRET")
 * @param {string} eventTypeOnFail - SecurityEvent type on failure
 * @param {object} base44ServiceClient - Base44 service role client (for logging)
 * @param {string} route - Function name (for logging)
 * @returns {Promise<{ok: boolean, response?: Response}>}
 */
export async function requireHeaderSecret(req, headerName, envVarName, eventTypeOnFail, base44ServiceClient, route) {
  // Read env var (required)
  const expectedSecret = Deno.env.get(envVarName);
  
  if (!expectedSecret || expectedSecret.trim() === '') {
    // Fail-closed: missing config
    if (base44ServiceClient && route) {
      try {
        await logSecurityEvent({
          base44ServiceClient,
          event_type: eventTypeOnFail || 'CONFIG_ERROR',
          severity: 'high',
          actor_type: 'system',
          route,
          metadata: {
            missing_env: envVarName
          }
        });
      } catch (logError) {
        console.error('[requireHeaderSecret] Logging failed:', logError.message);
      }
    }
    
    return {
      ok: false,
      response: errorResponse('CONFIG_ERROR', 'Configuração de segurança ausente no servidor.', 500)
    };
  }
  
  // Read header (required)
  const providedSecret = req.headers.get(headerName);
  
  if (!providedSecret || !constantTimeEquals(providedSecret, expectedSecret)) {
    // Unauthorized
    if (base44ServiceClient && route) {
      try {
        const clientIp = getClientIp(req);
        const userAgent = req.headers.get('user-agent') || 'unknown';
        
        await logSecurityEvent({
          base44ServiceClient,
          event_type: eventTypeOnFail || 'UNAUTHORIZED',
          severity: 'medium',
          actor_type: 'anon',
          ip: clientIp,
          user_agent: userAgent,
          route,
          metadata: {
            header_name: headerName,
            header_present: !!providedSecret
          }
        });
      } catch (logError) {
        console.error('[requireHeaderSecret] Logging failed:', logError.message);
      }
    }
    
    return {
      ok: false,
      response: errorResponse('UNAUTHORIZED', 'Não autorizado.', 401)
    };
  }
  
  return { ok: true };
}

/**
 * Apply rate limiting (reuses existing rateLimitCheck)
 * @param {object} base44ServiceClient - Base44 service role client
 * @param {string} bucketKey - Unique bucket key
 * @param {number} limit - Max requests per window
 * @param {number} windowSeconds - Window duration
 * @param {string} route - Function name (for logging)
 * @param {Request} req - HTTP request (for IP/UA)
 * @param {object} metaSafe - Safe metadata for response
 * @returns {Promise<{ok: boolean, response?: Response}>}
 */
export async function applyRateLimit(base44ServiceClient, bucketKey, limit, windowSeconds, route, req, metaSafe = {}) {
  const rateLimit = await rateLimitCheck(base44ServiceClient, bucketKey, limit, windowSeconds, 300);
  
  if (!rateLimit.allowed) {
    // Log rate limit exceeded
    try {
      const clientIp = getClientIp(req);
      const userAgent = req.headers.get('user-agent') || 'unknown';
      
      await logSecurityEvent({
        base44ServiceClient,
        event_type: 'RATE_LIMIT_EXCEEDED',
        severity: 'low',
        actor_type: 'anon',
        ip: clientIp,
        user_agent: userAgent,
        route,
        metadata: {
          ...metaSafe,
          blocked_until: rateLimit.blockedUntil
        }
      });
    } catch (logError) {
      console.error('[applyRateLimit] Logging failed:', logError.message);
    }
    
    return {
      ok: false,
      response: errorResponse('RATE_LIMIT_EXCEEDED', 'Muitas requisições. Tente novamente em alguns minutos.', 429, metaSafe)
    };
  }
  
  return { ok: true };
}

/**
 * Build IP and User-Agent hashes (reuses existing helpers)
 * @param {Request} req - HTTP request
 * @returns {Promise<{ip_hash: string, ua_hash: string}>}
 */
export async function buildIpUaHashes(req) {
  const clientIp = getClientIp(req);
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  const ip_hash = await hashIp(clientIp);
  const ua_hash = await hashString(userAgent);
  
  return { ip_hash, ua_hash };
}