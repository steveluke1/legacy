// functions/efiMarketWebhookIngestAdminTest.js
// Admin-only test endpoint for webhook ingestion
// Does NOT require Authorization Bearer token (session-based auth only)
// Used by self-tests to prove idempotency without SDK header limitations

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { processEfiIngest } from './_shared/efiIngestProcessor.js';

const BUILD_SIGNATURE = 'efi-market-webhook-ingest-admin-test-v1-20260107';

Deno.serve(async (req) => {
  const correlationId = `ingest-admin-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // ADMIN-ONLY (session-based auth)
    if (!user || user.role !== 'admin') {
      return Response.json({
        ok: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Somente administradores podem usar este endpoint de teste'
        }
      }, { status: 403 });
    }
    
    console.log(`[efiMarketWebhookIngestAdminTest:${correlationId}] ADMIN_AUTH user=${user.id}`);
    
    // Parse test payload
    const { txid, endToEndId, raw } = await req.json();
    
    // Process using shared processor (source=admin_test)
    const result = await processEfiIngest(
      {
        txid,
        endToEndId,
        raw,
        receivedAt: new Date().toISOString(),
        source: 'admin_test'
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
    console.error(`[efiMarketWebhookIngestAdminTest:${correlationId}] CRITICAL_ERROR: ${error.message}`);
    
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao processar teste de webhook',
        detail: error.message
      }
    }, { status: 500 });
  }
});