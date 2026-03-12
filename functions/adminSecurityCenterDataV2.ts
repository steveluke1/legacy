import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_SIGNATURE = 'P0-SELF-CONTAINED-20251225-0002';

// ============================================================================
// INLINED HELPERS
// ============================================================================

async function verifyJwtHs256(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const keyData = encoder.encode(secret);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = Uint8Array.from(
      atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify('HMAC', key, signature, data);
    if (!valid) return null;

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

function parseBearerToken(req) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

async function verifyAdminToken(req, base44) {
  const token = parseBearerToken(req);
  
  if (!token) {
    throw new Error('Acesso restrito. Faça login de administrador.');
  }

  const jwtSecret = Deno.env.get('ADMIN_JWT_SECRET');
  if (!jwtSecret) {
    throw new Error('Configuração de segurança ausente.');
  }

  const payload = await verifyJwtHs256(token, jwtSecret);
  if (!payload) {
    throw new Error('Token inválido ou expirado.');
  }

  const sessions = await base44.asServiceRole.entities.AdminSession.filter({
    admin_user_id: payload.sub,
    token_jti: payload.jti
  }, undefined, 1);

  if (sessions.length === 0) {
    throw new Error('Sessão não encontrada.');
  }

  const session = sessions[0];
  if (session.revoked_at) {
    throw new Error('Sessão revogada.');
  }

  const admins = await base44.asServiceRole.entities.AdminUser.filter({
    id: payload.sub
  }, undefined, 1);

  if (admins.length === 0) {
    throw new Error('Administrador não encontrado.');
  }

  const admin = admins[0];
  if (!admin.is_active) {
    throw new Error('Conta desativada.');
  }

  return {
    adminId: payload.sub,
    email: payload.email,
    username: payload.username,
    role: payload.role,
    jti: payload.jti
  };
}

function getClientIp(req) {
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

async function hashIp(ip) {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16);
}

async function hashString(value) {
  if (!value || typeof value !== 'string') return 'null';
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16);
}

async function rateLimitCheck(base44ServiceRole, bucketKey, limit, windowSeconds, blockSeconds) {
  const now = new Date();
  const nowMs = now.getTime();
  
  const buckets = await base44ServiceRole.entities.RateLimitBucket.filter({ key: bucketKey }, undefined, 1);
  
  if (buckets.length === 0) {
    await base44ServiceRole.entities.RateLimitBucket.create({
      key: bucketKey,
      window_start: now.toISOString(),
      count: 1,
      updated_at_iso: now.toISOString()
    });
    
    return { allowed: true, remaining: limit - 1 };
  }
  
  const bucket = buckets[0];
  
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
  
  const windowStart = new Date(bucket.window_start);
  const windowEnd = windowStart.getTime() + (windowSeconds * 1000);
  
  if (nowMs > windowEnd) {
    await base44ServiceRole.entities.RateLimitBucket.update(bucket.id, {
      window_start: now.toISOString(),
      count: 1,
      blocked_until: null,
      updated_at_iso: now.toISOString()
    });
    
    return { allowed: true, remaining: limit - 1 };
  }
  
  const newCount = bucket.count + 1;
  
  if (newCount > limit) {
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
  
  await base44ServiceRole.entities.RateLimitBucket.update(bucket.id, {
    count: newCount,
    updated_at_iso: now.toISOString()
  });
  
  return { allowed: true, remaining: limit - newCount };
}

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

async function logSecurityEvent({
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
    console.error('[logSecurityEvent] Failed:', error.message);
  }
}

function jsonResponse(data, status = 200) {
  const headers = {
    'content-type': 'application/json',
    'x-content-type-options': 'nosniff',
    'cache-control': 'no-store'
  };
  
  return new Response(JSON.stringify(data), { status, headers });
}

function errorResponse(code, messagePTBR, status, metaSafe = {}) {
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

async function requireMethods(req, allowedMethods, base44ServiceClient, route) {
  if (!allowedMethods.includes(req.method)) {
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

async function readJsonWithLimit(req, maxBytes) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return { ok: true, data: null };
  }
  
  try {
    const buffer = await req.arrayBuffer();
    
    if (buffer.byteLength > maxBytes) {
      return {
        ok: false,
        response: errorResponse('PAYLOAD_TOO_LARGE', 'Payload muito grande.', 413)
      };
    }
    
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

async function applyRateLimit(base44ServiceClient, bucketKey, limit, windowSeconds, route, req, metaSafe = {}) {
  const rateLimit = await rateLimitCheck(base44ServiceClient, bucketKey, limit, windowSeconds, 300);
  
  if (!rateLimit.allowed) {
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
      response: errorResponse('RATE_LIMIT_EXCEEDED', 'Muitas requisições.', 429, metaSafe)
    };
  }
  
  return { ok: true };
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

const SENSITIVE_ENTITIES = [
  'AdminUser',
  'AdminSession',
  'AuthSession',
  'AuthUser',
  'PixCharge',
  'AlzOrder',
  'SellerProfile',
  'SellerPayoutProfile',
  'SplitPayout',
  'MarketplaceLedger',
  'MarketplaceAuditLog',
  'AuthAuditLog',
  'AdminAuditLog',
  'PixWebhookEvent',
  'RateLimitBucket',
  'SecurityEvent',
  'LedgerEntry',
  'CashLedger',
  'PasswordResetToken'
];

const REQUIRED_ENV_VARS = [
  'CRON_SECRET',
  'EFI_WEBHOOK_SECRET',
  'ADMIN_JWT_SECRET',
  'JWT_SECRET'
];

const OPTIONAL_ENV_VARS = [
  'EFI_WEBHOOK_IP_ALLOWLIST',
  'WEB_ORIGIN_ALLOWLIST',
  'ENV'
];

Deno.serve(async (req) => {
  const correlationId = `sec-v2-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const base44 = createClientFromRequest(req);
    
    const methodError = await requireMethods(req, ['GET', 'POST'], base44.asServiceRole, 'adminSecurityCenterDataV2');
    if (methodError) return methodError;
    
    const clientIp = getClientIp(req);
    const ipHash = await hashIp(clientIp);
    const bucketKey = `adminSecurityCenterV2:${ipHash}`;
    
    const rateLimitResult = await applyRateLimit(
      base44.asServiceRole,
      bucketKey,
      30,
      60,
      'adminSecurityCenterDataV2',
      req,
      { correlation_id: correlationId }
    );
    if (!rateLimitResult.ok) return rateLimitResult.response;
    
    let adminUser;
    try {
      adminUser = await verifyAdminToken(req, base44);
    } catch (error) {
      console.warn(`[adminSecurityCenterDataV2:${correlationId}] UNAUTHORIZED: ${error.message}`);
      
      try {
        await logSecurityEvent({
          base44ServiceClient: base44.asServiceRole,
          event_type: 'SECURITY_CENTER_UNAUTHORIZED',
          severity: 'medium',
          actor_type: 'anon',
          ip: clientIp,
          user_agent: req.headers.get('user-agent') || 'unknown',
          route: 'adminSecurityCenterDataV2',
          metadata: {
            method: req.method,
            correlation_id: correlationId
          }
        });
      } catch (logError) {
        console.error('[adminSecurityCenterDataV2] Log error:', logError.message);
      }
      
      return errorResponse('UNAUTHORIZED', 'Não autorizado.', 401, {
        name: 'adminSecurityCenterDataV2',
        build_signature: BUILD_SIGNATURE,
        correlation_id: correlationId
      });
    }
    
    console.log(`[adminSecurityCenterDataV2:${correlationId}] ${req.method} admin=${adminUser.adminId}`);
    
    if (req.method === 'GET') {
      await logSecurityEvent({
        base44ServiceClient: base44.asServiceRole,
        event_type: 'SECURITY_CENTER_ACCESS',
        severity: 'low',
        actor_type: 'admin',
        actor_id_raw: adminUser.adminId,
        route: 'adminSecurityCenterDataV2',
        metadata: {
          method: 'GET',
          correlation_id: correlationId
        }
      });
      
      return jsonResponse({
        ok: true,
        data: {
          name: 'adminSecurityCenterDataV2',
          build: BUILD_SIGNATURE,
          time: new Date().toISOString(),
          methods: ['GET (metadata)', 'POST (full data)']
        }
      }, 200);
    }
    
    const bodyResult = await readJsonWithLimit(req, 64 * 1024);
    if (!bodyResult.ok) return bodyResult.response;
    
    const payload = bodyResult.data;
    const action = payload.action || 'refresh';
    const limit = Math.min(payload.limit || 50, 100);
    
    const now = new Date().toISOString();
    
    const envStatus = {
      required: REQUIRED_ENV_VARS.map(name => ({
        name,
        present: !!Deno.env.get(name)
      })),
      optional: OPTIONAL_ENV_VARS.map(name => ({
        name,
        present: !!Deno.env.get(name)
      })),
      updated_at: now
    };
    
    const exposureScan = await runExposureScan(base44, adminUser, correlationId);
    
    const securityEvents = await base44.asServiceRole.entities.SecurityEvent.list('-created_date', limit);
    
    const sanitizedEvents = securityEvents.map(evt => ({
      id: evt.id,
      created_date: evt.created_date,
      severity: evt.severity,
      event_type: evt.event_type,
      actor_type: evt.actor_type,
      ip_hash: evt.ip_hash?.substring(0, 8) + '***' || null,
      user_agent_hash: evt.user_agent_hash?.substring(0, 8) + '***' || null,
      route: evt.route,
      metadata: sanitizeEventMetadata(evt.metadata)
    }));
    
    const rateLimitSummary = await getRateLimitSummary(base44);
    
    await logSecurityEvent({
      base44ServiceClient: base44.asServiceRole,
      event_type: 'SECURITY_CENTER_ACCESS',
      severity: 'low',
      actor_type: 'admin',
      actor_id_raw: adminUser.adminId,
      route: 'adminSecurityCenterDataV2',
      metadata: {
        method: 'POST',
        action,
        correlation_id: correlationId
      }
    });
    
    console.log(`[adminSecurityCenterDataV2:${correlationId}] COMPLETE admin=${adminUser.adminId}`);
    
    return jsonResponse({
      ok: true,
      data: {
        env: envStatus,
        exposure_scan: exposureScan,
        security_events: {
          items: sanitizedEvents,
          limit
        },
        rate_limits: rateLimitSummary,
        build_signature: BUILD_SIGNATURE,
        correlation_id: correlationId
      }
    }, 200);
    
  } catch (error) {
    console.error(`[adminSecurityCenterDataV2:${correlationId}] ERROR: ${error.message}`);
    return errorResponse('INTERNAL_ERROR', 'Erro interno.', 500, {
      name: 'adminSecurityCenterDataV2',
      build_signature: BUILD_SIGNATURE,
      correlation_id: correlationId
    });
  }
});

async function runExposureScan(base44, adminUser, correlationId) {
  const findings = [];
  let criticalCount = 0;
  let okCount = 0;
  let unknownCount = 0;
  
  for (const entityName of SENSITIVE_ENTITIES) {
    try {
      if (!base44.entities[entityName]) {
        findings.push({
          key: entityName,
          severity: 'low',
          message: `Entity ${entityName} não encontrado no SDK`
        });
        unknownCount++;
        continue;
      }
      
      await base44.entities[entityName].list(null, 1);
      
      findings.push({
        key: entityName,
        severity: 'high',
        message: `Entity ${entityName} permite leitura pública (CRÍTICO)`
      });
      criticalCount++;
      
      await logSecurityEvent({
        base44ServiceClient: base44.asServiceRole,
        event_type: 'EXPOSURE_DETECTED',
        severity: 'critical',
        actor_type: 'admin',
        actor_id_raw: adminUser.adminId,
        route: 'adminSecurityCenterDataV2',
        metadata: {
          entity: entityName,
          method: 'public_list',
          correlation_id: correlationId
        }
      });
      
    } catch (error) {
      if (error.message?.includes('permission') || 
          error.message?.includes('Unauthorized') ||
          error.message?.includes('403') ||
          error.status === 403) {
        okCount++;
      } else {
        findings.push({
          key: entityName,
          severity: 'medium',
          message: `Entity ${entityName} retornou erro inesperado: ${error.message?.substring(0, 30)}`
        });
        unknownCount++;
      }
    }
  }
  
  for (const envName of REQUIRED_ENV_VARS) {
    if (!Deno.env.get(envName)) {
      findings.push({
        key: `ENV:${envName}`,
        severity: 'high',
        message: `Variável obrigatória ${envName} ausente`
      });
      criticalCount++;
    }
  }
  
  const status = criticalCount > 0 ? 'critical' : (unknownCount > 0 ? 'warning' : 'ok');
  
  return {
    status,
    findings,
    summary: {
      critical: criticalCount,
      ok: okCount,
      unknown: unknownCount,
      total: SENSITIVE_ENTITIES.length
    },
    scanned_at: new Date().toISOString()
  };
}

async function getRateLimitSummary(base44) {
  try {
    const allBuckets = await base44.asServiceRole.entities.RateLimitBucket.list('-updated_at_iso', 100);
    
    const now = Date.now();
    const activeBuckets = allBuckets.filter(b => {
      if (b.blocked_until) {
        return new Date(b.blocked_until).getTime() > now;
      }
      return b.count > 0;
    });
    
    const topKeys = activeBuckets
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 10)
      .map(b => ({
        key: b.key?.substring(0, 20) + '***' || 'unknown',
        hits: b.count || 0,
        blocked_until: b.blocked_until || null
      }));
    
    return {
      summary: {
        active_buckets: activeBuckets.length,
        top_keys: topKeys
      },
      sampled_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('[getRateLimitSummary] Error:', error.message);
    return {
      summary: {
        active_buckets: 0,
        top_keys: []
      },
      sampled_at: new Date().toISOString(),
      error: 'Falha ao carregar rate limits'
    };
  }
}

function sanitizeEventMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return {};
  
  const sanitized = { ...metadata };
  
  const sensitiveKeys = [
    'password', 'secret', 'token', 'key', 'pix', 'cpf', 'email',
    'ip', 'txid', 'endtoendid', 'qr_code', 'copy_paste'
  ];
  
  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(s => lowerKey.includes(s))) {
      delete sanitized[key];
    }
  }
  
  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === 'string' && sanitized[key].length > 100) {
      sanitized[key] = sanitized[key].substring(0, 100) + '...';
    }
  }
  
  return sanitized;
}