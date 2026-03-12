// functions/efiWebhookBridgeContract.js
// Admin-only helper: Returns the webhook contract that Bridge must follow
// Does NOT expose secrets

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_SIGNATURE = 'efi-webhook-contract-v1-20260107';

Deno.serve(async (req) => {
  const correlationId = `contract-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
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
    
    // Return contract (no secrets)
    const contract = {
      build_signature: BUILD_SIGNATURE,
      endpoint: {
        name: 'efiMarketWebhookIngest',
        method: 'POST',
        url: '/api/efiMarketWebhookIngest',
        description: 'Bridge-forwarded webhook ingestion endpoint'
      },
      authentication: {
        type: 'Bearer Token',
        header: 'Authorization: Bearer <MARKET_SYSTEM_TOKEN>',
        note: 'Use secret MARKET_SYSTEM_TOKEN configured in Base44 app'
      },
      request_schema: {
        txid: {
          type: 'string',
          required: true,
          description: 'Transaction ID from Efí (26-35 chars)',
          example: 'LON1735257600ABC123XYZ'
        },
        endToEndId: {
          type: 'string',
          required: false,
          description: 'End-to-end ID (optional)',
          example: 'E1234567820241231123456789012345'
        },
        raw: {
          type: 'object',
          required: false,
          description: 'Raw Efí payload (optional, for debugging)',
          example: { pix: [{ txid: '...', horario: '...', valor: '...' }] }
        }
      },
      response_schema: {
        success: {
          ok: true,
          data: {
            processed: 'boolean',
            payment_id: 'string (if processed)',
            settled: 'boolean (if processed)',
            idempotent: 'boolean (if duplicate)',
            reason: 'string (if not processed)',
            build_signature: 'string',
            correlation_id: 'string'
          }
        },
        error: {
          ok: false,
          error: {
            code: 'string',
            message: 'string',
            detail: 'string (optional)'
          }
        }
      },
      error_codes: [
        { code: 'FORBIDDEN', description: 'Token ausente ou inválido' },
        { code: 'MISSING_TXID', description: 'txid é obrigatório' },
        { code: 'INTERNAL_ERROR', description: 'Erro interno do servidor' }
      ],
      idempotency: {
        guarantee: 'exactly-once',
        mechanism: 'SHA-256 hash of {txid, endToEndId, raw}',
        behavior: 'Duplicate payloads return ok:true with idempotent:true'
      },
      settlement_flow: [
        '1. Validate Bearer token (MARKET_SYSTEM_TOKEN)',
        '2. Hash payload and check EfiWebhookEvent for duplicates',
        '3. Record EfiWebhookEvent (replay protection)',
        '4. Find MarketPixPayment by efi_txid',
        '5. If already paid/settled, return idempotent:true',
        '6. Mark payment as paid',
        '7. Invoke marketSettlePayment internally',
        '8. Update EfiWebhookEvent with processing_result'
      ],
      bridge_responsibilities: [
        'Receive webhook from Efí (mTLS/direct)',
        'Validate Efí signature (HMAC-SHA256)',
        'Extract txid and endToEndId',
        'Forward to Base44 efiMarketWebhookIngest with Bearer token',
        'Handle retries (Base44 returns 200 for idempotent requests)'
      ],
      efi_dashboard_config: {
        webhook_url: 'https://<bridge-domain>/efi/webhook',
        note: 'Configure this URL in Efí dashboard. Bridge will forward to Base44.'
      },
      security_notes: [
        'NEVER expose MARKET_SYSTEM_TOKEN in logs or responses',
        'Bridge MUST validate Efí HMAC signature before forwarding',
        'Base44 trusts Bridge authentication (Bearer token)',
        'EfiWebhookEvent records provide full audit trail'
      ]
    };
    
    return Response.json({
      ok: true,
      data: contract
    }, { status: 200 });
    
  } catch (error) {
    console.error(`[efiWebhookBridgeContract:${correlationId}] ERROR: ${error.message}`);
    
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao gerar contrato',
        detail: error.message
      }
    }, { status: 500 });
  }
});