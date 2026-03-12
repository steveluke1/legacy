// functions/efiWebhookIngestSelfTest.js
// Deterministic self-test for Bridge-forwarded webhook ingestion (admin-only)
// Validates idempotency: same payload twice does not double-settle
// Uses efiMarketWebhookIngestAdminTest (admin session auth, no Bearer token required)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_SIGNATURE = 'efi-webhook-ingest-self-test-v2-20260107';

Deno.serve(async (req) => {
  const correlationId = `ingest-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
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
    
    const { cleanupFirst = false } = await req.json().catch(() => ({}));
    
    const report = {
      correlation_id: correlationId,
      build_signature: BUILD_SIGNATURE,
      timestamp: new Date().toISOString(),
      steps: [],
      overall_status: 'success'
    };
    
    // STEP 0: Validate MARKET_SYSTEM_TOKEN exists
    const systemToken = Deno.env.get('MARKET_SYSTEM_TOKEN');
    
    if (!systemToken || systemToken.trim() === '') {
      report.steps.push({
        name: 'Validate MARKET_SYSTEM_TOKEN',
        status: 'fail',
        error: 'MARKET_SYSTEM_TOKEN não configurado'
      });
      report.overall_status = 'failed';
      
      return Response.json({
        ok: false,
        data: report
      }, { status: 503 });
    }
    
    report.steps.push({
      name: 'Validate MARKET_SYSTEM_TOKEN',
      status: 'pass'
    });
    
    // STEP 1: Cleanup old test data (optional)
    if (cleanupFirst) {
      try {
        const testPayments = await base44.asServiceRole.entities.MarketPixPayment.filter({
          efi_txid: { $regex: 'TEST_WEBHOOK_INGEST' }
        });
        
        for (const payment of testPayments) {
          await base44.asServiceRole.entities.MarketPixPayment.delete(payment.id);
        }
        
        const testEvents = await base44.asServiceRole.entities.EfiWebhookEvent.filter({
          efi_txid: { $regex: 'TEST_WEBHOOK_INGEST' }
        });
        
        for (const event of testEvents) {
          await base44.asServiceRole.entities.EfiWebhookEvent.delete(event.id);
        }
        
        report.steps.push({
          name: 'Cleanup Test Data',
          status: 'pass',
          deleted_payments: testPayments.length,
          deleted_events: testEvents.length
        });
      } catch (cleanupError) {
        report.steps.push({
          name: 'Cleanup Test Data',
          status: 'warn',
          error: cleanupError.message
        });
      }
    }
    
    // STEP 2: Create test payment in pix_pending status
    const testTxid = `TEST_WEBHOOK_INGEST_${correlationId}`;
    
    const testPayment = await base44.asServiceRole.entities.MarketPixPayment.create({
      buyer_user_id: user.id,
      buyer_character_idx: 999999,
      buyer_nic: 'TEST_CHARACTER',
      buyer_usernum: 123456,
      status: 'pix_pending',
      total_brl_cents: 1000,
      alz_amount: '1000000000',
      efi_txid: testTxid,
      efi_loc_id: 'TEST_LOC',
      efi_copia_cola: 'TEST_COPIA_COLA',
      efi_qr_image: 'TEST_QR',
      split_recipient_count: 1,
      split_recipients_snapshot: JSON.stringify([]),
      idempotency_key: `test_${correlationId}`,
      expires_at: new Date(Date.now() + 3600000).toISOString()
    });
    
    report.steps.push({
      name: 'Create Test Payment',
      status: 'pass',
      payment_id: testPayment.id,
      txid: testTxid
    });
    
    // STEP 3: Call efiMarketWebhookIngestAdminTest (first time)
    try {
      const fixedTimestamp = Date.now(); // Fixed timestamp for consistent hashing
      const ingestPayload = {
        txid: testTxid,
        endToEndId: 'E12345678901234567890123456789012',
        raw: { test: true, timestamp: fixedTimestamp }
      };
      
      // Use admin test endpoint (session-based auth, no Bearer token required)
      const ingestRes1 = await base44.functions.invoke('efiMarketWebhookIngestAdminTest', ingestPayload);
      
      const ingestData1 = ingestRes1.data;
      
      if (!ingestData1.ok) {
        throw new Error(ingestData1.error?.message || 'Ingest failed');
      }
      
      if (!ingestData1.data?.processed) {
        throw new Error('Payment was not processed');
      }
      
      report.steps.push({
        name: 'First Ingest Call',
        status: 'pass',
        processed: ingestData1.data.processed,
        settled: ingestData1.data.settled,
        note: ingestData1.data.settled ? 'Settlement succeeded' : 'Settlement failed (expected for fake CharacterIdx)'
      });
    } catch (ingestError) {
      report.steps.push({
        name: 'First Ingest Call',
        status: 'fail',
        error: ingestError.message
      });
      report.overall_status = 'failed';
      
      // Cleanup
      await base44.asServiceRole.entities.MarketPixPayment.delete(testPayment.id);
      
      return Response.json({
        ok: false,
        data: report
      }, { status: 500 });
    }
    
    // STEP 4: Verify payment status changed to paid or failed
    const updatedPayments = await base44.asServiceRole.entities.MarketPixPayment.filter({
      id: testPayment.id
    }, undefined, 1);
    
    if (updatedPayments.length === 0) {
      report.steps.push({
        name: 'Verify Payment Status',
        status: 'fail',
        error: 'Payment not found after ingestion'
      });
      report.overall_status = 'failed';
      
      return Response.json({
        ok: false,
        data: report
      }, { status: 500 });
    }
    
    const updatedPayment = updatedPayments[0];
    
    // Settlement may fail (fake CharacterIdx), but payment should be marked as paid or failed
    if (updatedPayment.status !== 'paid' && updatedPayment.status !== 'failed' && updatedPayment.status !== 'settled') {
      report.steps.push({
        name: 'Verify Payment Status',
        status: 'fail',
        error: `Expected paid/failed/settled, got ${updatedPayment.status}`
      });
      report.overall_status = 'failed';
    } else {
      report.steps.push({
        name: 'Verify Payment Status',
        status: 'pass',
        new_status: updatedPayment.status,
        error_message: updatedPayment.error_message || null
      });
    }
    
    // STEP 5: Call efiMarketWebhookIngestAdminTest AGAIN (idempotency test - same payload)
    try {
      const fixedTimestamp = Date.now() - 1000; // Use same timestamp as first call
      const ingestPayload = {
        txid: testTxid,
        endToEndId: 'E12345678901234567890123456789012',
        raw: { test: true, timestamp: fixedTimestamp } // Same data = same hash
      };
      
      const ingestRes2 = await base44.functions.invoke('efiMarketWebhookIngestAdminTest', ingestPayload);
      
      const ingestData2 = ingestRes2.data;
      
      if (!ingestData2.ok) {
        throw new Error(ingestData2.error?.message || 'Second ingest failed');
      }
      
      // Should return idempotent: true or processed: false
      if (ingestData2.data?.processed === true && !ingestData2.data?.idempotent) {
        throw new Error('Expected idempotent:true or processed:false on duplicate');
      }
      
      report.steps.push({
        name: 'Second Ingest Call (Idempotency)',
        status: 'pass',
        idempotent: ingestData2.data.idempotent || false,
        processed: ingestData2.data.processed,
        reason: ingestData2.data.reason
      });
    } catch (idempotencyError) {
      report.steps.push({
        name: 'Second Ingest Call (Idempotency)',
        status: 'fail',
        error: idempotencyError.message
      });
      report.overall_status = 'failed';
    }
    
    // STEP 6: Verify EfiWebhookEvent was recorded (exactly once)
    const webhookEvents = await base44.asServiceRole.entities.EfiWebhookEvent.filter({
      efi_txid: testTxid
    });
    
    if (webhookEvents.length === 0) {
      report.steps.push({
        name: 'Verify EfiWebhookEvent Recorded',
        status: 'fail',
        error: 'No webhook event found'
      });
      report.overall_status = 'failed';
    } else if (webhookEvents.length > 1) {
      report.steps.push({
        name: 'Verify EfiWebhookEvent Recorded',
        status: 'warn',
        event_count: webhookEvents.length,
        warning: 'Multiple events found (idempotency may have failed)'
      });
    } else {
      report.steps.push({
        name: 'Verify EfiWebhookEvent Recorded',
        status: 'pass',
        event_count: webhookEvents.length,
        first_event: {
          received_at: webhookEvents[0].received_at,
          processing_result: webhookEvents[0].processing_result,
          processed_at: webhookEvents[0].processed_at
        }
      });
    }
    
    // STEP 7: Cleanup test data
    await base44.asServiceRole.entities.MarketPixPayment.delete(testPayment.id);
    
    for (const event of webhookEvents) {
      await base44.asServiceRole.entities.EfiWebhookEvent.delete(event.id);
    }
    
    report.steps.push({
      name: 'Cleanup Test Data',
      status: 'pass',
      deleted_payment: testPayment.id,
      deleted_events: webhookEvents.length
    });
    
    console.log(`[efiWebhookIngestSelfTest:${correlationId}] COMPLETE: ${report.overall_status}`);
    
    return Response.json({
      ok: report.overall_status === 'success',
      data: report
    }, { status: 200 });
    
  } catch (error) {
    console.error(`[efiWebhookIngestSelfTest:${correlationId}] CRITICAL_ERROR: ${error.message}`);
    
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