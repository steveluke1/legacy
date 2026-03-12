// functions/marketSplitValidationSelfTest.js
// Admin-only self-test for Efí Split integration validation
// Creates controlled test data, validates split payload, and optionally tests Efí API

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { 
  validateEfiConfig, 
  efiUpsertSplitConfig,
  efiLinkSplitToCharge,
  efiCreatePixCharge
} from './_lib/efiClient.js';

const BUILD_SIGNATURE = 'market-split-test-v1-20260106';

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

    const { cleanup, testEfiApi } = await req.json().catch(() => ({ cleanup: false, testEfiApi: false }));

    const report = {
      correlation_id: correlationId,
      build_signature: BUILD_SIGNATURE,
      timestamp: new Date().toISOString(),
      steps: [],
      overall_status: 'success'
    };

    // STEP 1: Cleanup previous test data
    if (cleanup) {
      try {
        const testProfiles = await base44.asServiceRole.entities.SellerProfile.filter({});
        const testProfileIds = testProfiles
          .filter(p => p.user_id?.startsWith('test_split_seller_'))
          .map(p => p.id);
        
        for (const id of testProfileIds) {
          await base44.asServiceRole.entities.SellerProfile.delete(id);
        }

        report.steps.push({
          name: 'Cleanup Test Data',
          status: 'pass',
          profiles_deleted: testProfileIds.length
        });
      } catch (cleanupError) {
        report.steps.push({
          name: 'Cleanup Test Data',
          status: 'warn',
          error: cleanupError.message
        });
      }
    }

    // STEP 2: Create 18 test seller profiles (with valid Split data)
    const testSellers = [];
    
    for (let i = 1; i <= 18; i++) {
      const sellerId = `test_split_seller_${correlationId}_${i}`;
      
      // Generate test CPF (11 digits, pattern: 000.000.000-XX where XX = i padded)
      const testCpf = `00000000${i.toString().padStart(3, '0')}`.slice(-11);
      
      try {
        const profile = await base44.asServiceRole.entities.SellerProfile.create({
          user_id: sellerId,
          full_name: `Test Split Seller ${i}`,
          efi_split_account: `efi-account-uuid-test-${i.toString().padStart(4, '0')}`, // Mock UUID
          efi_split_document: testCpf,
          efi_split_status: 'verified',
          efi_split_updated_at: new Date().toISOString(),
          is_kyc_verified: true,
          risk_tier: 'trusted'
        });
        
        testSellers.push({
          sellerId,
          profileId: profile.id,
          account: profile.efi_split_account,
          document: testCpf
        });
      } catch (profileError) {
        report.steps.push({
          name: `Create Test Seller ${i}`,
          status: 'fail',
          error: profileError.message
        });
        report.overall_status = 'failed';
        break;
      }
    }

    if (report.overall_status === 'success') {
      report.steps.push({
        name: 'Create 18 Test Sellers',
        status: 'pass',
        count: testSellers.length
      });
    }

    // STEP 3: Build split payload (validate format)
    if (report.overall_status === 'success') {
      try {
        const totalCents = 100000; // R$ 1000.00
        const platformFeeCents = 2500; // 2.5%
        const sellersTotalCents = totalCents - platformFeeCents;
        
        const favorecidos = testSellers.map((seller, idx) => {
          const sharePercent = ((sellersTotalCents / testSellers.length) / totalCents * 100).toFixed(2);
          
          return {
            cpf: seller.document,
            conta: seller.account,
            tipo: 'porcentagem',
            valor: sharePercent
          };
        });

        const repasses = testSellers.map((seller, idx) => {
          const sharePercent = ((sellersTotalCents / testSellers.length) / totalCents * 100).toFixed(2);
          
          return {
            tipo: 'porcentagem',
            valor: sharePercent,
            favorecido: {
              cpf: seller.document,
              conta: seller.account
            }
          };
        });

        const splitPayload = {
          descricao: 'Test Split - ALZ Marketplace',
          lancamento: {
            imediato: true
          },
          split: {
            divisaoTarifa: 'assumir_total',
            minhaParte: {
              tipo: 'porcentagem',
              valor: (platformFeeCents / totalCents * 100).toFixed(2)
            },
            repasses
          }
        };

        // Validate payload structure
        if (repasses.length !== 18) {
          throw new Error(`Expected 18 repasses, got ${repasses.length}`);
        }
        
        // Validate CPF format in all repasses
        for (const rep of repasses) {
          if (!rep.favorecido || !/^\d{11}$/.test(rep.favorecido.cpf)) {
            throw new Error(`Invalid CPF format: ${rep.favorecido?.cpf} (expected 11 digits)`);
          }
        }

        report.steps.push({
          name: 'Build Split Payload',
          status: 'pass',
          repasses_count: repasses.length,
          platform_share_percent: splitPayload.split.minhaParte.valor,
          divisao_tarifa: splitPayload.split.divisaoTarifa,
          lancamento_imediato: splitPayload.lancamento.imediato
        });

        // STEP 4: Test Efí API (only if testEfiApi=true AND secrets configured)
        if (testEfiApi) {
          const efiValidation = validateEfiConfig();
          
          if (!efiValidation.configured) {
            report.steps.push({
              name: 'Test Efí API',
              status: 'skip',
              reason: 'EFI secrets not configured',
              missing: efiValidation.missing
            });
          } else if (efiValidation.env === 'producao') {
            report.steps.push({
              name: 'Test Efí API',
              status: 'skip',
              reason: 'Cannot test in production environment'
            });
          } else {
            // HOMOLOGAÇÃO: Test split creation
            try {
              const splitConfig = await efiUpsertSplitConfig(splitPayload);
              
              report.steps.push({
                name: 'Test Efí Split Creation (homolog)',
                status: 'pass',
                split_config_id: splitConfig.splitConfigId?.substring(0, 8) + '***',
                efi_status: splitConfig.status
              });

              // Test linking split to a test charge
              const testTxid = `TEST${Date.now()}${Math.random().toString(36).substr(2, 9)}`.substr(0, 35).toUpperCase();
              
              // Create test charge (100 cents = R$ 1.00)
              const testCharge = await efiCreatePixCharge({
                txid: testTxid,
                amountCents: totalCents,
                expiration: 300, // 5 minutes
                infoAdicionais: [
                  { nome: 'Test', valor: 'Split Validation' }
                ]
              });

              report.steps.push({
                name: 'Test Efí Charge Creation (homolog)',
                status: 'pass',
                txid: testCharge.txid?.substring(0, 8) + '***',
                has_qr: !!testCharge.qrcode,
                has_copia_cola: !!testCharge.pixCopiaECola
              });

              // Link split to charge
              const linkResult = await efiLinkSplitToCharge({
                txid: testCharge.txid,
                splitConfigId: splitConfig.splitConfigId
              });

              report.steps.push({
                name: 'Test Efí Link Split to Charge (homolog)',
                status: 'pass',
                txid: linkResult.txid?.substring(0, 8) + '***',
                split_linked: linkResult.splitLinked
              });

            } catch (efiError) {
              report.steps.push({
                name: 'Test Efí API (homolog)',
                status: 'fail',
                error: efiError.message.substring(0, 300)
              });
              report.overall_status = 'failed';
            }
          }
        }

      } catch (payloadError) {
        report.steps.push({
          name: 'Build Split Payload',
          status: 'fail',
          error: payloadError.message
        });
        report.overall_status = 'failed';
      }
    }

    // STEP 5: Validate seller eligibility logic
    if (report.overall_status === 'success') {
      try {
        const eligibilityChecks = [];
        
        for (const seller of testSellers.slice(0, 3)) { // Check first 3
          const profiles = await base44.asServiceRole.entities.SellerProfile.filter({
            user_id: seller.sellerId
          });
          
          const profile = profiles[0];
          
          const checks = {
            seller_id: seller.sellerId,
            has_split_account: !!profile.efi_split_account,
            has_split_document: !!profile.efi_split_document,
            split_status: profile.efi_split_status,
            document_valid: /^\d{11,14}$/.test(profile.efi_split_document || ''),
            eligible: !!(
              profile.efi_split_account && 
              profile.efi_split_document && 
              /^\d{11,14}$/.test(profile.efi_split_document)
            )
          };
          
          eligibilityChecks.push(checks);
        }

        const allEligible = eligibilityChecks.every(c => c.eligible);

        report.steps.push({
          name: 'Validate Seller Eligibility Logic',
          status: allEligible ? 'pass' : 'fail',
          checks_performed: eligibilityChecks.length,
          all_eligible: allEligible,
          sample: eligibilityChecks[0]
        });

        if (!allEligible) {
          report.overall_status = 'failed';
        }

      } catch (eligibilityError) {
        report.steps.push({
          name: 'Validate Seller Eligibility Logic',
          status: 'fail',
          error: eligibilityError.message
        });
        report.overall_status = 'failed';
      }
    }

    return Response.json({
      ok: report.overall_status === 'success',
      data: report
    }, { status: 200 });

  } catch (error) {
    console.error(`[marketSplitValidationSelfTest:${correlationId}] CRITICAL_ERROR: ${error.message}`);
    
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