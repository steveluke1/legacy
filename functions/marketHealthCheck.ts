// functions/marketHealthCheck.js
// Health check for marketplace functions (no secrets exposed)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_SIGNATURE = 'market-health-v1-20260107';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Optional auth check (works with or without auth)
    let userRole = 'anonymous';
    try {
      const user = await base44.auth.me();
      if (user) {
        userRole = user.role || 'user';
      }
    } catch {
      // Ignore auth errors for health check
    }

    const report = {
      build_signature: BUILD_SIGNATURE,
      timestamp: new Date().toISOString(),
      status: 'healthy',
      viewer_role: userRole,
      
      // Core marketplace functions
      functions: {
        buyer: [
          'marketResolveBuyerNic',
          'alz_createPixPaymentForQuote',
          'alz_getQuote',
          'alz_getMarketSummary',
          'marketGetPixPaymentStatus'
        ],
        seller: [
          'seller_getMyProfile',
          'seller_updateSplitProfile',
          'alz_createSellOrder'
        ],
        admin: [
          'marketListFailedPayments',
          'marketRetrySettlement',
          'marketReconcilePayments',
          'marketNicAndSettlementSelfTest',
          'marketSplitValidationSelfTest'
        ],
        system: [
          'efiMarketWebhook',
          'marketSettlePayment'
        ]
      },
      
      // UI pages
      pages: {
        buyer: 'MercadoAlzComprar',
        seller: 'MercadoAlzVender',
        admin_reconcile: 'AdminMarketReconcile'
      },
      
      // Entities
      entities: [
        'MarketPixPayment',
        'SellerProfile',
        'EfiWebhookEvent',
        'GameAccount'
      ],
      
      // Bridge endpoints (required)
      bridge_endpoints_required: [
        '/internal/character/resolve-nic',
        '/internal/character/check-online',
        '/internal/alz/settle'
      ],
      
      // Secrets required (names only)
      secrets_required: [
        'MARKET_SYSTEM_TOKEN',
        'BRIDGE_API_KEY',
        'BRIDGE_BASE_URL',
        'EFI_CLIENT_ID',
        'EFI_CLIENT_SECRET',
        'EFI_PIX_KEY',
        'EFI_CERT_PEM_B64',
        'EFI_KEY_PEM_B64',
        'EFI_WEBHOOK_SECRET',
        'EFI_ENV'
      ],
      
      // Flow summary
      flows: {
        buyer_flow: [
          '1. User enters NIC → marketResolveBuyerNic',
          '2. User selects ALZ amount → alz_getQuote',
          '3. User clicks "Gerar PIX" → alz_createPixPaymentForQuote',
          '4. Efí sends webhook → efiMarketWebhook',
          '5. System settles → marketSettlePayment',
          '6. Bridge delivers ALZ via mail'
        ],
        seller_flow: [
          '1. Seller configures Split → seller_updateSplitProfile',
          '2. Seller creates offer → alz_createSellOrder',
          '3. Offer enters order book',
          '4. On match, seller receives via Efí Split'
        ],
        admin_flow: [
          '1. List failed payments → marketListFailedPayments',
          '2. Retry failed settlement → marketRetrySettlement',
          '3. Reconcile stuck payments → marketReconcilePayments'
        ]
      }
    };

    return Response.json({
      ok: true,
      data: report
    }, { status: 200 });

  } catch (error) {
    return Response.json({
      ok: false,
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: error.message
      },
      build_signature: BUILD_SIGNATURE,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});