import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2';

const BUILD_SIGNATURE = 'sb-auth-login-20260105-v3';

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

// PBKDF2 password hashing
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
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Manual JWT creation with HS256
async function createJWT(payload, secret) {
  const encoder = new TextEncoder();
  
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${encodedHeader}.${encodedPayload}`)
  );
  
  const signatureArray = Array.from(new Uint8Array(signature));
  const encodedSignature = btoa(String.fromCharCode(...signatureArray))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

function generateRequestId() {
  return Math.random().toString(36).substring(2, 10);
}

function generateJTI() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
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



Deno.serve(async (req) => {
  const requestId = generateRequestId();
  console.log(`[auth_login] ${requestId} - START ${BUILD_SIGNATURE}`);
  
  try {
    if (req.method !== 'POST') {
      return Response.json({
        success: false,
        error: 'Método não permitido.',
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const base44 = createClientFromRequest(req);
    
    // Rate limiting (10 req/min per IP, block 15 min on abuse)
    const clientIp = getClientIp(req);
    const ipHash = await sha256Hex(clientIp);
    const bucketKey = `login:${ipHash}`;
    
    const rateLimit = await rateLimitCheck(base44.asServiceRole, bucketKey, 10, 60, 900);
    
    if (!rateLimit.allowed) {
      console.warn(`[auth_login] ${requestId} - RATE_LIMIT_EXCEEDED ipHash=${ipHash.substring(0, 8)}***`);
      return Response.json({
        success: false,
        error: 'Muitas tentativas. Tente novamente mais tarde.',
        error_code: 'TOO_MANY_ATTEMPTS',
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, { 
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({
        success: false,
        error: 'Requisição inválida.',
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Accept both camelCase and snake_case
    const loginIdRaw = body.login_id ?? body.loginId ?? body.loginID ?? body.login;
    const password = body.password;
    const debugMode = body.debug === true;

    if (!loginIdRaw || typeof loginIdRaw !== 'string' || !loginIdRaw.trim()) {
      console.log(`[auth_login] ${requestId} - MISSING_LOGIN_ID`);
      return Response.json({
        success: false,
        error: 'Informe seu ID de login.',
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
      console.log(`[auth_login] ${requestId} - MISSING_PASSWORD`);
      return Response.json({
        success: false,
        error: 'Informe sua senha.',
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate password length (1-32 chars for login, matching SQL Server varchar(32))
    if (password.length > 32) {
      console.log(`[auth_login] ${requestId} - PASSWORD_TOO_LONG`);
      return Response.json({
        success: false,
        error: 'Senha inválida.',
        error_code: 'INVALID_PASSWORD',
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const normalizedLoginId = loginIdRaw.trim().toLowerCase();
    console.log(`[auth_login] ${requestId} - LOOKUP login=${normalizedLoginId.substring(0, 3)}***`);

    // Validate credentials with Bridge Service (game DB)
    const bridgeBaseUrl = Deno.env.get('BRIDGE_BASE_URL');
    const bridgeApiKey = Deno.env.get('BRIDGE_API_KEY');
    
    if (!bridgeBaseUrl || !bridgeApiKey) {
      console.error(`[auth_login] ${requestId} - BRIDGE_CONFIG_MISSING`);
      return Response.json({
        success: false,
        error: 'Configuração do servidor inválida. Contate o suporte.',
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let bridgeResponse;
    try {
      const bridgeUrl = `${bridgeBaseUrl}/internal/auth/login`;
      console.log(`[auth_login] ${requestId} - BRIDGE_CALL url=${bridgeUrl}`);
      
      const response = await fetch(bridgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bridgeApiKey}`
        },
        body: JSON.stringify({
          loginId: normalizedLoginId,
          password: password
        })
      });

      bridgeResponse = await response.json();
      console.log(`[auth_login] ${requestId} - BRIDGE_RESPONSE ok=${bridgeResponse.ok}`);

      if (!bridgeResponse.ok) {
        console.log(`[auth_login] ${requestId} - BRIDGE_AUTH_FAILED`);
        return Response.json({
          success: false,
          error: 'ID ou senha inválidos.',
          error_code: 'INVALID_CREDENTIALS',
          request_id: requestId,
          build_signature: BUILD_SIGNATURE
        }, { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (bridgeError) {
      console.error(`[auth_login] ${requestId} - BRIDGE_ERROR: ${bridgeError.message}`);
      return Response.json({
        success: false,
        error: 'Serviço de login indisponível no momento. Tente novamente.',
        error_code: 'BRIDGE_UNAVAILABLE',
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const gameUserNum = bridgeResponse.userNum;
    console.log(`[auth_login] ${requestId} - GAME_AUTH_OK userNum=${gameUserNum}`);

    const supabase = getSupabaseAdmin();

    // Try Supabase first
    const { data: supabaseUsers, error: sbError } = await supabase
      .from('auth_users')
      .select('*')
      .eq('login_id', normalizedLoginId)
      .limit(1);

    if (sbError) {
      console.error(`[auth_login] ${requestId} - SUPABASE_ERROR: ${sbError.message}`);
      throw new Error('Database query failed');
    }

    let user = null;
    let fromLegacy = false;

    if (supabaseUsers && supabaseUsers.length > 0) {
      // User found in Supabase
      user = supabaseUsers[0];
      console.log(`[auth_login] ${requestId} - USER_FOUND_SUPABASE id=${user.user_id}`);
    } else {
      // Lazy migration: try legacy Base44 entity
      console.log(`[auth_login] ${requestId} - NOT_IN_SUPABASE checking_legacy`);
      
      const legacyUsers = await base44.asServiceRole.entities.AuthUser.filter({
        login_id: normalizedLoginId
      }, undefined, 1);

      if (legacyUsers.length === 0) {
        console.log(`[auth_login] ${requestId} - USER_NOT_FOUND`);
        
        const { error: auditErr } = await supabase
          .from('auth_audit_log')
          .insert([{
            email: 'unknown',
            event_type: 'login_failed',
            meta: { reason: 'user_not_found', login_id: normalizedLoginId, request_id: requestId }
          }]);

        if (auditErr) {
          console.error(`[auth_login] ${requestId} - AUDIT_FAIL: ${auditErr.message}`);
        }

        return Response.json({
          success: false,
          error: 'ID de login ou senha inválidos.',
          request_id: requestId,
          build_signature: BUILD_SIGNATURE
        }, { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const legacyUser = legacyUsers[0];
      console.log(`[auth_login] ${requestId} - LEGACY_USER_FOUND id=${legacyUser.id} migrating`);
      
      // Verify password first before migrating
      const passwordHash = await hashPassword(password, legacyUser.password_salt);
      const hashMatches = passwordHash === legacyUser.password_hash;
      
      if (!hashMatches) {
        console.log(`[auth_login] ${requestId} - LEGACY_INVALID_PASSWORD no_migration`);
        
        const { error: auditErr } = await supabase
          .from('auth_audit_log')
          .insert([{
            user_id: legacyUser.id,
            email: legacyUser.email,
            event_type: 'login_failed',
            meta: { reason: 'invalid_password_legacy', login_id: normalizedLoginId, request_id: requestId }
          }]);

        if (auditErr) {
          console.error(`[auth_login] ${requestId} - AUDIT_FAIL: ${auditErr.message}`);
        }

        return Response.json({
          success: false,
          error: 'ID de login ou senha inválidos.',
          request_id: requestId,
          build_signature: BUILD_SIGNATURE
        }, { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Password correct, migrate to Supabase
      const migrateData = {
        user_id: legacyUser.id,
        login_id: legacyUser.login_id,
        email: legacyUser.email,
        username: legacyUser.username || legacyUser.login_id,
        password_hash: legacyUser.password_hash,
        password_salt: legacyUser.password_salt,
        game_user_num: gameUserNum,
        is_active: legacyUser.is_active ?? true,
        failed_login_attempts: legacyUser.failed_login_attempts || 0,
        locked_until: legacyUser.locked_until || null,
        role: legacyUser.role || 'user',
        how_found_us: legacyUser.how_found_us || null,
        last_login_at: legacyUser.last_login_at || null
      };

      const { data: migratedUser, error: migrateError } = await supabase
        .from('auth_users')
        .insert([migrateData])
        .select()
        .single();

      if (migrateError) {
        console.error(`[auth_login] ${requestId} - MIGRATION_ERROR: ${migrateError.message}`);
        throw new Error('Migration failed');
      }

      user = migratedUser;
      fromLegacy = true;
      console.log(`[auth_login] ${requestId} - MIGRATION_SUCCESS user_id=${user.user_id}`);
    }

    // Check lockout
    if (user.locked_until) {
      const lockedUntil = new Date(user.locked_until);
      if (lockedUntil > new Date()) {
        console.log(`[auth_login] ${requestId} - ACCOUNT_LOCKED`);
        return Response.json({
          success: false,
          error: 'Muitas tentativas. Tente novamente mais tarde.',
          error_code: 'TOO_MANY_ATTEMPTS',
          request_id: requestId,
          build_signature: BUILD_SIGNATURE
        }, { 
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Update game_user_num if missing (for existing users)
    if (!user.game_user_num && gameUserNum) {
      console.log(`[auth_login] ${requestId} - UPDATING_GAME_USER_NUM`);
      await supabase
        .from('auth_users')
        .update({ game_user_num: gameUserNum })
        .eq('user_id', user.user_id);
      user.game_user_num = gameUserNum;
    }

    // Bridge already validated password, but verify local hash for consistency (skip if just migrated)
    if (!fromLegacy) {
      const passwordHash = await hashPassword(password, user.password_salt);
      const hashMatches = passwordHash === user.password_hash;
      
      console.log(`[auth_login] ${requestId} - HASH_CHECK matches=${hashMatches}`);
      
      if (!hashMatches) {
        console.log(`[auth_login] ${requestId} - INVALID_PASSWORD`);
        
        const newAttempts = (user.failed_login_attempts || 0) + 1;
        const updateData = { failed_login_attempts: newAttempts };

        if (newAttempts >= 5) {
          const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
          updateData.locked_until = lockUntil.toISOString();
          console.log(`[auth_login] ${requestId} - LOCKED_AFTER_5`);
        }

        await supabase
          .from('auth_users')
          .update(updateData)
          .eq('user_id', user.user_id);

        const { error: auditErr } = await supabase
          .from('auth_audit_log')
          .insert([{
            user_id: user.user_id,
            email: user.email,
            event_type: newAttempts >= 5 ? 'account_locked' : 'login_failed',
            meta: { attempts: newAttempts, login_id: normalizedLoginId, request_id: requestId }
          }]);

        if (auditErr) {
          console.error(`[auth_login] ${requestId} - AUDIT_FAIL: ${auditErr.message}`);
        }

        return Response.json({
          success: false,
          error: newAttempts >= 5 
            ? 'Muitas tentativas. Tente novamente mais tarde.'
            : 'ID ou senha inválidos.',
          error_code: newAttempts >= 5 ? 'TOO_MANY_ATTEMPTS' : 'INVALID_CREDENTIALS',
          request_id: requestId,
          build_signature: BUILD_SIGNATURE
        }, { 
          status: newAttempts >= 5 ? 429 : 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    console.log(`[auth_login] ${requestId} - PASSWORD_OK`);

    // Lazy backfill GameAccount if missing (idempotent)
    try {
      const existingGameAccounts = await base44.asServiceRole.entities.GameAccount.filter({
        user_id: user.user_id
      }, undefined, 1);

      if (existingGameAccounts.length === 0) {
        await base44.asServiceRole.entities.GameAccount.create({
          user_id: user.user_id,
          username: user.login_id,
          email: user.email,
          alz_balance: 0,
          alz_locked: 0,
          cash_balance: 0,
          cash_locked: 0,
          is_active: true,
          is_test_account: false
        });
        console.log(`[auth_login] ${requestId} - GAME_ACCOUNT_BACKFILLED`);
      }
    } catch (gameAccountError) {
      console.error(`[auth_login] ${requestId} - GAME_ACCOUNT_BACKFILL_ERROR: ${gameAccountError.message}`);
      // Non-blocking: continue login
    }

    // Update user
    await supabase
      .from('auth_users')
      .update({
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString()
      })
      .eq('user_id', user.user_id);

    // Create session
    const jti = generateJTI();
    const exp = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
    
    const { error: sessionError } = await supabase
      .from('auth_sessions')
      .insert([{
        user_id: user.user_id,
        token_jti: jti,
        expires_at: new Date(exp * 1000).toISOString()
      }]);

    if (sessionError) {
      console.error(`[auth_login] ${requestId} - SESSION_ERROR: ${sessionError.message}`);
      throw new Error('Failed to create session');
    }

    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (!jwtSecret) {
      console.error(`[auth_login] ${requestId} - JWT_SECRET_MISSING`);
      return Response.json({
        success: false,
        error: 'Configuração inválida do servidor de autenticação. Contate o suporte.',
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = await createJWT({
      sub: user.user_id,
      email: user.email,
      login_id: user.login_id,
      game_user_num: user.game_user_num || gameUserNum,
      role: user.role || 'user',
      jti: jti,
      iat: Math.floor(Date.now() / 1000),
      exp: exp
    }, jwtSecret);

    console.log(`[auth_login] ${requestId} - JWT_CREATED token_length=${token.length}`);

    // Audit log
    const { error: auditErr } = await supabase
      .from('auth_audit_log')
      .insert([{
        user_id: user.user_id,
        email: user.email,
        event_type: 'login_success',
        meta: { login_id: normalizedLoginId, request_id: requestId, migrated: fromLegacy }
      }]);

    if (auditErr) {
      console.error(`[auth_login] ${requestId} - AUDIT_FAIL: ${auditErr.message}`);
    }

    // Analytics (keep for backward compatibility)
    try {
      await base44.asServiceRole.entities.AnalyticsEvent.create({
        event_type: 'login_success',
        event_name: 'Login Success',
        path: '/Entrar',
        role_context: 'user',
        user_id: user.user_id,
        session_id: jti,
        anon_id: jti,
        day_key: new Date().toISOString().split('T')[0],
        dedupe_key: `login_success_${user.user_id}_${Date.now()}`,
        metadata: { login_id: user.login_id }
      });
    } catch (e) {
      console.error(`[auth_login] ${requestId} - ANALYTICS_FAIL: ${e.message}`);
    }

    console.log(`[auth_login] ${requestId} - SUCCESS`);

    // Build response
    const response = {
      success: true,
      token: token,
      user: {
        id: user.user_id,
        email: user.email,
        login_id: user.login_id,
        game_user_num: user.game_user_num || gameUserNum,
        role: user.role || 'user'
      },
      request_id: requestId,
      build_signature: BUILD_SIGNATURE
    };

    // Add debug info if requested
    if (debugMode) {
      const counts = await getSupabaseCounts(supabase);
      response.supabase_host = getSupabaseHost();
      response.supabase_counts = counts;
      console.log(`[auth_login] ${requestId} - debug_counts users=${counts.users} sessions=${counts.sessions} audit=${counts.audit}`);
    }

    return Response.json(response, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[auth_login] ${requestId} - FATAL_ERROR:`, error);
    return Response.json({
      success: false,
      error: 'Serviço de autenticação indisponível. Tente novamente em instantes.',
      request_id: requestId,
      build_signature: BUILD_SIGNATURE
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});