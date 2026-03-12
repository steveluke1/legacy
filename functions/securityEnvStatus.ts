import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { verifyAdminToken } from './_shared/authHelpers.js';
import { 
  getClientIp, 
  hashIp, 
  rateLimitCheck, 
  jsonResponse, 
  errorResponse, 
  requireMethods,
  readJsonWithLimit,
  enforceCors,
  logSecurityEvent
} from './securityHelpers.js';

const BUILD_SIGNATURE = 'lon-securityEnvStatus-2025-12-23-v2';

Deno.serve(async (req) => {
  const correlationId = `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const base44 = createClientFromRequest(req);
    
    // 1. Method check (POST only)
    const methodError = await requireMethods(req, ['POST'], base44.asServiceRole, 'securityEnvStatus');
    if (methodError) return methodError;
    
    // 2. CORS enforcement
    const corsCheck = enforceCors(req, 'ORIGIN_ALLOWLIST');
    if (!corsCheck.ok) return corsCheck.response;
    
    // 3. Rate limiting (30 req/min per IP)
    const clientIp = getClientIp(req);
    const ipHash = await hashIp(clientIp);
    const bucketKey = `envstatus:${ipHash}`;
    
    const rateLimit = await rateLimitCheck(base44.asServiceRole, bucketKey, 30, 60, 300);
    
    if (!rateLimit.allowed) {
      try {
        await logSecurityEvent({
          base44ServiceClient: base44.asServiceRole,
          event_type: 'RATE_LIMIT_EXCEEDED',
          severity: 'low',
          actor_type: 'anon',
          ip: clientIp,
          user_agent: req.headers.get('user-agent') || 'unknown',
          route: 'securityEnvStatus',
          metadata: {
            correlation_id: correlationId,
            blocked_until: rateLimit.blockedUntil
          }
        });
      } catch (logError) {
        console.error('[securityEnvStatus] Log error:', logError.message);
      }
      
      return errorResponse('RATE_LIMIT_EXCEEDED', 'Muitas requisições. Tente novamente em alguns minutos.', 429, {
        correlation_id: correlationId
      });
    }
    
    // 4. Payload size limit (64KB)
    const jsonResult = await readJsonWithLimit(req, 64 * 1024);
    if (!jsonResult.ok) return jsonResult.response;
    
    // 5. Admin auth verification
    let adminUser;
    try {
      adminUser = await verifyAdminToken(req, base44);
    } catch (error) {
      console.warn(`[securityEnvStatus:${correlationId}] UNAUTHORIZED: ${error.message}`);
      return errorResponse('UNAUTHORIZED', 'Não autorizado.', 401, {
        build_signature: BUILD_SIGNATURE,
        correlation_id: correlationId
      });
    }
    
    // 6. Check env vars (never return values, only booleans)
    const deliveryRun = {
      CRON_SECRET: !!Deno.env.get('CRON_SECRET')
    };
    
    const efiPixWebhook = {
      ENV: !!Deno.env.get('ENV'),
      EFI_WEBHOOK_SECRET: !!Deno.env.get('EFI_WEBHOOK_SECRET'),
      EFI_WEBHOOK_IP_ALLOWLIST: !!Deno.env.get('EFI_WEBHOOK_IP_ALLOWLIST')
    };
    
    console.log(`[securityEnvStatus:${correlationId}] SUCCESS admin=${adminUser.adminId}`);
    
    // 7. Success response with security headers
    return jsonResponse({
      ok: true,
      data: {
        deliveryRun,
        efiPixWebhook,
        build_signature: BUILD_SIGNATURE,
        correlation_id: correlationId
      }
    }, 200, corsCheck.corsHeaders);
    
  } catch (error) {
    console.error(`[securityEnvStatus:${correlationId}] ERROR: ${error.message}`);
    return errorResponse('INTERNAL_ERROR', 'Erro ao verificar configuração.', 500, {
      build_signature: BUILD_SIGNATURE,
      correlation_id: correlationId
    });
  }
});