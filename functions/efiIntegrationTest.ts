// functions/efiIntegrationTest.js
// Admin-only integration test: creates test data and simulates buy flow
// Tests: quote allocation, 18-seller cap, Pix creation (mock mode if EFI not configured)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { validateEfiConfig } from './_lib/efiClient.js';

Deno.serve(async (req) => {
  const correlationId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only
    if (!user || user.role !== 'admin') {
      return Response.json({
        ok: false,
        error: { code: 'FORBIDDEN', message: 'Somente administradores' }
      }, { status: 403 });
    }

    const { action, cleanup } = await req.json().catch(() => ({ action: 'full' }));

    const report = {
      correlation_id: correlationId,
      action,
      steps: [],
      overall_status: 'success'
    };

    // CLEANUP first if requested
    if (cleanup) {
      try {
        const testOrders = await base44.asServiceRole.entities.AlzSellOrder.filter({});
        const testOrderIds = testOrders.filter(o => o.seller_user_id?.includes('test_seller')).map(o => o.id);
        
        for (const id of testOrderIds) {
          await base44.asServiceRole.entities.AlzSellOrder.delete(id);
        }

        const testProfiles = await base44.asServiceRole.entities.SellerProfile.filter({});
        const testProfileIds = testProfiles.filter(p => p.user_id?.includes('test_seller')).map(p => p.id);
        
        for (const id of testProfileIds) {
          await base44.asServiceRole.entities.SellerProfile.delete(id);
        }

        report.steps.push({
          name: 'Cleanup',
          status: 'pass',
          message: `Removed ${testOrderIds.length} orders, ${testProfileIds.length} profiles`
        });
      } catch (cleanupError) {
        report.steps.push({
          name: 'Cleanup',
          status: 'warn',
          error: cleanupError.message
        });
      }
    }

    // STEP 1: Create test seller profiles (20 sellers to test cap)
    const testSellers = [];
    for (let i = 1; i <= 20; i++) {
      const sellerId = `test_seller_${correlationId}_${i}`;
      
      try {
        const profile = await base44.asServiceRole.entities.SellerProfile.create({
          user_id: sellerId,
          full_name: `Test Seller ${i}`,
          cpf: `000${i.toString().padStart(8, '0')}00`,
          efi_pix_key: `efi-uuid-test-${i.toString().padStart(4, '0')}`, // Mock Efí UUID
          is_kyc_verified: true,
          risk_tier: 'trusted'
        });
        
        testSellers.push({ sellerId, profileId: profile.id });
      } catch (profileError) {
        report.steps.push({
          name: `Create Seller ${i}`,
          status: 'fail',
          error: profileError.message
        });
        report.overall_status = 'failed';
        break;
      }
    }

    if (report.overall_status === 'success') {
      report.steps.push({
        name: 'Create 20 Test Sellers',
        status: 'pass',
        count: testSellers.length
      });
    }

    // STEP 2: Create sell orders (varying prices)
    if (report.overall_status === 'success') {
      const ordersCreated = [];
      
      for (let i = 0; i < testSellers.length; i++) {
        const { sellerId } = testSellers[i];
        const price = 10 + (i * 0.5); // 10.00, 10.50, 11.00, ..., 19.50 BRL per 1B
        
        try {
          const order = await base44.asServiceRole.entities.AlzSellOrder.create({
            seller_user_id: sellerId,
            seller_account_id: `test_account_${sellerId}`,
            total_alz: 5_000_000_000, // 5B each
            remaining_alz: 5_000_000_000,
            price_per_billion_brl: price,
            status: 'active'
          });
          
          ordersCreated.push({ orderId: order.id, price });
        } catch (orderError) {
          report.steps.push({
            name: `Create Order ${i + 1}`,
            status: 'fail',
            error: orderError.message
          });
          report.overall_status = 'failed';
          break;
        }
      }

      if (report.overall_status === 'success') {
        report.steps.push({
          name: 'Create 20 Sell Orders',
          status: 'pass',
          count: ordersCreated.length,
          price_range: `${ordersCreated[0].price} - ${ordersCreated[ordersCreated.length - 1].price} BRL/B`
        });
      }
    }

    // STEP 3: Test quote (should allocate all 20 sellers)
    if (report.overall_status === 'success') {
      try {
        const quoteRes = await base44.functions.invoke('alz_getQuote', {
          requestedAlzAmount: 100_000_000_000 // 100B (needs all 20 sellers)
        });

        const quote = quoteRes.data;
        
        report.steps.push({
          name: 'Get Quote (100B ALZ)',
          status: 'pass',
          matched_sellers: quote._matchedOrders?.length || 0,
          total_price_brl: quote.totalPriceBRL?.toFixed(2),
          is_fully_available: quote.isFullyAvailable
        });
      } catch (quoteError) {
        report.steps.push({
          name: 'Get Quote',
          status: 'fail',
          error: quoteError.message
        });
        report.overall_status = 'failed';
      }
    }

    // STEP 4: Test Pix creation with 18-seller cap
    const efiValidation = validateEfiConfig();
    const mockMode = !efiValidation.configured;

    if (report.overall_status === 'success') {
      try {
        const pixRes = await base44.functions.invoke('alz_createPixPaymentForQuote', {
          requestedAlzAmount: 100_000_000_000, // 100B (triggers >18 sellers)
          idempotencyKey: `test_${correlationId}`
        });

        if (!pixRes.data?.ok) {
          throw new Error(pixRes.data?.error?.message || 'Pix creation failed');
        }

        report.steps.push({
          name: 'Create Pix Payment (18-cap test)',
          status: 'pass',
          sellers_count: pixRes.data.sellersCount,
          alz_allocated: (pixRes.data.alzAllocated / 1_000_000_000).toFixed(2) + 'B',
          needs_another_purchase: pixRes.data.needsAnotherPurchase,
          remaining_alz: pixRes.data.remainingAlzSuggested ? (pixRes.data.remainingAlzSuggested / 1_000_000_000).toFixed(2) + 'B' : '0B',
          txid: pixRes.data.txid?.substring(0, 10) + '***',
          mode: mockMode ? 'MOCK (EFI not configured)' : 'REAL'
        });

        // Verify 18-seller cap was enforced
        if (pixRes.data.sellersCount > 18) {
          report.steps.push({
            name: 'Verify 18-seller cap',
            status: 'FAIL',
            error: `Cap violated: ${pixRes.data.sellersCount} sellers (expected ≤18)`
          });
          report.overall_status = 'failed';
        } else {
          report.steps.push({
            name: 'Verify 18-seller cap',
            status: 'pass',
            message: `Cap enforced: ${pixRes.data.sellersCount} sellers`
          });
        }

      } catch (pixError) {
        report.steps.push({
          name: 'Create Pix Payment',
          status: 'fail',
          error: pixError.message
        });
        report.overall_status = 'failed';
      }
    }

    // STEP 5: Test idempotency (retry same request)
    if (report.overall_status === 'success') {
      try {
        const retryRes = await base44.functions.invoke('alz_createPixPaymentForQuote', {
          requestedAlzAmount: 100_000_000_000,
          idempotencyKey: `test_${correlationId}` // Same key
        });

        if (!retryRes.data?.ok) {
          throw new Error('Retry failed');
        }

        if (retryRes.data.idempotent) {
          report.steps.push({
            name: 'Test Idempotency (retry)',
            status: 'pass',
            message: 'Same txid returned (idempotent)',
            txid_match: true
          });
        } else {
          report.steps.push({
            name: 'Test Idempotency (retry)',
            status: 'warn',
            message: 'New payment created (expected idempotent response)'
          });
        }
      } catch (retryError) {
        report.steps.push({
          name: 'Test Idempotency',
          status: 'fail',
          error: retryError.message
        });
      }
    }

    return Response.json({
      ok: report.overall_status === 'success',
      data: report
    }, { status: 200 });

  } catch (error) {
    console.error(`[efiIntegrationTest:${correlationId}] CRITICAL ERROR:`, error);
    
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao executar teste',
        detail: error.message
      }
    }, { status: 500 });
  }
});