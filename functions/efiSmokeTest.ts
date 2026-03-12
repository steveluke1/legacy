// functions/efiSmokeTest.js
// Admin-only smoke test for Efí Pix integration
// Tests: OAuth, charge creation, split config (homolog only by default)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import {
  getEfiConfig,
  validateEfiConfig,
  getAccessToken,
  efiCreatePixCharge,
  efiCreateSplitConfig,
  efiLinkSplitToCharge,
  redact,
  isEfiConfigured
} from './_lib/efiClient.js';

Deno.serve(async (req) => {
  const correlationId = `smoke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only
    if (!user || user.role !== 'admin') {
      return Response.json({
        ok: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Somente administradores podem executar smoke tests'
        }
      }, { status: 403 });
    }

    const config = getEfiConfig();
    const validation = validateEfiConfig();
    
    if (!validation.configured) {
      return Response.json({
        ok: false,
        error: {
          code: 'EFI_NOT_CONFIGURED',
          message: 'Efí não está completamente configurado',
          missing_secrets: validation.missing
        }
      }, { status: 500 });
    }

    // Safety: only allow in homolog unless override=true
    const { override } = await req.json().catch(() => ({}));
    
    if (config.env !== 'homologacao' && config.env !== 'homolog' && !override) {
      return Response.json({
        ok: false,
        error: {
          code: 'PRODUCTION_SAFETY',
          message: 'Smoke test bloqueado em produção. Use { "override": true } para forçar (USE COM CAUTELA).'
        }
      }, { status: 403 });
    }

    const report = {
      correlation_id: correlationId,
      env: config.env,
      tests: [],
      overall_status: 'success'
    };

    // TEST 1: OAuth Token
    try {
      const token = await getAccessToken();
      report.tests.push({
        name: 'OAuth Token',
        status: 'pass',
        message: 'Token obtido com sucesso',
        token_preview: redact(token)
      });
    } catch (error) {
      report.tests.push({
        name: 'OAuth Token',
        status: 'fail',
        error: error.message
      });
      report.overall_status = 'failed';
    }

    // TEST 2: Create minimal Pix charge
    if (report.overall_status === 'success') {
      try {
        const testTxid = `SMOKETEST${Date.now()}${Math.random().toString(36).substr(2, 9)}`.substr(0, 35);
        
        const charge = await efiCreatePixCharge({
          txid: testTxid,
          amountCents: 100, // R$ 1.00
          expiration: 300 // 5 min
        });

        report.tests.push({
          name: 'Create Pix Charge',
          status: 'pass',
          message: 'Cobrança criada com sucesso',
          txid: redact(charge.txid),
          status_efi: charge.status,
          has_qrcode: !!charge.qrcode,
          has_copia_cola: !!charge.pixCopiaECola
        });
      } catch (error) {
        report.tests.push({
          name: 'Create Pix Charge',
          status: 'fail',
          error: error.message
        });
        report.overall_status = 'failed';
      }
    }

    // TEST 3: Create Split Config (minimal)
    if (report.overall_status === 'success') {
      try {
        // Note: This is a minimal test; real split requires valid Efí internal accounts
        // In production, sellers must have Efí accounts configured
        
        // Skip split test for now if no test accounts available
        report.tests.push({
          name: 'Create Split Config',
          status: 'skip',
          message: 'Split config requer contas Efí reais - teste manual necessário'
        });
      } catch (error) {
        report.tests.push({
          name: 'Create Split Config',
          status: 'warn',
          error: error.message,
          note: 'Esperado - split requer setup adicional'
        });
      }
    }

    // Log audit
    await base44.asServiceRole.entities.MarketplaceAuditLog.create({
      log_id: correlationId,
      action: 'efi_smoke_test',
      severity: report.overall_status === 'success' ? 'info' : 'error',
      message: `Smoke test Efí executado: ${report.overall_status}`,
      data: {
        env: config.env,
        tests_passed: report.tests.filter(t => t.status === 'pass').length,
        tests_failed: report.tests.filter(t => t.status === 'fail').length,
        correlation_id: correlationId
      },
      correlation_id: correlationId
    }).catch(e => console.error('Audit log error:', e.message));

    return Response.json({
      ok: report.overall_status === 'success',
      data: report
    }, { status: 200 });

  } catch (error) {
    console.error(`[efiSmokeTest:${correlationId}] CRITICAL ERROR:`, error);
    
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao executar smoke test',
        detail: error.message
      }
    }, { status: 500 });
  }
});