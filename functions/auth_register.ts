import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts';
import { encodeHex } from 'https://deno.land/std@0.224.0/encoding/hex.ts';

const BUILD_SIGNATURE = 'sb-auth-register-20260105-v3';

// Helper: Get client IP from request headers
function getClientIp(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',');
    return ips[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

// Helper: SHA-256 hash to hex (truncated to 16 chars)
async function sha256Hex(value) {
  if (!value || typeof value !== 'string') return 'null';
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16);
}

// Helper: Rate limit check (safe fail-open if RateLimitBucket entity missing)
async function rateLimitCheck(base44ServiceRole, bucketKey, limit, windowSeconds, blockSeconds) {
  try {
    const now = new Date();
    const nowMs = now.getTime();
    
    const buckets = await base44ServiceRole.entities.RateLimitBucket.filter({ key: bucketKey }, undefined, 1);
    
    if (buckets.length === 0) {
      await base44ServiceRole.entities.RateLimitBucket.create({
        key: bucketKey,
        window_start: now.toISOString(),
        count: 1,
        updated_at_iso: now.toISOString()
      });
      return { allowed: true, remaining: limit - 1 };
    }
    
    const bucket = buckets[0];
    
    if (bucket.blocked_until) {
      const blockedUntil = new Date(bucket.blocked_until);
      if (blockedUntil.getTime() > nowMs) {
        return { allowed: false, remaining: 0, blockedUntil: bucket.blocked_until };
      }
    }
    
    const windowStart = new Date(bucket.window_start);
    const windowEnd = windowStart.getTime() + (windowSeconds * 1000);
    
    if (nowMs > windowEnd) {
      await base44ServiceRole.entities.RateLimitBucket.update(bucket.id, {
        window_start: now.toISOString(),
        count: 1,
        blocked_until: null,
        updated_at_iso: now.toISOString()
      });
      return { allowed: true, remaining: limit - 1 };
    }
    
    const newCount = bucket.count + 1;
    
    if (newCount > limit) {
      const blockUntil = new Date(nowMs + (blockSeconds * 1000));
      await base44ServiceRole.entities.RateLimitBucket.update(bucket.id, {
        count: newCount,
        blocked_until: blockUntil.toISOString(),
        updated_at_iso: now.toISOString()
      });
      return { allowed: false, remaining: 0, blockedUntil: blockUntil.toISOString() };
    }
    
    await base44ServiceRole.entities.RateLimitBucket.update(bucket.id, {
      count: newCount,
      updated_at_iso: now.toISOString()
    });
    
    return { allowed: true, remaining: limit - newCount };
  } catch (error) {
    console.warn(`[rateLimitCheck] Failed: ${error.message} - allowing request (fail-open)`);
    return { allowed: true, remaining: -1 };
  }
}

// Supabase admin singleton
let _supabase = null;
function getSupabaseAdmin() {
  if (_supabase) return _supabase;
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing Supabase secrets');
  _supabase = createClient(url, key, { auth: { persistSession: false } });
  return _supabase;
}

// Get Supabase host safely
function getSupabaseHost() {
  const url = Deno.env.get('SUPABASE_URL');
  if (!url) return 'unknown';
  try {
    return new URL(url).host;
  } catch {
    return 'unknown';
  }
}

// Get Supabase counts for debug mode
async function getSupabaseCounts(supabase) {
  try {
    const [usersResult, sessionsResult, auditResult] = await Promise.all([
      supabase.from('auth_users').select('*', { count: 'exact', head: true }),
      supabase.from('auth_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('auth_audit_log').select('*', { count: 'exact', head: true })
    ]);
    
    return {
      users: usersResult.count || 0,
      sessions: sessionsResult.count || 0,
      audit: auditResult.count || 0
    };
  } catch (error) {
    console.error(`Failed to get Supabase counts: ${error.message}`);
    return { users: -1, sessions: -1, audit: -1 };
  }
}

// Hash password with PBKDF2
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  return encodeHex(new Uint8Array(hashBuffer));
}

// Generate random salt
function generateSalt() {
  return encodeHex(crypto.getRandomValues(new Uint8Array(16)));
}

Deno.serve(async (req) => {
  const correlationId = crypto.randomUUID();
  
  try {
    console.log(`[auth_register:${correlationId}] stage=START build=${BUILD_SIGNATURE}`);
    
    const base44 = createClientFromRequest(req);
    
    // Rate limiting (10 req/min per IP, block 15 min on abuse)
    const clientIp = getClientIp(req);
    const ipHash = await sha256Hex(clientIp);
    const bucketKey = `register:${ipHash}`;
    
    const rateLimit = await rateLimitCheck(base44.asServiceRole, bucketKey, 10, 60, 900);
    
    if (!rateLimit.allowed) {
      console.warn(`[auth_register:${correlationId}] stage=RATE_LIMIT_EXCEEDED ipHash=${ipHash.substring(0, 8)}***`);
      return Response.json({
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message_ptbr: 'Muitas requisições. Tente novamente em alguns minutos.',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 429 });
    }
    
    const body = await req.json();
    
    // Accept both camelCase and snake_case
    const loginIdRaw = body.loginId ?? body.login_id ?? body.loginID ?? body.login;
    const emailRaw = body.email;
    const passwordRaw = body.password;
    const acceptTerms = body.acceptTerms;
    const howFoundUs = body.howFoundUs;
    const debugMode = body.debug === true;
    
    console.log(`[auth_register:${correlationId}] stage=PARSE fields_received=${Object.keys(body).join(',')} howFoundUs=${howFoundUs}`);

    // Validations (email is optional now, only loginId + password required)
    if (!loginIdRaw || !passwordRaw) {
      console.log(`[auth_register:${correlationId}] stage=VALIDATE status=400 reason=MISSING_REQUIRED_FIELDS`);
      return Response.json({
        success: false,
        code: 'MISSING_FIELDS',
        message_ptbr: 'Preencha todos os campos obrigatórios',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    if (!acceptTerms) {
      console.log(`[auth_register:${correlationId}] stage=VALIDATE status=400 reason=TERMS_NOT_ACCEPTED`);
      return Response.json({
        success: false,
        code: 'TERMS_NOT_ACCEPTED',
        message_ptbr: 'Você precisa aceitar os termos para continuar',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    // Email validation (optional field)
    if (emailRaw && emailRaw.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      console.log(`[auth_register:${correlationId}] stage=VALIDATE status=400 reason=INVALID_EMAIL`);
      return Response.json({
        success: false,
        code: 'INVALID_EMAIL',
        message_ptbr: 'Informe um e-mail válido',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    // Login ID validation (Bridge/SP constraints: 1-32 chars)
    if (loginIdRaw.length < 1) {
      console.log(`[auth_register:${correlationId}] stage=VALIDATE status=400 reason=LOGIN_ID_TOO_SHORT`);
      return Response.json({
        success: false,
        code: 'LOGIN_ID_TOO_SHORT',
        message_ptbr: 'ID de login é obrigatório',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    if (loginIdRaw.length > 32) {
      console.log(`[auth_register:${correlationId}] stage=VALIDATE status=400 reason=LOGIN_ID_TOO_LONG`);
      return Response.json({
        success: false,
        code: 'LOGIN_ID_TOO_LONG',
        message_ptbr: 'ID de login deve ter no máximo 32 caracteres',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    // Password validation (Bridge/SP constraints: 1-32 chars)
    if (passwordRaw.length < 1) {
      console.log(`[auth_register:${correlationId}] stage=VALIDATE status=400 reason=PASSWORD_TOO_SHORT`);
      return Response.json({
        success: false,
        code: 'PASSWORD_TOO_SHORT',
        message_ptbr: 'Senha é obrigatória',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    if (passwordRaw.length > 32) {
      console.log(`[auth_register:${correlationId}] stage=VALIDATE status=400 reason=PASSWORD_TOO_LONG`);
      return Response.json({
        success: false,
        code: 'PASSWORD_TOO_LONG',
        message_ptbr: 'A senha deve ter no máximo 32 caracteres',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    // Normalize email and login_id
    const normalizedEmail = emailRaw?.trim().toLowerCase() || `noemail_${crypto.randomUUID()}@legacy-nevareth.local`;
    const normalizedLoginId = loginIdRaw.trim().toLowerCase();

    // Register with Bridge Service (game DB)
    const bridgeBaseUrl = Deno.env.get('BRIDGE_BASE_URL');
    const bridgeApiKey = Deno.env.get('BRIDGE_API_KEY');
    
    if (!bridgeBaseUrl || !bridgeApiKey) {
      console.error(`[auth_register:${correlationId}] stage=BRIDGE_CONFIG_MISSING`);
      return Response.json({
        success: false,
        code: 'SERVER_CONFIG_ERROR',
        message_ptbr: 'Configuração do servidor inválida. Contate o suporte.',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 500 });
    }

    let bridgeResponse;
    try {
      const bridgeUrl = `${bridgeBaseUrl}/internal/auth/register`;
      console.log(`[auth_register:${correlationId}] stage=BRIDGE_CALL url=${bridgeUrl}`);
      
      const response = await fetch(bridgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bridgeApiKey}`
        },
        body: JSON.stringify({
          loginId: normalizedLoginId,
          password: passwordRaw
        })
      });

      bridgeResponse = await response.json();
      console.log(`[auth_register:${correlationId}] stage=BRIDGE_RESPONSE ok=${bridgeResponse.ok}`);

      if (!bridgeResponse.ok) {
        if (bridgeResponse.error === 'ID_TAKEN') {
          console.log(`[auth_register:${correlationId}] stage=BRIDGE_ID_TAKEN`);
          return Response.json({
            success: false,
            code: 'LOGIN_ID_EXISTS',
            message_ptbr: 'Este ID de login já está em uso. Escolha outro.',
            correlationId,
            build_signature: BUILD_SIGNATURE
          }, { status: 409 });
        }
        
        console.error(`[auth_register:${correlationId}] stage=BRIDGE_ERROR error=${bridgeResponse.error}`);
        return Response.json({
          success: false,
          code: 'GAME_REGISTRATION_FAILED',
          message_ptbr: 'Não foi possível criar a conta no servidor de jogo. Tente novamente.',
          correlationId,
          build_signature: BUILD_SIGNATURE
        }, { status: 500 });
      }
    } catch (bridgeError) {
      console.error(`[auth_register:${correlationId}] stage=BRIDGE_FETCH_ERROR error=${bridgeError.message}`);
      return Response.json({
        success: false,
        code: 'BRIDGE_UNAVAILABLE',
        message_ptbr: 'Serviço de registro temporariamente indisponível. Tente novamente.',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 503 });
    }

    const gameUserNum = bridgeResponse.userNum;
    console.log(`[auth_register:${correlationId}] stage=GAME_ACCOUNT_CREATED userNum=${gameUserNum}`);

    // Check uniqueness in Supabase (email only, login_id is already checked by Bridge)
    const supabase = getSupabaseAdmin();
    
    const { data: existingUsers, error: checkError } = await supabase
      .from('auth_users')
      .select('user_id, email')
      .eq('email', normalizedEmail)
      .limit(1);

    if (checkError) {
      console.error(`[auth_register:${correlationId}] stage=CHECK_UNIQUE_ERROR error=${checkError.message}`);
      throw new Error('Database query failed');
    }

    if (existingUsers && existingUsers.length > 0) {
      console.log(`[auth_register:${correlationId}] stage=CHECK_UNIQUE status=409 reason=EMAIL_EXISTS`);
      return Response.json({
        success: false,
        code: 'EMAIL_EXISTS',
        message_ptbr: 'Este e-mail já está cadastrado. Tente fazer login.',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 409 });
    }

    // Hash password
    const salt = generateSalt();
    const passwordHash = await hashPassword(passwordRaw, salt);

    console.log(`[auth_register:${correlationId}] stage=CREATE_USER email=${normalizedEmail} login_id=${normalizedLoginId} howFoundUs=${howFoundUs || 'null'}`);

    // Generate UUID for user_id (same as Base44 would do)
    const userId = crypto.randomUUID();

    // Insert into Supabase
    const userData = {
      user_id: userId,
      login_id: normalizedLoginId,
      email: normalizedEmail,
      username: normalizedLoginId,
      password_hash: passwordHash,
      password_salt: salt,
      game_user_num: gameUserNum,
      is_active: true,
      failed_login_attempts: 0,
      role: 'user'
    };
    
    if (howFoundUs && typeof howFoundUs === 'string' && howFoundUs.trim() !== '') {
      userData.how_found_us = howFoundUs.trim();
    }
    
    const { data: user, error: insertError } = await supabase
      .from('auth_users')
      .insert([userData])
      .select()
      .single();

    if (insertError || !user) {
      console.error(`[auth_register:${correlationId}] stage=INSERT_ERROR error=${insertError?.message || 'No user returned'}`);
      throw new Error('Failed to create user');
    }

    console.log(`[auth_register:${correlationId}] stage=USER_CREATED user_id=${user.user_id}`);

    // Create GameAccount for the new user (idempotent)
    try {
      const existingGameAccounts = await base44.asServiceRole.entities.GameAccount.filter({
        user_id: user.user_id
      }, undefined, 1);

      if (existingGameAccounts.length === 0) {
        await base44.asServiceRole.entities.GameAccount.create({
          user_id: user.user_id,
          username: normalizedLoginId,
          email: normalizedEmail,
          alz_balance: 0,
          alz_locked: 0,
          cash_balance: 0,
          cash_locked: 0,
          is_active: true,
          is_test_account: false
        });
        console.log(`[auth_register:${correlationId}] stage=GAME_ACCOUNT_CREATED`);
      } else {
        console.log(`[auth_register:${correlationId}] stage=GAME_ACCOUNT_EXISTS (skip)`);
      }
    } catch (gameAccountError) {
      console.error(`[auth_register:${correlationId}] stage=GAME_ACCOUNT_ERROR error=${gameAccountError.message}`);
      // Non-blocking: continue registration even if GameAccount fails
    }

    // Audit log
    const { error: auditError } = await supabase
      .from('auth_audit_log')
      .insert([{
        user_id: user.user_id,
        email: normalizedEmail,
        event_type: 'register',
        meta: {
          login_id: normalizedLoginId,
          how_found_us: howFoundUs || null
        }
      }]);

    if (auditError) {
      console.error(`[auth_register:${correlationId}] stage=AUDIT_ERROR error=${auditError.message}`);
    }

    console.log(`[auth_register:${correlationId}] stage=SUCCESS user_id=${user.user_id}`);

    // Build response
    const response = {
      success: true,
      user: {
        id: user.user_id,
        email: user.email,
        login_id: user.login_id,
        game_user_num: user.game_user_num,
        role: user.role || 'user'
      },
      correlationId,
      build_signature: BUILD_SIGNATURE
    };

    // Add debug info if requested
    if (debugMode) {
      const counts = await getSupabaseCounts(supabase);
      response.supabase_host = getSupabaseHost();
      response.supabase_counts = counts;
      console.log(`[auth_register:${correlationId}] debug_counts users=${counts.users} sessions=${counts.sessions} audit=${counts.audit}`);
    }

    return Response.json(response, { status: 201 });

  } catch (error) {
    console.error(`[auth_register:${correlationId}] stage=ERROR message=${error.message} stack=${error.stack}`);
    
    let errorMessage = 'Erro ao criar conta. Tente novamente.';
    if (error.message?.includes('validation') || error.message?.includes('schema')) {
      errorMessage = 'Dados inválidos. Verifique os campos e tente novamente.';
    }
    
    return Response.json({
      success: false,
      code: 'INTERNAL_ERROR',
      message_ptbr: errorMessage,
      correlationId,
      build_signature: BUILD_SIGNATURE
    }, { status: 500 });
  }
});