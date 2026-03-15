// functions/marketManifest.js
// Returns canonical function names and system status

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_SIGNATURE = 'market-manifest-v1-20260107';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    
    // Anyone can access manifest (helps with debugging)
    
    const manifest = {
      build_signature: BUILD_SIGNATURE,
      timestamp: new Date().toISOString(),
      canonical_functions: {
        buyer: [
          'alzGetMarketSummary',
          'alzGetQuote',
          'alzCreatePixPaymentForQuote',
          'alzSimulatePix',
          'marketResolveBuyerNic'
        ],
        seller: [
          'sellerGetMyProfile',
          'sellerUpdateSplitProfile',
          'alzCreateSellOrder'
        ],
        webhook: [
          'efiMarketWebhookIngest',
          'efiMarketWebhookIngestAdminTest',
          'marketSettlePayment'
        ],
        admin: [
          'marketReconcilePayments',
          'marketListFailedPayments',
          'marketRetrySettlement',
          'marketSplitE2eTest',
          'marketDiagnostics',
          'efiWebhookBridgeContract',
          'efiWebhookIngestSelfTest'
        ]
      },
      legacy_wrappers: {
        'alz_getMarketSummary': 'alzGetMarketSummary',
        'alz_getQuote': 'alzGetQuote',
        'alz_createPixPaymentForQuote': 'alzCreatePixPaymentForQuote',
        'alz_simulatePix': 'alzSimulatePix',
        'alz_createSellOrder': 'alzCreateSellOrder',
        'seller_getMyProfile': 'sellerGetMyProfile',
        'seller_updateSplitProfile': 'sellerUpdateSplitProfile'
      },
      system_status: {
        bridge_configured: Deno.env.get('BRIDGE_BASE_URL') && Deno.env.get('BRIDGE_API_KEY') ? true : false,
        efi_configured: Deno.env.get('EFI_CLIENT_ID') && Deno.env.get('EFI_CLIENT_SECRET') ? true : false,
        market_token_configured: Deno.env.get('MARKET_SYSTEM_TOKEN') ? true : false,
        overall_status: 
          (Deno.env.get('BRIDGE_BASE_URL') && Deno.env.get('BRIDGE_API_KEY') && 
           Deno.env.get('EFI_CLIENT_ID') && Deno.env.get('EFI_CLIENT_SECRET') && 
           Deno.env.get('MARKET_SYSTEM_TOKEN')) ? 'ready' : 'degraded'
      },
      notes: {
        pt_br: 'Este endpoint retorna as funções canônicas (camelCase) usadas pela UI. Funções legacy (underscore) funcionam via wrappers.',
        en: 'This endpoint returns canonical (camelCase) functions used by UI. Legacy (underscore) functions work via wrappers.'
      }
    };
    
    return Response.json({
      ok: true,
      data: manifest
    });
    
  } catch (error) {
    console.error('[marketManifest] ERROR:', error);
    
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao gerar manifest',
        detail: error.message
      }
    }, { status: 500 });
  }
});