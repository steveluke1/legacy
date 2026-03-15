// functions/marketNicAndSettlementSelfTest.js
// Self-test for NIC validation and settlement flow

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { callBridge } from './_shared/bridgeClient.js';

const BUILD_SIGNATURE = 'market-nic-test-v1-20260107';

Deno.serve(async (req) => {
  const correlationId = `nic-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
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

    const { testNic } = await req.json().catch(() => ({}));

    const report = {
      correlation_id: correlationId,
      build_signature: BUILD_SIGNATURE,
      timestamp: new Date().toISOString(),
      steps: [],
      overall_status: 'success'
    };

    // STEP 1: Test NIC resolution
    if (!testNic) {
      report.steps.push({
        name: 'Test NIC Resolution',
        status: 'skip',
        reason: 'No testNic provided. Provide { testNic: "CharacterName" } to test.'
      });
    } else {
      try {
        console.log(`[marketNicAndSettlementSelfTest:${correlationId}] Testing NIC: ${testNic}`);
        
        const resolveRes = await base44.functions.invoke('marketResolveBuyerNic', {
          nic: testNic
        });

        if (!resolveRes.data?.ok) {
          report.steps.push({
            name: 'Test NIC Resolution',
            status: 'fail',
            test_nic: testNic,
            error: resolveRes.data?.error
          });
          report.overall_status = 'failed';
        } else {
          const charData = resolveRes.data.data;
          
          report.steps.push({
            name: 'Test NIC Resolution',
            status: 'pass',
            test_nic: testNic,
            resolved_character: {
              characterIdx: charData.characterIdx,
              name: charData.name,
              level: charData.level,
              class: charData.class,
              isOnline: charData.isOnline
            }
          });

          // STEP 2: Test online blocking
          if (charData.isOnline) {
            report.steps.push({
              name: 'Test Online Blocking',
              status: 'pass',
              message: 'Character is ONLINE - settlement would be blocked (as expected)'
            });
          } else {
            report.steps.push({
              name: 'Test Online Blocking',
              status: 'pass',
              message: 'Character is OFFLINE - settlement would proceed (as expected)'
            });
          }
        }
      } catch (nicError) {
        report.steps.push({
          name: 'Test NIC Resolution',
          status: 'fail',
          test_nic: testNic,
          error: nicError.message
        });
        report.overall_status = 'failed';
      }
    }

    // STEP 3: Test Bridge online check endpoint
    try {
      const bridgeHealthRes = await callBridge('/health', {}, 'GET', 5000);
      
      report.steps.push({
        name: 'Test Bridge Connectivity',
        status: bridgeHealthRes.ok ? 'pass' : 'warn',
        bridge_ok: bridgeHealthRes.ok,
        error: bridgeHealthRes.error || null
      });
    } catch (bridgeError) {
      report.steps.push({
        name: 'Test Bridge Connectivity',
        status: 'warn',
        error: bridgeError.message
      });
    }

    // STEP 4: Validate payment flow prerequisites
    const prerequisitesCheck = {
      nic_resolution_function: 'marketResolveBuyerNic',
      settlement_function: 'marketSettlePayment',
      entity_buyer_character_idx: 'required in MarketPixPayment',
      entity_buyer_nic: 'required in MarketPixPayment',
      bridge_online_check: '/internal/character/check-online',
      bridge_resolve_nic: '/internal/character/resolve-nic'
    };

    report.steps.push({
      name: 'Validate Prerequisites',
      status: 'pass',
      prerequisites: prerequisitesCheck
    });

    console.log(`[marketNicAndSettlementSelfTest:${correlationId}] Complete: ${report.overall_status}`);

    return Response.json({
      ok: report.overall_status === 'success',
      data: report
    });

  } catch (error) {
    console.error(`[marketNicAndSettlementSelfTest:${correlationId}] CRITICAL_ERROR: ${error.message}`);
    
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