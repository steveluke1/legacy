// functions/efiMarketWebhook.js
// DEPRECATED: Direct Efí webhook ingestion (replaced by efiMarketWebhookIngest)
// Use Bridge-forwarded model: Bridge receives Efí webhook and forwards to efiMarketWebhookIngest
// Reason: Base44 /pix suffix routing unreliable, and webhook should go through Bridge authentication

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_SIGNATURE = 'efi-market-webhook-deprecated-v1-20260107';

Deno.serve(async (req) => {
  const correlationId = `efi-wh-deprecated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.warn(`[efiMarketWebhook:${correlationId}] DEPRECATED endpoint called. Use efiMarketWebhookIngest via Bridge forwarding.`);
  
  try {
    const base44 = createClientFromRequest(req);
    
    // DEPRECATION NOTICE: Return clear error
    return Response.json({
      ok: false,
      error: {
        code: 'DEPRECATED_USE_BRIDGE_FORWARDING',
        message: 'Este endpoint está descontinuado. Configure o webhook da Efí para apontar para o Bridge Node, que encaminhará eventos para efiMarketWebhookIngest.',
        migration_guide: {
          step1: 'Configure webhook Efí para apontar para Bridge Node endpoint',
          step2: 'Bridge valida HMAC-SHA256 da Efí',
          step3: 'Bridge encaminha para /api/efiMarketWebhookIngest com Bearer token',
          step4: 'Base44 processa webhook e aciona settlement',
          contract_endpoint: '/api/efiWebhookBridgeContract (admin-only)'
        }
      },
      build_signature: BUILD_SIGNATURE,
      correlation_id: correlationId
    }, { status: 410 }); // 410 Gone


  } catch (error) {
    console.error(`[efiMarketWebhook:${correlationId}] ERROR: ${error.message}`);
    
    return Response.json({
      ok: false,
      error: {
        code: 'DEPRECATED_USE_BRIDGE_FORWARDING',
        message: 'Este endpoint está descontinuado. Consulte /api/efiWebhookBridgeContract para migração.'
      },
      build_signature: BUILD_SIGNATURE,
      correlation_id: correlationId
    }, { status: 410 });
  }
});