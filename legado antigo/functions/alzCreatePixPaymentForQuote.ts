// functions/alzCreatePixPaymentForQuote.js
// Create PIX payment for ALZ quote with Efí Split (canonical camelCase)
// BUILD: v3-inline-efi-20260115 (self-contained, no _lib imports for deployment stability)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MAX_SPLIT_SELLERS = 18;
const PLATFORM_FEE_BPS = 250; // 2.5%
const BUILD_SIGNATURE = 'alz-create-pix-v3-inline-20260115';

// ═══════════════════════════════════════════════════════════════════════════
// INLINE EFI CLIENT (self-contained, no external imports)
// ═══════════════════════════════════════════════════════════════════════════

let cachedToken = null;
let tokenExpiresAt = 0;

function getEfiConfig() {
  const getEnv = (key, defaultVal = '') => {
    const val = Deno.env.get(key);
    return val ? val.trim() : defaultVal;
  };
  
  return {
    env: getEnv('EFI_ENV', 'homologacao'),
    clientId: getEnv('EFI_CLIENT_ID'),
    clientSecret: getEnv('EFI_CLIENT_SECRET'),
    certPemB64: getEnv('EFI_CERT_PEM_B64'),
    keyPemB64: getEnv('EFI_KEY_PEM_B64'),
    pixKey: getEnv('EFI_PIX_KEY'),
    webhookSecret: getEnv('EFI_WEBHOOK_SECRET'),
    debug: false
  };
}

function validateEfiConfig() {
  const config = getEfiConfig();
  const missing = [];
  
  if (!config.clientId) missing.push('EFI_CLIENT_ID');
  if (!config.clientSecret) missing.push('EFI_CLIENT_SECRET');
  if (!config.certPemB64) missing.push('EFI_CERT_PEM_B64');
  if (!config.keyPemB64) missing.push('EFI_KEY_PEM_B64');
  if (!config.pixKey) missing.push('EFI_PIX_KEY');
  
  return {
    configured: missing.length === 0,
    missing,
    env: config.env
  };
}

function getEfiBaseUrl(env = 'homologacao') {
  if (env === 'producao' || env === 'production' || env === 'prod') {
    return 'https://api.gerencianet.com.br';
  }
  return 'https://api-pix-h.gerencianet.com.br';
}

function createMtlsHttpClient() {
  const config = getEfiConfig();
  
  if (!config.certPemB64 || !config.keyPemB64) {
    throw new Error('Certificados EFI não configurados');
  }

  const certChain = atob(config.certPemB64);
  const privateKey = atob(config.keyPemB64);

  return Deno.createHttpClient({ certChain, privateKey });
}

async function getAccessToken(forceRefresh = false) {
  const now = Date.now();
  const config = getEfiConfig();
  
  if (!forceRefresh && cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }
  
  if (!config.clientId || !config.clientSecret) {
    throw new Error('Credenciais EFI não configuradas');
  }

  const baseUrl = getEfiBaseUrl(config.env);
  const credentials = btoa(`${config.clientId}:${config.clientSecret}`);

  const client = createMtlsHttpClient();
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  const response = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    signal: controller.signal,
    client,
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ grant_type: 'client_credentials' })
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`EFI OAuth error: ${response.status} - ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  
  cachedToken = data.access_token;
  tokenExpiresAt = now + (50 * 60 * 1000);
  
  return cachedToken;
}

async function efiFetch(path, options = {}, retries = 2) {
  const config = getEfiConfig();
  const baseUrl = getEfiBaseUrl(config.env);
  let token = await getAccessToken();
  const client = createMtlsHttpClient();

  const url = `${baseUrl}${path}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      client,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    clearTimeout(timeoutId);

    if (response.status === 401 && retries > 0) {
      token = await getAccessToken(true);
      return efiFetch(path, options, retries - 1);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout na requisição EFI (30s)');
    }
    throw error;
  }
}

async function efiCreatePixCharge({ txid, amountCents, devedor, expiration = 3600, infoAdicionais }) {
  const config = getEfiConfig();
  
  if (!txid || txid.length < 26 || txid.length > 35) {
    throw new Error('txid deve ter entre 26 e 35 caracteres');
  }
  
  if (!amountCents || amountCents <= 0) {
    throw new Error('amountCents deve ser > 0');
  }
  
  if (!config.pixKey) {
    throw new Error('EFI_PIX_KEY não configurado');
  }

  const payload = {
    calendario: { expiracao: expiration },
    valor: { original: (amountCents / 100).toFixed(2) },
    chave: config.pixKey,
    solicitacaoPagador: 'Pagamento Legacy of Nevareth - ALZ Marketplace'
  };
  
  if (devedor) payload.devedor = devedor;
  if (infoAdicionais && Array.isArray(infoAdicionais)) {
    payload.infoAdicionais = infoAdicionais;
  }

  const response = await efiFetch(`/v2/cob/${txid}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`EFI createCharge error: ${response.status} - ${errorText.substring(0, 300)}`);
  }

  const data = await response.json();
  
  // Get QR code
  if (data.loc && data.loc.id) {
    const qrResponse = await efiFetch(`/v2/loc/${data.loc.id}/qrcode`, { method: 'GET' });
    
    if (qrResponse.ok) {
      const qrData = await qrResponse.json();
      data.qrcode = qrData.imagemQrcode;
      data.pixCopiaECola = qrData.qrcode;
    }
  }
  
  return {
    txid: data.txid,
    location: data.location,
    pixCopiaECola: data.pixCopiaECola || null,
    qrcode: data.qrcode || null,
    status: data.status
  };
}

async function efiUpsertSplitConfig({ descricao, lancamento, split }) {
  if (!split || !split.repasses || split.repasses.length === 0) {
    throw new Error('split.repasses é obrigatório');
  }
  
  if (split.repasses.length > 20) {
    throw new Error('Split máximo de 20 repasses');
  }

  // Validate repasses
  for (const repasse of split.repasses) {
    if (!repasse.favorecido) throw new Error('Repasse deve ter favorecido');
    const { cpf, conta } = repasse.favorecido;
    if (!cpf || !/^\d{11,14}$/.test(cpf)) throw new Error(`CPF inválido: ${cpf}`);
    if (!conta) throw new Error('favorecido.conta é obrigatório');
    if (!repasse.tipo || !['porcentagem', 'fixo'].includes(repasse.tipo)) {
      throw new Error(`tipo inválido: ${repasse.tipo}`);
    }
    if (repasse.valor === undefined) throw new Error('repasse.valor é obrigatório');
  }

  const payload = {
    descricao: descricao || 'ALZ Marketplace Split',
    lancamento: lancamento || { imediato: true },
    split
  };

  const response = await efiFetch('/v2/gn/split/config', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`EFI POST splitConfig error: ${response.status} - ${errorText.substring(0, 300)}`);
  }

  const data = await response.json();
  
  return {
    splitConfigId: data.id || data.split_config_id,
    status: data.status
  };
}

async function efiLinkSplitToCharge({ txid, splitConfigId }) {
  if (!txid || !splitConfigId) {
    throw new Error('txid e splitConfigId são obrigatórios');
  }

  const response = await efiFetch(`/v2/gn/split/cob/${txid}/vinculo`, {
    method: 'PUT',
    body: JSON.stringify({ split_config_id: splitConfigId })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`EFI linkSplit error: ${response.status} - ${errorText.substring(0, 300)}`);
  }

  const data = await response.json();
  
  return {
    txid: data.txid || txid,
    splitLinked: true,
    splitConfigId: data.split_config_id || splitConfigId
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK MODE (when EFI_ALLOW_MOCK=1 and EFI not configured)
// ═══════════════════════════════════════════════════════════════════════════
function isMockModeAllowed() {
  const efiEnv = (Deno.env.get('EFI_ENV') || '').trim().toLowerCase();
  const allowMock = Deno.env.get('EFI_ALLOW_MOCK') === '1';
  
  if (efiEnv === 'producao' || efiEnv === 'production' || efiEnv === 'prod') {
    return false;
  }
  
  return allowMock;
}

function generateMockPixCharge(txid, amountCents) {
  const mockPixCode = `00020126580014br.gov.bcb.pix0136${txid}520400005303986540${(amountCents/100).toFixed(2)}5802BR5925LEGACY OF NEVARETH MOCK6009SAO PAULO62070503***6304XXXX`;
  
  // Deterministic mock QR code (base64 1x1 transparent PNG)
  const mockQrBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  return {
    txid,
    location: `pix.example.com/qr/v2/${txid}`,
    pixCopiaECola: mockPixCode,
    qrcode: mockQrBase64,
    status: 'ATIVA'
  };
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
  const correlationId = `pix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const body = await req.json();
    const { token, requestedAlzAmount, idempotencyKey, buyerCharacterIdx, buyerNic, __selfTest } = body;
    
    // SELF-TEST PATH (diagnostic without external dependencies)
    if (__selfTest === true) {
      const allowMock = Deno.env.get('EFI_ALLOW_MOCK') === '1';
      const efiEnv = Deno.env.get('EFI_ENV') || 'homologacao';
      
      let efiConfigured = false;
      try {
        const validation = validateEfiConfig();
        efiConfigured = validation.configured;
      } catch {
        efiConfigured = false;
      }
      
      return Response.json({
        ok: true,
        selfTest: true,
        build_signature: BUILD_SIGNATURE,
        config: {
          efi_configured: efiConfigured,
          efi_env: efiEnv,
          mock_allowed: allowMock,
          will_use_mock: !efiConfigured && allowMock
        },
        correlationId
      }, { status: 200 });
    }

    const base44 = createClientFromRequest(req);
    
    // STEP 1: Resolve caller identity from token
    const caller = await resolveCallerFromToken(base44, token, correlationId);
    
    if (!caller.ok) {
      console.warn(`[alzCreatePixPaymentForQuote:${correlationId}] AUTH_FAILED: ${caller.error.code}`);
      return Response.json({
        ok: false,
        error: caller.error,
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: caller.status });
    }
    
    const buyerUserId = caller.userId;
    const buyerUserNum = caller.gameUserNum;

    // STEP 2: Validate buyer character (must be pre-validated via marketResolveBuyerNic)
    if (!buyerCharacterIdx || !Number.isInteger(buyerCharacterIdx) || buyerCharacterIdx <= 0) {
      return Response.json({
        ok: false,
        error: {
          code: 'BUYER_CHARACTER_REQUIRED',
          message: 'CharacterIdx validado é obrigatório. Valide o NIC antes de gerar PIX.'
        },
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    if (!buyerNic || typeof buyerNic !== 'string' || buyerNic.trim().length === 0) {
      return Response.json({
        ok: false,
        error: {
          code: 'BUYER_NIC_REQUIRED',
          message: 'NIC do personagem é obrigatório'
        },
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    // STEP 3: Check EFI configuration (allow mock if EFI_ALLOW_MOCK=1)
    const allowMock = Deno.env.get('EFI_ALLOW_MOCK') === '1';
    let efiValidation = { configured: false, missing: [], env: 'homologacao' };
    let mockMode = false;
    
    try {
      efiValidation = validateEfiConfig();
      mockMode = !efiValidation.configured && allowMock;
    } catch (configError) {
      // If config validation throws (missing certs), check if mock is allowed
      if (allowMock) {
        console.warn(`[alzCreatePixPaymentForQuote:${correlationId}] EFI config error, using MOCK_MODE: ${configError.message}`);
        mockMode = true;
      } else {
        return Response.json({
          ok: false,
          error: {
            code: 'EFI_CONFIG_ERROR',
            message: 'Erro na configuração Efí. Contate o suporte.',
            detail: configError.message
          },
          correlationId,
          build_signature: BUILD_SIGNATURE
        }, { status: 503 });
      }
    }
    
    if (!efiValidation.configured && !mockMode) {
      return Response.json({
        ok: false,
        error: {
          code: 'EFI_NOT_CONFIGURED',
          message: 'Sistema de pagamento PIX ainda não está configurado. Contate o suporte.',
          missing: efiValidation.missing
        },
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 503 });
    }
    
    if (mockMode) {
      console.warn(`[alzCreatePixPaymentForQuote:${correlationId}] MOCK_MODE enabled (EFI_ALLOW_MOCK=1, EFI not configured)`);
    }

    // STEP 4: Generate idempotency key
    const finalIdempotencyKey = idempotencyKey || `buy_${buyerUserId}_${requestedAlzAmount}_${Math.floor(Date.now() / 60000)}`;

    // STEP 5: Check existing payment (idempotent retry)
    const existingPayments = await base44.asServiceRole.entities.MarketPixPayment.filter({
      idempotency_key: finalIdempotencyKey
    }, undefined, 1);

    if (existingPayments.length > 0) {
      const existing = existingPayments[0];
      
      if (existing.status === 'created' || existing.status === 'pix_pending') {
        return Response.json({
          ok: true,
          paymentId: existing.id,
          txid: existing.efi_txid,
          copiaCola: existing.efi_copia_cola,
          qrImage: existing.efi_qr_image,
          amountBrl: existing.total_brl_cents / 100,
          alzAllocated: parseFloat(existing.alz_amount),
          idempotent: true,
          correlationId,
          build_signature: BUILD_SIGNATURE
        });
      }
    }

    // STEP 6: Get quote
    const quoteRes = await base44.functions.invoke('alzGetQuote', { requestedAlzAmount });
    
    if (!quoteRes || !quoteRes.data) {
      return Response.json({
        ok: false,
        error: { code: 'QUOTE_ERROR', message: 'Erro ao obter cotação do mercado' },
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 500 });
    }
    
    const quote = quoteRes.data;

    if (quote.error) {
      return Response.json({
        ok: false,
        error: { code: 'QUOTE_ERROR', message: quote.error },
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    if (!quote.isFullyAvailable) {
      return Response.json({
        ok: false,
        error: {
          code: 'INSUFFICIENT_LIQUIDITY',
          message: `Não há ALZ suficientes à venda. Disponível: ${(quote.availableAlzAmount / 1_000_000_000).toFixed(2)}B ALZ`,
          availableAlzAmount: quote.availableAlzAmount
        },
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }
    
    if (!quote._matchedOrders || quote._matchedOrders.length === 0) {
      return Response.json({
        ok: false,
        error: { code: 'NO_ORDERS', message: 'Nenhuma ordem disponível no momento' },
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    // STEP 7: Group by seller and apply 18-seller cap
    const sellerAllocations = new Map();
    
    for (const order of quote._matchedOrders) {
      if (!sellerAllocations.has(order.sellerUserId)) {
        sellerAllocations.set(order.sellerUserId, {
          sellerUserId: order.sellerUserId,
          alzAmount: 0,
          priceBRL: 0
        });
      }
      
      const allocation = sellerAllocations.get(order.sellerUserId);
      allocation.alzAmount += order.matchedAlz;
      allocation.priceBRL += order.priceBRL;
    }

    const allSellers = Array.from(sellerAllocations.values());
    
    let needsAnotherPurchase = false;
    let remainingAlzSuggested = 0;
    let finalSellers = allSellers;
    let alzAllocated = requestedAlzAmount;
    let totalPriceBRL = quote.totalPriceBRL;

    if (allSellers.length > MAX_SPLIT_SELLERS) {
      finalSellers = allSellers
        .sort((a, b) => (a.priceBRL / a.alzAmount) - (b.priceBRL / b.alzAmount))
        .slice(0, MAX_SPLIT_SELLERS);
      
      alzAllocated = finalSellers.reduce((sum, s) => sum + s.alzAmount, 0);
      totalPriceBRL = finalSellers.reduce((sum, s) => sum + s.priceBRL, 0);
      remainingAlzSuggested = requestedAlzAmount - alzAllocated;
      needsAnotherPurchase = true;
    }

    // STEP 8: Validate seller Split profiles (only if NOT in mock mode)
    if (!mockMode) {
      const sellerProfiles = await base44.asServiceRole.entities.SellerProfile.filter({
        user_id: { $in: finalSellers.map(s => s.sellerUserId) }
      });

      const profileMap = new Map(sellerProfiles.map(p => [p.user_id, p]));
      const ineligibleSellers = [];
      
      for (const seller of finalSellers) {
        const profile = profileMap.get(seller.sellerUserId);
        
        if (!profile) {
          ineligibleSellers.push({ user_id: seller.sellerUserId, reason: 'profile_not_found' });
          continue;
        }
        
        if (!profile.efi_split_account || !profile.efi_split_document) {
          ineligibleSellers.push({ 
            user_id: seller.sellerUserId, 
            reason: 'missing_split_data',
            status: profile.efi_split_status || 'missing'
          });
          continue;
        }
        
        const doc = profile.efi_split_document.replace(/\D/g, '');
        if (doc.length !== 11 && doc.length !== 14) {
          ineligibleSellers.push({ 
            user_id: seller.sellerUserId, 
            reason: 'invalid_document_format',
            document_length: doc.length
          });
          continue;
        }
        
        if (efiValidation.env === 'producao' && profile.efi_split_status !== 'verified') {
          ineligibleSellers.push({ 
            user_id: seller.sellerUserId, 
            reason: 'not_verified',
            status: profile.efi_split_status
          });
          continue;
        }
      }
      
      if (ineligibleSellers.length > 0) {
        console.error(`[alzCreatePixPaymentForQuote:${correlationId}] INELIGIBLE_SELLERS:`, ineligibleSellers);
        
        return Response.json({
          ok: false,
          error: {
            code: 'SELLER_INELIGIBLE',
            message: `${ineligibleSellers.length} vendedor(es) não possuem dados Efí Split válidos. A compra será processada quando os vendedores completarem o cadastro.`,
            ineligibleCount: ineligibleSellers.length
          },
          correlationId,
          build_signature: BUILD_SIGNATURE
        }, { status: 422 });
      }
    }

    // STEP 9: Create PIX charge (real or mock)
    const totalBrlCents = Math.round(totalPriceBRL * 100);
    const txid = `LON${Date.now()}${Math.random().toString(36).substr(2, 9)}`.substr(0, 35).toUpperCase();
    
    let charge;
    let splitRecipientsSnapshot = [];
    
    if (mockMode) {
      // MOCK MODE: Generate deterministic mock PIX
      charge = generateMockPixCharge(txid, totalBrlCents);
      
      // Mock split recipients (no real data needed)
      splitRecipientsSnapshot = finalSellers.map((seller, idx) => {
        const sellerShareCents = Math.round((seller.priceBRL / totalPriceBRL) * totalBrlCents * 0.975); // 2.5% platform fee
        return {
          account: `MOCK_ACCOUNT_${idx}`,
          document_masked: '***0000',
          alz_amount: seller.alzAmount,
          share_cents: sellerShareCents,
          share_percent: (sellerShareCents / totalBrlCents * 100).toFixed(2)
        };
      });
    } else {
      // REAL MODE: Call Efí API
      const platformFeeCents = Math.floor(totalBrlCents * PLATFORM_FEE_BPS / 10000);
      const totalSellerCents = totalBrlCents - platformFeeCents;

      // Build seller profiles map
      const sellerProfiles = await base44.asServiceRole.entities.SellerProfile.filter({
        user_id: { $in: finalSellers.map(s => s.sellerUserId) }
      });
      const profileMap = new Map(sellerProfiles.map(p => [p.user_id, p]));

      // Build repasses
      const repasses = finalSellers.map(seller => {
        const profile = profileMap.get(seller.sellerUserId);
        const sellerShareCents = Math.round((seller.priceBRL / totalPriceBRL) * totalSellerCents);
        const sellerSharePercent = (sellerShareCents / totalBrlCents * 100).toFixed(2);
        const cleanDoc = profile.efi_split_document.replace(/\D/g, '');
        
        return {
          tipo: 'porcentagem',
          valor: sellerSharePercent,
          favorecido: {
            cpf: cleanDoc,
            conta: profile.efi_split_account
          }
        };
      });

      const platformSharePercent = (platformFeeCents / totalBrlCents * 100).toFixed(2);

      // Create split config
      const splitConfig = await efiUpsertSplitConfig({
        descricao: `ALZ Marketplace - ${(alzAllocated / 1_000_000_000).toFixed(2)}B ALZ`,
        lancamento: { imediato: true },
        split: {
          divisaoTarifa: 'assumir_total',
          minhaParte: {
            tipo: 'porcentagem',
            valor: platformSharePercent
          },
          repasses
        }
      });

      // Create PIX charge
      charge = await efiCreatePixCharge({
        txid,
        amountCents: totalBrlCents,
        expiration: 1800,
        infoAdicionais: [
          { nome: 'ALZ Amount', valor: `${(alzAllocated / 1_000_000_000).toFixed(2)}B` },
          { nome: 'Sellers', valor: `${finalSellers.length}` }
        ]
      });

      // Link split to charge
      await efiLinkSplitToCharge({
        txid: charge.txid,
        splitConfigId: splitConfig.splitConfigId
      });

      // Build redacted split recipients snapshot
      splitRecipientsSnapshot = finalSellers.map(seller => {
        const profile = profileMap.get(seller.sellerUserId);
        const sellerShareCents = Math.round((seller.priceBRL / totalPriceBRL) * totalSellerCents);
        const maskedDoc = profile.efi_split_document.replace(/\D/g, '');
        const masked = `***${maskedDoc.slice(-4)}`;
        
        return {
          account: profile.efi_split_account,
          document_masked: masked,
          alz_amount: seller.alzAmount,
          share_cents: sellerShareCents,
          share_percent: (sellerShareCents / totalBrlCents * 100).toFixed(2)
        };
      });
    }

    // STEP 10: Extract matched sell order IDs and slices
    const matchedSellOrderIds = Array.isArray(quote?._matchedOrders)
      ? quote._matchedOrders.map(m => m?.orderId).filter(Boolean).map(String)
      : [];
    
    const matchedSellOrderSlices = Array.isArray(quote?._matchedOrders)
      ? quote._matchedOrders
          .map(m => ({
            order_id: m?.orderId,
            matched_alz: m?.matchedAlz
          }))
          .filter(s => s?.order_id && s?.matched_alz)
          .map(s => ({
            order_id: String(s.order_id),
            matched_alz: String(s.matched_alz)
          }))
      : [];
    
    if (quote._matchedOrders && quote._matchedOrders.length > 0 && matchedSellOrderIds.length === 0) {
      console.error(`[alzCreatePixPaymentForQuote:${correlationId}] CRITICAL: quote matched orders sem IDs`);
      return Response.json({
        ok: false,
        error: {
          code: 'QUOTE_MATCHED_ORDERS_MISSING_IDS',
          message: 'Falha interna: quote matched orders sem IDs. Contate o suporte.'
        },
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 500 });
    }
    
    if (quote._matchedOrders && quote._matchedOrders.length > 0 && matchedSellOrderSlices.length === 0) {
      console.error(`[alzCreatePixPaymentForQuote:${correlationId}] CRITICAL: quote matched orders sem slices`);
      return Response.json({
        ok: false,
        error: {
          code: 'QUOTE_MATCHED_ORDERS_MISSING_SLICES',
          message: 'Falha interna: quote matched orders sem slices. Contate o suporte.'
        },
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 500 });
    }

    // STEP 11: Persist MarketPixPayment
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const payment = await base44.asServiceRole.entities.MarketPixPayment.create({
      buyer_user_id: buyerUserId,
      buyer_character_idx: buyerCharacterIdx,
      buyer_nic: buyerNic.trim(),
      buyer_usernum: buyerUserNum,
      status: 'pix_pending',
      total_brl_cents: totalBrlCents,
      alz_amount: alzAllocated.toString(),
      efi_txid: charge.txid,
      efi_loc_id: charge.location,
      efi_copia_cola: charge.pixCopiaECola,
      efi_qr_image: charge.qrcode,
      split_recipient_count: finalSellers.length,
      split_recipients_snapshot: JSON.stringify(splitRecipientsSnapshot),
      matched_sell_orders: matchedSellOrderIds,
      matched_sell_order_slices: matchedSellOrderSlices,
      idempotency_key: finalIdempotencyKey,
      expires_at: expiresAt
    });

    return Response.json({
      ok: true,
      paymentId: payment.id,
      txid: charge.txid,
      copiaCola: charge.pixCopiaECola,
      qrImage: charge.qrcode,
      amountBrl: totalPriceBRL,
      alzAllocated,
      needsAnotherPurchase,
      remainingAlzSuggested,
      sellersCount: finalSellers.length,
      mockMode,
      correlationId,
      build_signature: BUILD_SIGNATURE
    });

  } catch (error) {
    console.error(`[alzCreatePixPaymentForQuote:${correlationId}] ERROR:`, error);
    return Response.json({ 
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao criar pagamento PIX',
        detail: error.message
      },
      correlationId,
      build_signature: BUILD_SIGNATURE
    }, { status: 500 });
  }
});