// functions/_lib/efiClient.js
// Self-contained Efí Pix client with mTLS, OAuth, and Split support
// Build: EFI-CLIENT-V1-20260106

// SECRETS REQUIRED:
// - EFI_ENV: "homologacao" or "producao"
// - EFI_CLIENT_ID: OAuth client ID
// - EFI_CLIENT_SECRET: OAuth client secret
// - EFI_PIX_KEY: Pix key for charges
// - EFI_CERT_PEM_B64: Base64-encoded client certificate (mTLS)
// - EFI_KEY_PEM_B64: Base64-encoded client private key (mTLS)
// - EFI_WEBHOOK_SECRET: (optional) HMAC secret for webhook validation

// In-memory token cache
let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Get EFI configuration from environment
 */
export function getEfiConfig() {
  return {
    env: (Deno.env.get('EFI_ENV') || 'homologacao').trim(),
    clientId: (Deno.env.get('EFI_CLIENT_ID') || '').trim(),
    clientSecret: (Deno.env.get('EFI_CLIENT_SECRET') || '').trim(),
    certPemB64: (Deno.env.get('EFI_CERT_PEM_B64') || '').trim(),
    keyPemB64: (Deno.env.get('EFI_KEY_PEM_B64') || '').trim(),
    pixKey: (Deno.env.get('EFI_PIX_KEY') || '').trim(),
    webhookSecret: (Deno.env.get('EFI_WEBHOOK_SECRET') || '').trim(),
    debug: Deno.env.get('EFI_DEBUG') === '1'
  };
}

/**
 * Validate EFI configuration
 */
export function validateEfiConfig() {
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

/**
 * Get EFI base URL based on environment
 */
export function getEfiBaseUrl(env = 'homologacao') {
  if (env === 'producao' || env === 'production' || env === 'prod') {
    return 'https://api.gerencianet.com.br';
  }
  return 'https://api-pix-h.gerencianet.com.br';
}

/**
 * Create mTLS HTTP client for EFI
 */
export function createMtlsHttpClient() {
  const config = getEfiConfig();
  
  if (!config.certPemB64 || !config.keyPemB64) {
    throw new Error('Certificados EFI não configurados (EFI_CERT_PEM_B64 e EFI_KEY_PEM_B64)');
  }

  try {
    const certChain = atob(config.certPemB64);
    const privateKey = atob(config.keyPemB64);

    return Deno.createHttpClient({
      certChain,
      privateKey
    });
  } catch (error) {
    throw new Error(`Erro ao criar cliente mTLS: ${error.message}`);
  }
}

/**
 * Get OAuth access token from EFI (cached for 50 minutes)
 */
export async function getAccessToken(forceRefresh = false) {
  const now = Date.now();
  const config = getEfiConfig();
  
  // Return cached token if still valid and not forcing refresh
  if (!forceRefresh && cachedToken && now < tokenExpiresAt) {
    if (config.debug) {
      console.log('[EFI] Using cached token');
    }
    return cachedToken;
  }
  
  if (!config.clientId || !config.clientSecret) {
    throw new Error('Credenciais EFI não configuradas (EFI_CLIENT_ID e EFI_CLIENT_SECRET)');
  }

  const baseUrl = getEfiBaseUrl(config.env);
  const credentials = btoa(`${config.clientId}:${config.clientSecret}`);

  if (config.debug) {
    console.log(`[EFI] Obtaining OAuth token (env: ${config.env}, url: ${baseUrl})`);
  }

  try {
    const client = createMtlsHttpClient();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    const response = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      signal: controller.signal,
      client,
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'client_credentials'
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`EFI OAuth error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    
    cachedToken = data.access_token;
    tokenExpiresAt = now + (50 * 60 * 1000); // 50 minutes (safe margin for 60min tokens)
    
    if (config.debug) {
      console.log('[EFI] OAuth token obtained successfully');
    }
    
    return cachedToken;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Timeout ao obter token EFI (15s)');
    }
    throw new Error(`Falha na autenticação EFI: ${error.message}`);
  }
}

/**
 * Make authenticated request to EFI API
 */
export async function efiFetch(path, options = {}, retries = 2) {
  const config = getEfiConfig();
  const baseUrl = getEfiBaseUrl(config.env);
  let token = await getAccessToken();
  const client = createMtlsHttpClient();

  const url = `${baseUrl}${path}`;
  
  if (config.debug) {
    console.log(`[EFI] Request: ${options.method || 'GET'} ${path}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

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

    // If 401 and retries available, refresh token and retry
    if (response.status === 401 && retries > 0) {
      if (config.debug) {
        console.log('[EFI] Token expired, refreshing...');
      }
      token = await getAccessToken(true); // Force refresh
      return efiFetch(path, options, retries - 1);
    }

    if (config.debug) {
      console.log(`[EFI] Response: ${response.status}`);
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

/**
 * Create Pix Charge (Cob Imediata)
 * @param {Object} params
 * @param {string} params.txid - Transaction ID (26-35 chars, alphanumeric)
 * @param {number} params.amountCents - Amount in cents (integer)
 * @param {Object} params.devedor - Payer info (optional)
 * @param {number} params.expiration - Expiration in seconds (default 3600)
 * @param {string} params.infoAdicionais - Additional info (array of key-value)
 * @returns {Promise<Object>} { txid, location, pixCopiaECola, qrcode (base64), status }
 */
export async function efiCreatePixCharge({ txid, amountCents, devedor, expiration = 3600, infoAdicionais }) {
  const config = getEfiConfig();
  
  if (!txid || txid.length < 26 || txid.length > 35) {
    throw new Error('txid deve ter entre 26 e 35 caracteres alfanuméricos');
  }
  
  if (!amountCents || amountCents <= 0) {
    throw new Error('amountCents deve ser > 0');
  }
  
  if (!config.pixKey) {
    throw new Error('EFI_PIX_KEY não configurado');
  }

  const payload = {
    calendario: {
      expiracao: expiration
    },
    valor: {
      original: (amountCents / 100).toFixed(2)
    },
    chave: config.pixKey,
    solicitacaoPagador: 'Pagamento Legacy of Nevareth - ALZ Marketplace'
  };
  
  if (devedor) {
    payload.devedor = devedor;
  }
  
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
  
  // Get QR code (location payload)
  if (data.loc && data.loc.id) {
    const qrResponse = await efiFetch(`/v2/loc/${data.loc.id}/qrcode`, {
      method: 'GET'
    });
    
    if (qrResponse.ok) {
      const qrData = await qrResponse.json();
      data.qrcode = qrData.imagemQrcode; // Base64 image
      data.pixCopiaECola = qrData.qrcode; // Copy-paste string
    }
  }
  
  return {
    txid: data.txid,
    location: data.location,
    pixCopiaECola: data.pixCopiaECola || null,
    qrcode: data.qrcode || null,
    status: data.status,
    revision: data.revisao
  };
}

/**
 * Create/Update Pix Split Configuration
 * Docs: https://dev.efipay.com.br/en/docs/api-pix/split-de-pagamento-pix/
 * @param {Object} params
 * @param {string} params.splitConfigId - Optional: if provided, updates existing config (PUT)
 * @param {string} params.descricao - Description
 * @param {Object} params.lancamento - { imediato: true }
 * @param {Object} params.split - Split config
 * @param {string} params.split.divisaoTarifa - 'assumir_total' | 'assumir_vendedor' | 'proporcional'
 * @param {Object} params.split.minhaParte - Platform share { tipo, valor }
 * @param {Array} params.split.repasses - Sellers (max 20, recommend max 18) [{ tipo, valor, favorecido: { cpf, conta } }]
 * @returns {Promise<Object>} { splitConfigId, status }
 */
export async function efiUpsertSplitConfig({ splitConfigId, descricao, lancamento, split }) {
  if (!split || !split.repasses || split.repasses.length === 0) {
    throw new Error('split.repasses array é obrigatório');
  }
  
  if (split.repasses.length > 20) {
    throw new Error('Split máximo de 20 repasses (limite Efí)');
  }

  // Validate repasses structure (CORRECT Efí format)
  for (const repasse of split.repasses) {
    if (!repasse.favorecido) {
      throw new Error('Cada repasse deve ter favorecido: { cpf, conta }');
    }
    
    const { cpf, conta } = repasse.favorecido;
    
    if (!cpf || !/^\d{11,14}$/.test(cpf)) {
      throw new Error(`favorecido.cpf inválido: ${cpf} (esperado: 11-14 dígitos)`);
    }
    if (!conta) {
      throw new Error('favorecido.conta é obrigatório (número da conta Efí)');
    }
    if (!repasse.tipo || !['porcentagem', 'fixo'].includes(repasse.tipo)) {
      throw new Error(`repasse.tipo inválido: ${repasse.tipo} (esperado: porcentagem|fixo)`);
    }
    if (repasse.valor === undefined || repasse.valor === null) {
      throw new Error('repasse.valor é obrigatório');
    }
  }

  const payload = {
    descricao: descricao || 'ALZ Marketplace Split',
    lancamento: lancamento || { imediato: true },
    split
  };

  const method = splitConfigId ? 'PUT' : 'POST';
  const path = splitConfigId 
    ? `/v2/gn/split/config/${splitConfigId}` 
    : '/v2/gn/split/config';

  const response = await efiFetch(path, {
    method,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`EFI ${method} splitConfig error: ${response.status} - ${errorText.substring(0, 300)}`);
  }

  const data = await response.json();
  
  return {
    splitConfigId: data.id || data.split_config_id || splitConfigId,
    status: data.status
  };
}

/**
 * Link Split Config to Charge (txid) - VINCULO endpoint
 * Docs: https://dev.gerencianet.com.br/docs/api-pix-split#vincular-split-a-cobranca
 * Must be called AFTER creating both charge and split config
 */
export async function efiLinkSplitToCharge({ txid, splitConfigId }) {
  if (!txid || !splitConfigId) {
    throw new Error('txid e splitConfigId são obrigatórios');
  }

  const payload = {
    split_config_id: splitConfigId
  };

  // CORRECT ENDPOINT: vinculo (not /cob/txid/split)
  const response = await efiFetch(`/v2/gn/split/cob/${txid}/vinculo`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`EFI linkSplit (vinculo) error: ${response.status} - ${errorText.substring(0, 300)}`);
  }

  const data = await response.json();
  
  return {
    txid: data.txid || txid,
    splitLinked: true,
    splitConfigId: data.split_config_id || splitConfigId,
    status: data.status
  };
}

/**
 * Validate Efí webhook signature (HMAC-SHA256) - ASYNC version
 * @param {string} rawPayload - Raw request body string
 * @param {string} receivedSignature - Signature from x-signature-efi header
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function efiValidateWebhookSignature(rawPayload, receivedSignature) {
  const config = getEfiConfig();
  const webhookSecret = config.webhookSecret;
  
  if (!webhookSecret || webhookSecret.trim() === '') {
    console.warn('[efiClient] EFI_WEBHOOK_SECRET not configured - skipping signature validation');
    return { valid: true }; // Allow in dev/testing without secret
  }
  
  if (!receivedSignature || receivedSignature.trim() === '') {
    return { valid: false, error: 'Assinatura ausente (x-signature-efi header)' };
  }
  
  try {
    // Compute HMAC-SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(webhookSecret);
    const messageData = encoder.encode(rawPayload);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Constant-time comparison
    if (constantTimeEquals(receivedSignature.toLowerCase(), expectedSignature.toLowerCase())) {
      return { valid: true };
    } else {
      return { valid: false, error: 'Assinatura inválida (HMAC mismatch)' };
    }
    
  } catch (error) {
    console.error('[efiClient] Signature validation error:', error);
    return { valid: false, error: `Erro na validação: ${error.message}` };
  }
}

/**
 * Constant-time string comparison (timing-attack safe)
 */
function constantTimeEquals(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  if (a.length !== b.length) {
    return false;
  }
  
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return diff === 0;
}

/**
 * Redact sensitive data for logging
 */
export function redact(value) {
  if (!value || typeof value !== 'string') return '[EMPTY]';
  if (value.length < 8) return '[REDACTED]';
  return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
}

/**
 * Check if EFI is properly configured
 */
export function isEfiConfigured() {
  const validation = validateEfiConfig();
  return validation.configured;
}