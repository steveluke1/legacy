// functions/bridgeDiagnostics.js
// Admin-only diagnostics: tests Bridge endpoints with dummy data

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { callBridge } from './_shared/bridgeClient.js';

const BUILD_SIGNATURE = 'bridge-diagnostics-v1-20260107';

Deno.serve(async (req) => {
  const correlationId = `bridge-diag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // ADMIN-ONLY
    if (!user || user.role !== 'admin') {
      return Response.json({
        ok: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Somente administradores'
        }
      }, { status: 403 });
    }
    
    const { testNic = 'DiagnosticTestChar' } = await req.json().catch(() => ({}));
    
    const report = {
      correlation_id: correlationId,
      build_signature: BUILD_SIGNATURE,
      timestamp: new Date().toISOString(),
      bridge_config: {
        base_url: Deno.env.get('BRIDGE_BASE_URL') ? '[CONFIGURED]' : '[MISSING]',
        api_key: Deno.env.get('BRIDGE_API_KEY') ? '[CONFIGURED]' : '[MISSING]'
      },
      endpoints: [],
      overall_status: 'success'
    };
    
    // Validate Bridge config
    if (!Deno.env.get('BRIDGE_BASE_URL') || !Deno.env.get('BRIDGE_API_KEY')) {
      report.overall_status = 'failed';
      report.error = 'Bridge não configurado (BRIDGE_BASE_URL ou BRIDGE_API_KEY ausente)';
      
      return Response.json({
        ok: false,
        data: report
      }, { status: 503 });
    }
    
    // TEST 1: /internal/character/resolve-nic
    try {
      const resolveResult = await callBridge('/internal/character/resolve-nic', {
        nic: testNic
      }, 'POST', 8000);
      
      report.endpoints.push({
        name: '/internal/character/resolve-nic',
        method: 'POST',
        status: resolveResult.ok ? 'available' : 'unavailable',
        http_status: resolveResult.error?.httpStatus || 200,
        error_code: resolveResult.error?.code || null,
        error_message: resolveResult.error?.message || null,
        next_action: resolveResult.error?.next_action || null,
        response_sample: resolveResult.ok ? {
          characterIdx: resolveResult.data?.characterIdx || null,
          userNum: resolveResult.data?.userNum || null,
          isOnline: resolveResult.data?.isOnline || null
        } : null
      });
      
      if (!resolveResult.ok) {
        report.overall_status = 'degraded';
      }
    } catch (resolveError) {
      report.endpoints.push({
        name: '/internal/character/resolve-nic',
        method: 'POST',
        status: 'error',
        error: resolveError.message
      });
      report.overall_status = 'degraded';
    }
    
    // TEST 2: /internal/character/check-online
    try {
      const onlineResult = await callBridge('/internal/character/check-online', {
        nic: testNic
      }, 'POST', 8000);
      
      report.endpoints.push({
        name: '/internal/character/check-online',
        method: 'POST',
        status: onlineResult.ok ? 'available' : 'unavailable',
        http_status: onlineResult.error?.httpStatus || 200,
        error_code: onlineResult.error?.code || null,
        error_message: onlineResult.error?.message || null,
        next_action: onlineResult.error?.next_action || null,
        response_sample: onlineResult.ok ? {
          isOnline: onlineResult.data?.isOnline || null
        } : null
      });
      
      if (!onlineResult.ok) {
        report.overall_status = 'degraded';
      }
    } catch (onlineError) {
      report.endpoints.push({
        name: '/internal/character/check-online',
        method: 'POST',
        status: 'error',
        error: onlineError.message
      });
      report.overall_status = 'degraded';
    }
    
    // TEST 3: /internal/alz/settle
    try {
      const settleResult = await callBridge('/internal/alz/settle', {
        buyerCharacterIdx: 999999, // Fake
        idempotencyKey: `diag_${correlationId}`
      }, 'POST', 8000);
      
      report.endpoints.push({
        name: '/internal/alz/settle',
        method: 'POST',
        status: settleResult.ok ? 'available' : 'unavailable',
        http_status: settleResult.error?.httpStatus || 200,
        error_code: settleResult.error?.code || null,
        error_message: settleResult.error?.message || null,
        next_action: settleResult.error?.next_action || null,
        note: 'Fake CharacterIdx usado (999999) - espera-se erro de validação se endpoint existe'
      });
      
      if (!settleResult.ok && settleResult.error?.code === 'BRIDGE_ENDPOINT_NOT_FOUND') {
        report.overall_status = 'degraded';
      }
    } catch (settleError) {
      report.endpoints.push({
        name: '/internal/alz/settle',
        method: 'POST',
        status: 'error',
        error: settleError.message
      });
      report.overall_status = 'degraded';
    }
    
    // TEST 4: /health (if exists)
    try {
      const healthResult = await callBridge('/health', {}, 'GET', 5000);
      
      report.endpoints.push({
        name: '/health',
        method: 'GET',
        status: healthResult.ok ? 'available' : 'unavailable',
        http_status: healthResult.error?.httpStatus || 200,
        response_sample: healthResult.ok ? healthResult.data : null
      });
    } catch (healthError) {
      report.endpoints.push({
        name: '/health',
        method: 'GET',
        status: 'unavailable',
        note: 'Endpoint opcional'
      });
    }
    
    // Determine final status
    const criticalEndpoints = ['/internal/character/resolve-nic', '/internal/character/check-online', '/internal/alz/settle'];
    const unavailableCritical = report.endpoints.filter(
      e => criticalEndpoints.includes(e.name) && e.status !== 'available'
    );
    
    if (unavailableCritical.length > 0) {
      report.overall_status = 'degraded';
      report.missing_endpoints = unavailableCritical.map(e => e.name);
    }
    
    console.log(`[bridgeDiagnostics:${correlationId}] COMPLETE status=${report.overall_status}`);
    
    return Response.json({
      ok: true,
      data: report
    }, { status: 200 });
    
  } catch (error) {
    console.error(`[bridgeDiagnostics:${correlationId}] CRITICAL_ERROR: ${error.message}`);
    
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao executar diagnóstico',
        detail: error.message
      }
    }, { status: 500 });
  }
});