// functions/marketSplitE2eTest.js
// End-to-end self-test: Create Pix charge + split config + link

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import {
  validateEfiConfig,
  efiCreatePixCharge,
  efiUpsertSplitConfig,
  efiLinkSplitToCharge
} from './_lib/efiClient.js';

const BUILD_SIGNATURE = 'split-e2e-v1-20260107';

Deno.serve(async (req) => {
  const correlationId = `split-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // ADMIN-ONLY
    if (!user || user.role !== 'admin') {
      return Response.json({
        ok: false,
        error: { code: 'FORBIDDEN', message: 'Somente administradores' }
      }, { status: 403 });
    }

    const { cleanupFirst = false } = await req.json().catch(() => ({}));

    const report = {
      correlation_id: correlationId,
      build_signature: BUILD_SIGNATURE,
      timestamp: new Date().toISOString(),
      environment: Deno.env.get('EFI_ENV') || 'homologacao',
      steps: [],
      overall_status: 'success'
    };

    // STEP 0: Validate EFI config
    const efiValidation = validateEfiConfig();
    
    if (!efiValidation.configured) {
      report.steps.push({
        name: 'Validate EFI Config',
        status: 'fail',
        error: 'EFI not configured',
        missing: efiValidation.missing
      });
      report.overall_status = 'failed';
      
      return Response.json({
        ok: false,
        data: report
      }, { status: 503 });
    }

    report.steps.push({
      name: 'Validate EFI Config',
      status: 'pass',
      env: efiValidation.env
    });

    // SAFETY: Block in production unless explicit override
    if (efiValidation.env === 'producao' && !req.headers.get('x-force-production-test')) {
      report.steps.push({
        name: 'Production Safety Check',
        status: 'blocked',
        reason: 'Test blocked in production (requires x-force-production-test header)'
      });
      report.overall_status = 'blocked';
      
      return Response.json({
        ok: false,
        data: report
      }, { status: 403 });
    }

    // STEP 1: Cleanup old test data (optional)
    if (cleanupFirst) {
      try {
        // Find test sellers (created in previous tests)
        const testProfiles = await base44.asServiceRole.entities.SellerProfile.filter({
          full_name: { $regex: 'TEST_SELLER_SPLIT_E2E' }
        });

        if (testProfiles.length > 0) {
          for (const profile of testProfiles) {
            await base44.asServiceRole.entities.SellerProfile.delete(profile.id);
          }
          
          report.steps.push({
            name: 'Cleanup Test Data',
            status: 'pass',
            deleted: testProfiles.length
          });
        }
      } catch (cleanupError) {
        report.steps.push({
          name: 'Cleanup Test Data',
          status: 'warn',
          error: cleanupError.message
        });
      }
    }

    // STEP 2: Create 2 test seller profiles with valid Split data
    const testSellers = [];
    
    for (let i = 1; i <= 2; i++) {
      try {
        const testProfile = await base44.asServiceRole.entities.SellerProfile.create({
          user_id: `test_seller_split_e2e_${correlationId}_${i}`,
          full_name: `TEST_SELLER_SPLIT_E2E_${i}`,
          efi_split_account: `${1234567 + i}`, // Fake account number
          efi_split_document: i === 1 ? '12345678901' : '12345678000190', // CPF or CNPJ
          efi_split_status: 'verified',
          efi_split_updated_at: new Date().toISOString(),
          is_kyc_verified: true,
          risk_tier: 'trusted'
        });
        
        testSellers.push(testProfile);
      } catch (createError) {
        report.steps.push({
          name: `Create Test Seller ${i}`,
          status: 'fail',
          error: createError.message
        });
        report.overall_status = 'failed';
        
        return Response.json({
          ok: false,
          data: report
        }, { status: 500 });
      }
    }

    report.steps.push({
      name: 'Create Test Sellers',
      status: 'pass',
      count: testSellers.length,
      documents: testSellers.map(s => s.efi_split_document)
    });

    // STEP 3: Build split payload (CORRECT Efí format)
    const totalAmountCents = 1000; // R$ 10.00
    const platformSharePercent = '10.00'; // 10%
    
    const repasses = testSellers.map((seller, idx) => {
      const sharePercent = idx === 0 ? '50.00' : '40.00'; // 50% + 40% = 90% (platform gets 10%)
      
      return {
        tipo: 'porcentagem',
        valor: sharePercent,
        favorecido: {
          cpf: seller.efi_split_document,
          conta: seller.efi_split_account
        }
      };
    });

    report.steps.push({
      name: 'Build Split Payload',
      status: 'pass',
      repasses_count: repasses.length,
      total_amount_cents: totalAmountCents,
      payload_structure: {
        platform_share: platformSharePercent,
        seller_shares: repasses.map(r => r.valor)
      }
    });

    // STEP 4: Create Split Config via Efí API
    let splitConfigId;
    
    try {
      const splitResult = await efiUpsertSplitConfig({
        descricao: `E2E Test Split - ${correlationId}`,
        lancamento: {
          imediato: true
        },
        split: {
          divisaoTarifa: 'assumir_total',
          minhaParte: {
            tipo: 'porcentagem',
            valor: platformSharePercent
          },
          repasses
        }
      });
      
      splitConfigId = splitResult.splitConfigId;
      
      report.steps.push({
        name: 'Create Split Config (Efí API)',
        status: 'pass',
        split_config_id: splitConfigId,
        efi_status: splitResult.status
      });
    } catch (splitError) {
      report.steps.push({
        name: 'Create Split Config (Efí API)',
        status: 'fail',
        error: splitError.message
      });
      report.overall_status = 'failed';
      
      // Cleanup test sellers
      for (const seller of testSellers) {
        await base44.asServiceRole.entities.SellerProfile.delete(seller.id);
      }
      
      return Response.json({
        ok: false,
        data: report
      }, { status: 500 });
    }

    // STEP 5: Create Pix Charge via Efí API
    const txid = `LONSPLITTEST${Date.now()}${Math.random().toString(36).substr(2, 9)}`.substr(0, 35).toUpperCase();
    let chargeResult;
    
    try {
      chargeResult = await efiCreatePixCharge({
        txid,
        amountCents: totalAmountCents,
        expiration: 600, // 10 min
        infoAdicionais: [
          { nome: 'Test', valor: 'E2E Split Test' }
        ]
      });
      
      report.steps.push({
        name: 'Create Pix Charge (Efí API)',
        status: 'pass',
        txid: chargeResult.txid,
        amount_cents: totalAmountCents,
        has_qrcode: !!chargeResult.qrcode,
        has_copia_cola: !!chargeResult.pixCopiaECola
      });
    } catch (chargeError) {
      report.steps.push({
        name: 'Create Pix Charge (Efí API)',
        status: 'fail',
        error: chargeError.message
      });
      report.overall_status = 'failed';
      
      // Cleanup
      for (const seller of testSellers) {
        await base44.asServiceRole.entities.SellerProfile.delete(seller.id);
      }
      
      return Response.json({
        ok: false,
        data: report
      }, { status: 500 });
    }

    // STEP 6: Link Split to Charge (VINCULO endpoint)
    try {
      const linkResult = await efiLinkSplitToCharge({
        txid: chargeResult.txid,
        splitConfigId
      });
      
      report.steps.push({
        name: 'Link Split to Charge (Efí vinculo)',
        status: 'pass',
        txid: linkResult.txid,
        split_config_id: linkResult.splitConfigId,
        split_linked: linkResult.splitLinked
      });
    } catch (linkError) {
      report.steps.push({
        name: 'Link Split to Charge (Efí vinculo)',
        status: 'fail',
        error: linkError.message
      });
      report.overall_status = 'failed';
    }

    // STEP 7: Cleanup test sellers
    for (const seller of testSellers) {
      await base44.asServiceRole.entities.SellerProfile.delete(seller.id);
    }

    report.steps.push({
      name: 'Cleanup Test Sellers',
      status: 'pass',
      deleted: testSellers.length
    });

    // Final report
    console.log(`[marketSplitE2eTest:${correlationId}] Complete: ${report.overall_status}`);

    return Response.json({
      ok: report.overall_status === 'success',
      data: report
    });

  } catch (error) {
    console.error(`[marketSplitE2eTest:${correlationId}] CRITICAL_ERROR: ${error.message}`);
    
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