import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { 
  getClientIp, 
  hashIp, 
  rateLimitCheck, 
  jsonResponse, 
  errorResponse, 
  requireMethods,
  enforceCors,
  logSecurityEvent
} from './securityHelpers.js';

const BUILD_SIGNATURE = 'lon-pingDeploy-2025-12-23-v3';

Deno.serve(async (req) => {
  const correlationId = `ping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const base44 = createClientFromRequest(req);
  
  // 1. Method check (GET only)
  const methodError = await requireMethods(req, ['GET'], base44.asServiceRole, 'pingDeploy');
  if (methodError) return methodError;
  
  // 2. CORS enforcement (browser endpoints only)
  const corsCheck = enforceCors(req, 'ORIGIN_ALLOWLIST');
  if (!corsCheck.ok) return corsCheck.response;
  
  // 3. Rate limiting (60 req/min per IP)
  const clientIp = getClientIp(req);
  const ipHash = await hashIp(clientIp);
  const bucketKey = `ping:${ipHash}`;
  
  const rateLimit = await rateLimitCheck(base44.asServiceRole, bucketKey, 60, 60, 300);
  
  if (!rateLimit.allowed) {
    // Log rate limit exceeded
    try {
      await logSecurityEvent({
        base44ServiceClient: base44.asServiceRole,
        event_type: 'RATE_LIMIT_EXCEEDED',
        severity: 'low',
        actor_type: 'anon',
        ip: clientIp,
        user_agent: req.headers.get('user-agent') || 'unknown',
        route: 'pingDeploy',
        metadata: {
          correlation_id: correlationId,
          blocked_until: rateLimit.blockedUntil
        }
      });
    } catch (logError) {
      console.error('[pingDeploy] Log error:', logError.message);
    }
    
    return errorResponse('RATE_LIMIT_EXCEEDED', 'Muitas requisições. Tente novamente em alguns minutos.', 429, {
      correlation_id: correlationId
    });
  }
  
  // 4. Success response with security headers
  return jsonResponse({
    ok: true,
    data: {
      status: 'ok',
      time_iso: new Date().toISOString(),
      build_signature: BUILD_SIGNATURE,
      correlation_id: correlationId
    }
  }, 200, corsCheck.corsHeaders);
});