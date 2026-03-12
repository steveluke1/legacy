// functions/marketSettlementXorGuard.js
// POST-SETTLEMENT WAREHOUSE INTEGRITY VERIFICATION
// Ensures dbo.DoAlzXor invariant is maintained after settle
// BUILD: xor-guard-v1-20260115

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_SIGNATURE = 'market-settlement-xor-guard-v1-20260115';

// INLINE callBridge (for SQL queries via Bridge)
async function callBridge(path, payload, method = 'POST', timeoutMs = 30000) {
  const bridgeBaseUrl = Deno.env.get('BRIDGE_BASE_URL');
  const bridgeApiKey = Deno.env.get('BRIDGE_API_KEY');

  if (!bridgeBaseUrl || !bridgeApiKey) {
    return {
      ok: false,
      error: {
        code: 'BRIDGE_CONFIG_MISSING',
        message: 'Bridge não configurado'
      }
    };
  }

  const cleanBase = bridgeBaseUrl.trim().replace(/\/+$/, '').replace(/\/internal$/, '');
  const url = new URL(path.startsWith('/') ? path : `/${path}`, cleanBase).toString();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const authHeader = bridgeApiKey.startsWith('Bearer ') ? bridgeApiKey : `Bearer ${bridgeApiKey}`;
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: method !== 'GET' ? JSON.stringify(payload) : undefined,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    let text;
    let json;
    try {
      text = await response.text();
      json = text ? JSON.parse(text) : {};
    } catch {
      return {
        ok: false,
        error: {
          code: 'BRIDGE_BAD_RESPONSE',
          message: 'Resposta inválida do Bridge',
          httpStatus: response.status
        }
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: 'BRIDGE_ERROR',
          message: json.message || `Bridge retornou HTTP ${response.status}`,
          httpStatus: response.status
        }
      };
    }

    return {
      ok: true,
      data: json.data || json
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      error: {
        code: error.name === 'AbortError' ? 'BRIDGE_TIMEOUT' : 'BRIDGE_NETWORK_ERROR',
        message: `Erro ao chamar Bridge: ${error.message}`
      }
    };
  }
}

Deno.serve(async (req) => {
  const correlationId = `xor-guard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    const body = await req.json();
    const { settledOrders, escrowUserNum, sellerUserNums, __selfTest, debug } = body;

    // SELF-TEST
    if (__selfTest === true) {
      return Response.json({
        ok: true,
        selfTest: true,
        build_signature: BUILD_SIGNATURE,
        purpose: 'Warehouse XOR integrity validation after settlement',
        correlationId
      }, { status: 200 });
    }

    if (!settledOrders || !Array.isArray(settledOrders) || settledOrders.length === 0) {
      return Response.json({
        ok: false,
        error: {
          code: 'MISSING_SETTLED_ORDERS',
          message: 'settledOrders array é obrigatório'
        }
      }, { status: 400 });
    }

    // Collect all affected user numbers
    const affectedUserNums = new Set();
    
    // Add escrow
    if (escrowUserNum && escrowUserNum > 0) {
      affectedUserNums.add(escrowUserNum);
    }
    
    // Add sellers (if provided)
    if (sellerUserNums && Array.isArray(sellerUserNums)) {
      sellerUserNums.forEach(num => {
        if (num && num > 0) affectedUserNums.add(num);
      });
    }
    
    // Add sellers from settled orders
    if (settledOrders && settledOrders.length > 0) {
      settledOrders.forEach(order => {
        if (order.sellerUserNum && order.sellerUserNum > 0) {
          affectedUserNums.add(order.sellerUserNum);
        }
      });
    }

    const userNumsArray = Array.from(affectedUserNums);

    if (userNumsArray.length === 0) {
      return Response.json({
        ok: false,
        error: {
          code: 'NO_AFFECTED_USERS',
          message: 'Nenhum usuário afetado para validação'
        }
      }, { status: 400 });
    }

    console.log(`[marketSettlementXorGuard:${correlationId}] Verifying XOR for ${userNumsArray.length} accounts`);

    // Call Bridge to validate XOR for all affected accounts
    const validateResult = await callBridge('/internal/warehouse/validate-xor', {
      userNums: userNumsArray,
      correlationId: correlationId,
      debug: debug === true
    }, 'POST', 30000);

    if (!validateResult.ok) {
      console.error(`[marketSettlementXorGuard:${correlationId}] XOR validation failed: ${validateResult.error?.code}`);

      return Response.json({
        ok: false,
        error: {
          code: 'XOR_VALIDATION_FAILED',
          message: 'Falha ao validar integridade XOR do warehouse',
          bridgeError: validateResult.error
        }
      }, { status: 422 });
    }

    const validationData = validateResult.data;

    // Check if all accounts passed XOR validation
    const allValid = validationData.results && 
                     Array.isArray(validationData.results) &&
                     validationData.results.every(r => r.xor_valid === true);

    if (!allValid) {
      console.error(`[marketSettlementXorGuard:${correlationId}] XOR MISMATCH DETECTED`);

      // Log details for admin investigation
      const mismatches = validationData.results?.filter(r => r.xor_valid !== true) || [];

      return Response.json({
        ok: false,
        error: {
          code: 'WAREHOUSE_XOR_MISMATCH',
          message: `Integridade do warehouse comprometida. ${mismatches.length} conta(s) com XOR inválido.`,
          mismatches: mismatches.map(m => ({
            userNum: m.userNum,
            alz: m.alz,
            reserved1: m.reserved1,
            expected_reserved1: m.expected_reserved1,
            mismatch: true
          }))
        },
        debug: debug ? { fullResults: validationData.results } : undefined
      }, { status: 422 });
    }

    console.log(`[marketSettlementXorGuard:${correlationId}] XOR validation PASSED for all ${userNumsArray.length} accounts`);

    return Response.json({
      ok: true,
      data: {
        xor_valid: true,
        validated_accounts: userNumsArray.length,
        results: validationData.results,
        build_signature: BUILD_SIGNATURE,
        correlation_id: correlationId
      }
    }, { status: 200 });

  } catch (error) {
    console.error(`[marketSettlementXorGuard:${correlationId}] ERROR: ${error.message}`);

    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao validar integridade do warehouse',
        detail: error.message
      }
    }, { status: 500 });
  }
});