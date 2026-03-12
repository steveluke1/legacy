import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_SIGNATURE = 'P0-SELF-CONTAINED-20251225-0001';

// ============================================================================
// INLINED HELPERS (from authHelpers.js and securityHelpers.js)
// ============================================================================

/**
 * Manually verify JWT without external dependencies
 */
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
    console.error('[verifyJwtHs256] Error:', error.message);
    return null;
  }
}

/**
 * Parse Bearer token from Authorization header
 */
function parseBearerToken(req) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * Verify admin token and return payload
 */
async function verifyAdminToken(req, base44) {
  const token = parseBearerToken(req);
  
  if (!token) {
    throw new Error('Acesso restrito. Faça login de administrador.');
  }

  const jwtSecret = Deno.env.get('ADMIN_JWT_SECRET');
  if (!jwtSecret) {
    console.error('[verifyAdminToken] ADMIN_JWT_SECRET not configured');
    throw new Error('Configuração de segurança ausente. Contate o administrador do sistema.');
  }

  const payload = await verifyJwtHs256(token, jwtSecret);
  if (!payload) {
    throw new Error('Token de administrador inválido ou expirado.');
  }

  const sessions = await base44.asServiceRole.entities.AdminSession.filter({
    admin_user_id: payload.sub,
    token_jti: payload.jti
  }, undefined, 1);

  if (sessions.length === 0) {
    throw new Error('Sessão de administrador não encontrada.');
  }

  const session = sessions[0];
  if (session.revoked_at) {
    throw new Error('Sessão de administrador revogada.');
  }

  const admins = await base44.asServiceRole.entities.AdminUser.filter({
    id: payload.sub
  }, undefined, 1);

  if (admins.length === 0) {
    throw new Error('Administrador não encontrado.');
  }

  const admin = admins[0];
  if (!admin.is_active) {
    throw new Error('Conta de administrador desativada.');
  }

  return {
    adminId: payload.sub,
    email: payload.email,
    username: payload.username,
    role: payload.role,
    jti: payload.jti
  };
}

/**
 * Hash string (SHA-256, truncated)
 */
async function hashString(value) {
  if (!value || typeof value !== 'string') return 'null';
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16);
}

/**
 * Sanitize metadata
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
 * Log security event
 */
async function logSecurityEvent({
  base44ServiceClient,
  event_type,
  severity,
  actor_type,
  actor_id_raw,
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

// ============================================================================
// MAIN FUNCTION
// ============================================================================

// Sensitive entities to scan for public read exposure
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

Deno.serve(async (req) => {
  const correlationId = `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Admin-only endpoint
    let adminUser;
    try {
      adminUser = await verifyAdminToken(req, base44);
    } catch (error) {
      console.warn(`[adminSecurityScan:${correlationId}] UNAUTHORIZED: ${error.message}`);
      return Response.json({
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Não autorizado.'
        },
        data: {
          buildSignature: BUILD_SIGNATURE,
          correlationId
        }
      }, { status: 401 });
    }
    
    console.log(`[adminSecurityScan:${correlationId}] START admin=${adminUser.adminId}`);
    
    const results = [];
    let criticalCount = 0;
    let okCount = 0;
    let unknownCount = 0;
    
    // Scan each sensitive entity for public read exposure
    for (const entityName of SENSITIVE_ENTITIES) {
      try {
        if (!base44.entities[entityName]) {
          results.push({
            entity: entityName,
            public_readable: false,
            status: 'UNKNOWN',
            note: 'Entity not found in SDK'
          });
          unknownCount++;
          continue;
        }
        
        // Try to read 1 record without auth/service role
        await base44.entities[entityName].list(null, 1);
        
        // If we reach here, entity is publicly readable (CRITICAL)
        results.push({
          entity: entityName,
          public_readable: true,
          status: 'CRITICAL',
          note: 'Public list() succeeded without auth'
        });
        
        criticalCount++;
        
        await logSecurityEvent({
          base44ServiceClient: base44.asServiceRole,
          event_type: 'EXPOSURE_DETECTED',
          severity: 'critical',
          actor_type: 'admin',
          actor_id_raw: adminUser.adminId,
          route: 'adminSecurityScan',
          metadata: {
            entity: entityName,
            method: 'public_list_1',
            result: 'success',
            correlation_id: correlationId
          }
        });
        
      } catch (error) {
        if (error.message?.includes('permission') || 
            error.message?.includes('Unauthorized') ||
            error.message?.includes('403') ||
            error.status === 403) {
          results.push({
            entity: entityName,
            public_readable: false,
            status: 'OK',
            note: 'Protected (permission denied)'
          });
          okCount++;
        } else {
          results.push({
            entity: entityName,
            public_readable: false,
            status: 'UNKNOWN',
            note: `Error: ${error.message?.substring(0, 50) || 'unknown'}`
          });
          unknownCount++;
        }
      }
    }
    
    await logSecurityEvent({
      base44ServiceClient: base44.asServiceRole,
      event_type: 'SECURITY_SCAN_EXECUTED',
      severity: criticalCount > 0 ? 'high' : 'low',
      actor_type: 'admin',
      actor_id_raw: adminUser.adminId,
      route: 'adminSecurityScan',
      metadata: {
        scanned_entities: SENSITIVE_ENTITIES.length,
        critical_exposures: criticalCount,
        ok_count: okCount,
        unknown_count: unknownCount,
        correlation_id: correlationId
      }
    });
    
    console.log(`[adminSecurityScan:${correlationId}] COMPLETE critical=${criticalCount} ok=${okCount} unknown=${unknownCount}`);
    
    return Response.json({
      ok: true,
      data: {
        scanned_at: new Date().toISOString(),
        results,
        summary: {
          critical: criticalCount,
          ok: okCount,
          unknown: unknownCount,
          total: SENSITIVE_ENTITIES.length
        },
        buildSignature: BUILD_SIGNATURE,
        correlationId
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error(`[adminSecurityScan:${correlationId}] ERROR: ${error.message}`);
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro interno.'
      },
      data: {
        buildSignature: BUILD_SIGNATURE,
        correlationId
      }
    }, { status: 500 });
  }
});