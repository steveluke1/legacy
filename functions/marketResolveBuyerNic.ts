// functions/marketResolveBuyerNic.js
// Resolve buyer NIC (character name) to CharacterIdx and verify online status
// VERSION: v9 - NORMALIZED BRIDGE RESPONSE (handles multiple shapes)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_SIGNATURE = 'market-resolve-nic-v9-normalized-20260115';

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE NORMALIZATION (handles multiple Bridge envelope/field variants)
// ═══════════════════════════════════════════════════════════════════════════
function normalizeBridgeCharacterResponse(raw, httpStatus) {
  // Extract data from various envelope shapes
  let dataObj = null;
  
  // Envelope shape 1: { ok: true, data: {...} }
  if (raw?.ok && raw.data) {
    dataObj = raw.data;
  }
  // Envelope shape 2: { success: true, data: {...} }
  else if (raw?.success && raw.data) {
    dataObj = raw.data;
  }
  // Envelope shape 3: { ok: true, result: {...} }
  else if (raw?.ok && raw.result) {
    dataObj = raw.result;
  }
  // Envelope shape 4: { data: {...} } (no ok/success)
  else if (raw?.data && typeof raw.data === 'object') {
    dataObj = raw.data;
  }
  // Envelope shape 5: raw object directly (no envelope)
  else if (raw && typeof raw === 'object' && !raw.ok && !raw.success && !raw.error) {
    dataObj = raw;
  }
  
  // If data is array (SQL recordset), use first element
  if (Array.isArray(dataObj)) {
    dataObj = dataObj.length > 0 ? dataObj[0] : null;
  }
  
  // If still no data object, return semantic not found
  if (!dataObj || typeof dataObj !== 'object') {
    return {
      ok: false,
      semanticError: 'CHARACTER_NOT_FOUND',
      message: 'Personagem não encontrado. Verifique o NIC e tente novamente.',
      meta: {
        upstream_http_status: httpStatus,
        upstream_envelope_keys: raw ? Object.keys(raw) : [],
        upstream_data_type: dataObj === null ? 'null' : Array.isArray(dataObj) ? 'array' : typeof dataObj,
        decision: 'CHARACTER_NOT_FOUND'
      }
    };
  }
  
  // Normalize fields (case-insensitive variants)
  const name = dataObj.name ?? dataObj.Name ?? null;
  const characterIdx = dataObj.characterIdx ?? dataObj.CharacterIdx ?? dataObj.character_idx ?? null;
  const userNum = dataObj.userNum ?? dataObj.UserNum ?? dataObj.user_num ?? null;
  const hasUserNum = dataObj.hasUserNum ?? dataObj.HasUserNum ?? dataObj.has_user_num ?? null;
  const level = dataObj.level ?? dataObj.Level ?? null;
  const classCode = dataObj.class ?? dataObj.Class ?? dataObj.classCode ?? dataObj.ClassCode ?? null;
  const style = dataObj.style ?? dataObj.Style ?? null;
  const isOnline = dataObj.isOnline ?? dataObj.IsOnline ?? dataObj.is_online ?? false;
  
  // Type coercion
  const characterIdxNum = typeof characterIdx === 'number' ? characterIdx : Number(characterIdx);
  let userNumNum = userNum === null || userNum === undefined ? null : Number(userNum);
  
  // Treat userNum === 0 as null (test phase compatibility)
  if (userNumNum === 0) {
    userNumNum = null;
  }
  
  // Infer hasUserNum if missing (safe default)
  let hasUserNumFlag = hasUserNum;
  if (hasUserNumFlag === null || hasUserNumFlag === undefined) {
    hasUserNumFlag = (userNumNum && userNumNum > 0) ? 1 : 0;
  }
  
  // Validate MINIMUM required fields
  const validName = name && typeof name === 'string' && name.trim().length > 0;
  const validCharacterIdx = Number.isFinite(characterIdxNum) && characterIdxNum > 0;
  
  // Build debug metadata (sanitized)
  const meta = {
    upstream_http_status: httpStatus,
    upstream_envelope_keys: Object.keys(raw || {}),
    upstream_data_type: 'object',
    upstream_data_keys: Object.keys(dataObj),
    normalized: {
      name: validName,
      characterIdx: validCharacterIdx,
      userNum: userNumNum === null ? 'null' : typeof userNumNum === 'number' ? 'number' : 'invalid',
      hasUserNum: hasUserNumFlag
    }
  };
  
  // Minimum validation: name + characterIdx must be valid
  if (!validName || !validCharacterIdx) {
    return {
      ok: false,
      semanticError: 'BRIDGE_BAD_SHAPE',
      message: 'Falha ao validar NIC (resposta inesperada do servidor). Tente novamente em instantes.',
      meta: { ...meta, decision: 'BRIDGE_BAD_SHAPE' }
    };
  }
  
  // SUCCESS
  return {
    ok: true,
    data: {
      name: name.trim(),
      characterIdx: characterIdxNum,
      userNum: userNumNum,
      hasUserNum: hasUserNumFlag,
      level: level ? Number(level) : null,
      classCode: classCode || null,
      style: style || null,
      isOnline: !!isOnline
    },
    meta: { ...meta, decision: 'SUCCESS' }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// INLINE BRIDGE CLIENT (safe, self-contained, no imports)
// ═══════════════════════════════════════════════════════════════════════════
async function callBridgeJson(url, payload, headers, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const httpStatus = response.status;
    const contentType = response.headers.get('content-type') || '';
    
    // Read response text first
    const responseText = await response.text();
    
    // Check if content-type is JSON
    if (!contentType.includes('application/json')) {
      const snippet = responseText.substring(0, 200);
      return {
        ok: false,
        error: {
          code: httpStatus === 404 ? 'BRIDGE_ENDPOINT_NOT_FOUND' : 'BRIDGE_BAD_RESPONSE',
          message: httpStatus === 404 
            ? 'Endpoint do Bridge não encontrado (404). Verifique a rota configurada.'
            : 'Resposta inválida do Bridge. Verifique se o endpoint existe e retorna JSON.',
          httpStatus,
          contentType,
          snippet
        }
      };
    }
    
    // Parse JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      const snippet = responseText.substring(0, 200);
      return {
        ok: false,
        error: {
          code: 'BRIDGE_INVALID_JSON',
          message: 'Resposta do Bridge não é JSON válido.',
          httpStatus,
          contentType,
          snippet
        }
      };
    }
    
    // Return parsed data
    return { ok: true, data, httpStatus };
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      return {
        ok: false,
        error: {
          code: 'BRIDGE_TIMEOUT',
          message: 'Tempo esgotado ao chamar o Bridge. Verifique se o Bridge está online.',
          timeoutMs
        }
      };
    }
    
    return {
      ok: false,
      error: {
        code: 'BRIDGE_NETWORK_ERROR',
        message: 'Erro de rede ao chamar o Bridge. Verifique a conectividade.',
        detail: error.message
      }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INLINE AUTH HELPER (no imports, self-contained)
// ═══════════════════════════════════════════════════════════════════════════
async function resolveCallerFromToken(base44, token, correlationId) {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return {
      ok: false,
      status: 401,
      error: {
        code: 'AUTH_TOKEN_MISSING',
        message: 'Sessão expirada. Faça login novamente.'
      }
    };
  }

  let authRes;
  try {
    authRes = await base44.functions.invoke('auth_me', { token });
  } catch (invokeError) {
    console.error(`[resolveCallerFromToken:${correlationId}] auth_me invoke exception: ${invokeError.message}`);
    return {
      ok: false,
      status: 503,
      error: {
        code: 'AUTH_SERVICE_UNAVAILABLE',
        message: 'Serviço de autenticação temporariamente indisponível. Tente novamente.'
      }
    };
  }
  
  if (!authRes.data?.success || !authRes.data?.user) {
    console.warn(`[resolveCallerFromToken:${correlationId}] auth_me failed`);
    return {
      ok: false,
      status: 401,
      error: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'Sessão inválida. Faça login novamente.'
      }
    };
  }
    
    const user = authRes.data.user;
    
    if (!user.game_user_num || typeof user.game_user_num !== 'number') {
      console.warn(`[resolveCallerFromToken:${correlationId}] Missing game_user_num: userId=${user.id}`);
      return {
        ok: false,
        status: 400,
        error: {
          code: 'USER_GAME_USER_NUM_MISSING',
          message: 'Sua conta ainda não está vinculada ao jogo. Entre em contato com o suporte.'
        }
      };
    }
    
    return {
      ok: true,
      userId: user.id,
      gameUserNum: user.game_user_num,
      email: user.email,
      loginId: user.login_id,
      role: user.role || 'user'
    };
}

Deno.serve(async (req) => {
  const correlationId = `resolve-nic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[marketResolveBuyerNic:${correlationId}] START`);
  
  try {
    const body = await req.json();
    const { token, nic, debug } = body;
    const debugMode = debug === true;
    
    const base44 = createClientFromRequest(req);
    
    // STEP 1: Resolve caller identity from token
    const caller = await resolveCallerFromToken(base44, token, correlationId);
    
    if (!caller.ok) {
      console.warn(`[marketResolveBuyerNic:${correlationId}] AUTH_FAILED: ${caller.error.code}`);
      return Response.json({
        ok: false,
        error: caller.error,
        correlation_id: correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: caller.status });
    }
    
    const callerUserId = caller.userId;
    const callerGameUserNum = caller.gameUserNum;

    // STEP 2: Validate NIC input
    if (!nic || typeof nic !== 'string') {
      return Response.json({
        ok: false,
        error: { 
          code: 'INVALID_NIC', 
          message: 'NIC inválido. Verifique e tente novamente.' 
        },
        correlation_id: correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    // Normalize NIC (trim whitespace)
    const normalizedNic = nic.trim();
    
    if (normalizedNic.length === 0 || normalizedNic.length > 50) {
      return Response.json({
        ok: false,
        error: { 
          code: 'INVALID_NIC', 
          message: 'NIC inválido. Verifique e tente novamente.' 
        },
        correlation_id: correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    // STEP 3: Call Bridge to resolve NIC → CharacterIdx (safe, structured errors)
    console.log(`[marketResolveBuyerNic:${correlationId}] CALL_BRIDGE nic=${normalizedNic.substring(0, 3)}***`);
    
    const BRIDGE_BASE_URL = Deno.env.get('BRIDGE_BASE_URL');
    const BRIDGE_API_KEY = Deno.env.get('BRIDGE_API_KEY');
    
    if (!BRIDGE_BASE_URL || !BRIDGE_API_KEY) {
      console.error(`[marketResolveBuyerNic:${correlationId}] BRIDGE_CONFIG_MISSING`);
      return Response.json({
        ok: false,
        error: {
          code: 'BRIDGE_NOT_CONFIGURED',
          message: 'Serviço de validação de personagem indisponível. Contate o suporte.'
        },
        correlation_id: correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 503 });
    }
    
    const bridgeUrl = `${BRIDGE_BASE_URL}/internal/character/resolve-nic`;
    const bridgeResult = await callBridgeJson(
      bridgeUrl,
      { nic: normalizedNic },
      { Authorization: `Bearer ${BRIDGE_API_KEY}` }
    );
    
    if (!bridgeResult.ok) {
      console.error(`[marketResolveBuyerNic:${correlationId}] BRIDGE_TRANSPORT_ERROR: ${JSON.stringify(bridgeResult.error).substring(0, 200)}`);
      return Response.json({
        ok: false,
        error: bridgeResult.error,
        correlation_id: correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 424 });
    }

    // STEP 3a: Extract raw data from Bridge
    const rawData = bridgeResult.data;
    
    // STEP 3b: Check for explicit SEMANTIC errors from Bridge (ok:false in body)
    if (rawData?.ok === false) {
      const semanticError = rawData.error;
      const semanticMessage = rawData.message;
      
      // DB_PERMISSION_DENIED (403) → return 503
      if (bridgeResult.httpStatus === 403 && semanticError === 'DB_PERMISSION_DENIED') {
        console.error(`[marketResolveBuyerNic:${correlationId}] BRIDGE_DB_PERMISSION_DENIED`);
        const response = {
          ok: false,
          error: {
            code: 'DB_PERMISSION_DENIED',
            message: 'Permissão do banco negada para validação do personagem. Contate o suporte.',
            httpStatus: 403
          },
          correlation_id: correlationId,
          build_signature: BUILD_SIGNATURE
        };
        if (debugMode) {
          response.meta = { upstream_http_status: bridgeResult.httpStatus, decision: 'DB_PERMISSION_DENIED' };
        }
        return Response.json(response, { status: 503 });
      }
      
      // CHARACTER_NOT_FOUND → return 404
      if (semanticError === 'CHARACTER_NOT_FOUND' || semanticMessage?.toLowerCase().includes('not found')) {
        console.warn(`[marketResolveBuyerNic:${correlationId}] CHARACTER_NOT_FOUND from Bridge`);
        const response = {
          ok: false,
          error: {
            code: 'CHARACTER_NOT_FOUND',
            message: 'Personagem não encontrado. Verifique o NIC e tente novamente.'
          },
          correlation_id: correlationId,
          build_signature: BUILD_SIGNATURE
        };
        if (debugMode) {
          response.meta = { upstream_http_status: bridgeResult.httpStatus, decision: 'CHARACTER_NOT_FOUND' };
        }
        return Response.json(response, { status: 404 });
      }
      
      // Generic semantic error
      console.error(`[marketResolveBuyerNic:${correlationId}] BRIDGE_SEMANTIC_ERROR: ${semanticError}`);
      const response = {
        ok: false,
        error: {
          code: semanticError || 'BRIDGE_ERROR',
          message: semanticMessage || 'Erro ao validar personagem. Tente novamente.',
          httpStatus: bridgeResult.httpStatus
        },
        correlation_id: correlationId,
        build_signature: BUILD_SIGNATURE
      };
      if (debugMode) {
        response.meta = { upstream_http_status: bridgeResult.httpStatus, decision: 'BRIDGE_OTHER_ERROR' };
      }
      return Response.json(response, { status: 424 });
    }
    
    // STEP 3c: NORMALIZE Bridge response (handles multiple shapes + field variants)
    const normalized = normalizeBridgeCharacterResponse(rawData, bridgeResult.httpStatus);
    
    if (!normalized.ok) {
      console.error(`[marketResolveBuyerNic:${correlationId}] ${normalized.semanticError}: ${normalized.message}`);
      const response = {
        ok: false,
        error: {
          code: normalized.semanticError,
          message: normalized.message
        },
        correlation_id: correlationId,
        build_signature: BUILD_SIGNATURE
      };
      if (debugMode && normalized.meta) {
        response.meta = normalized.meta;
      }
      
      // Map semantic error to HTTP status
      const statusCode = normalized.semanticError === 'CHARACTER_NOT_FOUND' ? 404 : 502;
      return Response.json(response, { status: statusCode });
    }
    
    // Extract normalized character data
    const characterData = normalized.data;
    const { name, characterIdx, userNum, hasUserNum, level, classCode, style, isOnline } = characterData;

    // STEP 4: Ownership verification (ONLY when bridge explicitly provides userNum)
    // If hasUserNum=1 AND userNum is a positive int → enforce ownership check
    // Otherwise, skip ownership check (test phase compatible: userNum may be NULL)
    if (hasUserNum === 1 && userNum && typeof userNum === 'number' && userNum > 0) {
      console.log(`[marketResolveBuyerNic:${correlationId}] Bridge provided userNum=${userNum}, checking ownership`);
      
      if (callerGameUserNum !== userNum) {
        console.warn(`[marketResolveBuyerNic:${correlationId}] OWNERSHIP_MISMATCH: callerUserNum=${callerGameUserNum} bridgeUserNum=${userNum}`);
        const response = {
          ok: false,
          error: {
            code: 'BUYER_MISMATCH_USERNUM',
            message: 'Este personagem não pertence à sua conta. Faça login na conta correta.'
          },
          correlation_id: correlationId,
          build_signature: BUILD_SIGNATURE
        };
        if (debugMode) {
          response.meta = {
            caller_game_user_num: callerGameUserNum,
            bridge_user_num: userNum,
            decision: 'OWNERSHIP_MISMATCH'
          };
        }
        return Response.json(response, { status: 409 });
      }
      
      console.log(`[marketResolveBuyerNic:${correlationId}] Ownership verified: userNum=${userNum}`);
    } else {
      console.log(`[marketResolveBuyerNic:${correlationId}] Skipping ownership check (hasUserNum=${hasUserNum} userNum=${userNum})`);
    }

    // STEP 5: Return success with buyerUserNum from auth_me (NOT bridge)
    console.log(`[marketResolveBuyerNic:${correlationId}] SUCCESS name=${name} idx=${characterIdx} buyerUserNum=${callerGameUserNum}`);
    
    const response = {
      ok: true,
      data: {
        buyerNic: normalizedNic,
        buyerCharacterIdx: characterIdx,
        buyerUserNum: callerGameUserNum,  // ← ALWAYS from auth_me, never from bridge
        buyerUserId: callerUserId,
        characterName: name.trim(),
        isOnline: !!isOnline,
        level: level || null,
        class: classCode || null
      },
      correlation_id: correlationId,
      build_signature: BUILD_SIGNATURE
    };
    
    // Include debug metadata if requested
    if (debugMode && normalized.meta) {
      response.meta = {
        ...normalized.meta,
        caller_game_user_num: callerGameUserNum,
        ownership_checked: hasUserNum === 1 && userNum && userNum > 0,
        skipped_ownership_check: hasUserNum !== 1 || !userNum || userNum <= 0
      };
    }
    
    return Response.json(response, { status: 200 });

  } catch (error) {
    console.error(`[marketResolveBuyerNic:${correlationId}] CRITICAL_ERROR: ${error.message}`);
    
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao resolver NIC',
        detail: error.message
      },
      correlation_id: correlationId,
      build_signature: BUILD_SIGNATURE
    }, { status: 500 });
  }
});