import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import {
  requireMethods,
  readJsonWithLimit,
  jsonResponse,
  errorResponse,
  requireHeaderSecret,
  applyRateLimit,
  getClientIp,
  hashIp
} from './securityHelpers.js';
import { runSecurityAlertDispatch } from './_shared/securityAlertCore.js';

const BUILD_SIGNATURE = 'P5B-DISPATCH-20251224-V3';

Deno.serve(async (req) => {
  const correlationId = `alert-dispatch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const base44 = createClientFromRequest(req);
    
    // 1. Method check (POST only)
    const methodError = await requireMethods(req, ['POST'], base44.asServiceRole, 'securityAlertDispatch');
    if (methodError) return methodError;
    
    // 2. Rate limiting (10 req/min per IP)
    const clientIp = getClientIp(req);
    const ipHash = await hashIp(clientIp);
    const bucketKey = `securityAlertDispatch:${ipHash}`;
    
    const rateLimitResult = await applyRateLimit(
      base44.asServiceRole,
      bucketKey,
      10,
      60,
      'securityAlertDispatch',
      req,
      { correlation_id: correlationId }
    );
    if (!rateLimitResult.ok) return rateLimitResult.response;
    
    // 3. Auth check (CRON_SECRET via x-cron-secret header)
    const authResult = await requireHeaderSecret(
      req,
      'x-cron-secret',
      'CRON_SECRET',
      'ALERT_DISPATCH_UNAUTHORIZED',
      base44.asServiceRole,
      'securityAlertDispatch'
    );
    if (!authResult.ok) return authResult.response;
    
    console.log(`[securityAlertDispatch:${correlationId}] Authorized`);
    
    // 4. Payload parsing (16KB limit)
    const bodyResult = await readJsonWithLimit(req, 16 * 1024);
    if (!bodyResult.ok) return bodyResult.response;
    
    const payload = bodyResult.data || {};
    
    // 5. Call core dispatch logic
    const result = await runSecurityAlertDispatch(base44, {
      source: 'cron',
      force: payload.force === true,
      lookbackMinutes: payload.lookbackMinutes,
      correlationId
    });
    
    // 6. Return response
    if (result.ok) {
      return jsonResponse(result.data, 200);
    } else {
      const status = result.error?.code === 'MISCONFIG' ? 500 : 500;
      return jsonResponse(result, status);
    }
    
  } catch (error) {
    console.error(`[securityAlertDispatch:${correlationId}] ERROR: ${error.message}`);
    return errorResponse('INTERNAL_ERROR', 'Erro ao processar alerta de segurança.', 500, {
      build_signature: BUILD_SIGNATURE,
      correlation_id: correlationId
    });
  }
});