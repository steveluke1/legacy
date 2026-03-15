import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { verifyAdminToken } from './_shared/authHelpers.js';
import {
  requireMethods,
  readJsonWithLimit,
  jsonResponse,
  errorResponse,
  logSecurityEvent,
  applyRateLimit,
  getClientIp,
  hashIp
} from './securityHelpers.js';

const BUILD_SIGNATURE = 'P4-DEPLOY-PROOF-20251224-1530';

// Sensitive entities to scan for public exposure
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

// Required env vars for operations
const REQUIRED_ENV_VARS = [
  'CRON_SECRET',
  'EFI_WEBHOOK_SECRET',
  'ADMIN_JWT_SECRET',
  'JWT_SECRET'
];

// Optional env vars
const OPTIONAL_ENV_VARS = [
  'EFI_WEBHOOK_IP_ALLOWLIST',
  'WEB_ORIGIN_ALLOWLIST',
  'ENV'
];

Deno.serve(async (req) => {
  const correlationId = `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const base44 = createClientFromRequest(req);
    
    // 1. Method check (GET and POST allowed)
    const methodError = await requireMethods(req, ['GET', 'POST'], base44.asServiceRole, 'adminSecurityCenterData');
    if (methodError) return methodError;
    
    // 2. Rate limiting (30 req/min per IP)
    const clientIp = getClientIp(req);
    const ipHash = await hashIp(clientIp);
    const bucketKey = `adminSecurityCenter:${ipHash}`;
    
    const rateLimitResult = await applyRateLimit(
      base44.asServiceRole,
      bucketKey,
      30,
      60,
      'adminSecurityCenterData',
      req,
      { correlation_id: correlationId }
    );
    if (!rateLimitResult.ok) return rateLimitResult.response;
    
    // 3. Admin auth verification (BOTH GET and POST)
    let adminUser;
    try {
      adminUser = await verifyAdminToken(req, base44);
    } catch (error) {
      console.warn(`[adminSecurityCenterData:${correlationId}] UNAUTHORIZED: ${error.message}`);
      
      // Log unauthorized attempt
      try {
        await logSecurityEvent({
          base44ServiceClient: base44.asServiceRole,
          event_type: 'SECURITY_CENTER_UNAUTHORIZED',
          severity: 'medium',
          actor_type: 'anon',
          ip: clientIp,
          user_agent: req.headers.get('user-agent') || 'unknown',
          route: 'adminSecurityCenterData',
          metadata: {
            method: req.method,
            correlation_id: correlationId
          }
        });
      } catch (logError) {
        console.error('[adminSecurityCenterData] Log error:', logError.message);
      }
      
      return errorResponse('UNAUTHORIZED', 'Não autorizado.', 401, {
        build_signature: BUILD_SIGNATURE,
        correlation_id: correlationId
      });
    }
    
    console.log(`[adminSecurityCenterData:${correlationId}] ${req.method} admin=${adminUser.adminId}`);
    
    // 4. Handle GET (metadata only)
    if (req.method === 'GET') {
      await logSecurityEvent({
        base44ServiceClient: base44.asServiceRole,
        event_type: 'SECURITY_CENTER_ACCESS',
        severity: 'low',
        actor_type: 'admin',
        actor_id_raw: adminUser.adminId,
        route: 'adminSecurityCenterData',
        metadata: {
          method: 'GET',
          correlation_id: correlationId
        }
      });
      
      return jsonResponse({
        ok: true,
        data: {
          name: 'adminSecurityCenterData',
          build: BUILD_SIGNATURE,
          time: new Date().toISOString(),
          methods: ['GET (metadata)', 'POST (full data)']
        }
      }, 200);
    }
    
    // 5. Payload parsing (POST only: action field)
    const bodyResult = await readJsonWithLimit(req, 64 * 1024);
    if (!bodyResult.ok) return bodyResult.response;
    
    const payload = bodyResult.data;
    const action = payload.action || 'refresh';
    const limit = Math.min(payload.limit || 50, 100);
    
    // 6. Gather data
    const now = new Date().toISOString();
    
    // A) Environment variables status
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
    
    // B) Exposure scan (inline implementation)
    const exposureScan = await runExposureScan(base44, adminUser, correlationId);
    
    // C) Security events (latest N)
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
    
    // D) Rate limits summary
    const rateLimitSummary = await getRateLimitSummary(base44);
    
    // 7. Log admin access
    await logSecurityEvent({
      base44ServiceClient: base44.asServiceRole,
      event_type: 'SECURITY_CENTER_ACCESS',
      severity: 'low',
      actor_type: 'admin',
      actor_id_raw: adminUser.adminId,
      route: 'adminSecurityCenterData',
      metadata: {
        method: 'POST',
        action,
        correlation_id: correlationId
      }
    });
    
    console.log(`[adminSecurityCenterData:${correlationId}] COMPLETE admin=${adminUser.adminId}`);
    
    // 8. Return consolidated data
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
    console.error(`[adminSecurityCenterData:${correlationId}] ERROR: ${error.message}`);
    return errorResponse('INTERNAL_ERROR', 'Erro interno.', 500, {
      build_signature: BUILD_SIGNATURE,
      correlation_id: correlationId
    });
  }
});

/**
 * Run exposure scan for sensitive entities
 */
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
      
      // Attempt public list without service role
      await base44.entities[entityName].list(null, 1);
      
      // If we reach here, entity is publicly readable (CRITICAL)
      findings.push({
        key: entityName,
        severity: 'high',
        message: `Entity ${entityName} permite leitura pública (CRÍTICO)`
      });
      criticalCount++;
      
      // Log exposure
      await logSecurityEvent({
        base44ServiceClient: base44.asServiceRole,
        event_type: 'EXPOSURE_DETECTED',
        severity: 'critical',
        actor_type: 'admin',
        actor_id_raw: adminUser.adminId,
        route: 'adminSecurityCenterData',
        metadata: {
          entity: entityName,
          method: 'public_list',
          correlation_id: correlationId
        }
      });
      
    } catch (error) {
      // Permission error expected (good)
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
  
  // Check missing env vars
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

/**
 * Get rate limit summary (active buckets + top offenders)
 */
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

/**
 * Sanitize event metadata (remove sensitive keys)
 */
function sanitizeEventMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return {};
  
  const sanitized = { ...metadata };
  
  // Remove sensitive keys
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
  
  // Truncate long strings
  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === 'string' && sanitized[key].length > 100) {
      sanitized[key] = sanitized[key].substring(0, 100) + '...';
    }
  }
  
  return sanitized;
}