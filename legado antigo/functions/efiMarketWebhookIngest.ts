// functions/efiMarketWebhookIngest.js
// Bridge-forwarded webhook ingestion (system-only)
// Receives sanitized events from Bridge using MARKET_SYSTEM_TOKEN auth
// Prevents replay, marks payment as paid, triggers settlement

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { processEfiIngest } from './_shared/efiIngestProcessor.js';

const BUILD_SIGNATURE = 'efi-market-webhook-ingest-v2-20260107';

function validateSystemToken(req) {
  const configuredToken = Deno.env.get('MARKET_SYSTEM_TOKEN');
  
  if (!configuredToken || configuredToken.trim() === '') {
    return { valid: false, reason: 'MARKET_SYSTEM_TOKEN não configurado' };
  }
  
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, reason: 'Authorization header ausente ou inválido' };
  }
  
  const providedToken = authHeader.substring(7).trim();
  
  // Constant-time comparison
  if (providedToken !== configuredToken) {
    return { valid: false, reason: 'Token inválido' };
  }
  
  return { valid: true };
}

Deno.serve(async (req) => {
  const correlationId = `ingest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // 1. Validate system token (CRITICAL: only Bridge can call this)
    const tokenValidation = validateSystemToken(req);
    
    if (!tokenValidation.valid) {
      console.error(`[efiMarketWebhookIngest:${correlationId}] UNAUTHORIZED: ${tokenValidation.reason}`);
      
      return Response.json({
        ok: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Somente sistema autorizado pode invocar este endpoint'
        }
      }, { status: 403 });
    }
    
    const base44 = createClientFromRequest(req);
    
    // 2. Parse payload from Bridge
    const { txid, endToEndId, raw } = await req.json();
    
    // 3. Process using shared processor
    const result = await processEfiIngest(
      {
        txid,
        endToEndId,
        raw,
        receivedAt: new Date().toISOString(),
        source: 'bridge'
      },
      {
        base44,
        logger: console,
        correlationId
      }
    );
    
    if (!result.ok) {
      return Response.json(result, { 
        status: result.error?.code === 'MISSING_TXID' ? 400 : 500 
      });
    }
    
    return Response.json(result, { status: 200 });
    
  } catch (error) {
    console.error(`[efiMarketWebhookIngest:${correlationId}] CRITICAL_ERROR: ${error.message}`);
    
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao processar webhook',
        detail: error.message
      }
    }, { status: 500 });
  }
});