import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Manual JWT verification with HS256 (same as auth_me.js)
async function verifyJwtHs256(token, secret) {
  const encoder = new TextEncoder();
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('INVALID_TOKEN_FORMAT');
  }
  
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  
  // Decode payload
  const payloadJson = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'));
  const payload = JSON.parse(payloadJson);
  
  // Verify expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('TOKEN_EXPIRED');
  }
  
  // Verify signature
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  const signatureBytes = Uint8Array.from(
    atob(encodedSignature.replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  );
  
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    encoder.encode(`${encodedHeader}.${encodedPayload}`)
  );
  
  if (!isValid) {
    throw new Error('INVALID_SIGNATURE');
  }
  
  return payload;
}

/**
 * Helper function to create or get UserAccount for a user
 * Ensures UserAccount exists after registration/login
 */
Deno.serve(async (req) => {
  const requestId = Math.random().toString(36).substring(2, 10);
  
  try {
    console.log(`[auth_createOrGetUserAccount:${requestId}] START`);
    
    const base44 = createClientFromRequest(req);
    
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({
        success: false,
        error: 'Requisição inválida.'
      }, { status: 400 });
    }

    const { token } = body || {};

    if (!token) {
      console.log(`[auth_createOrGetUserAccount:${requestId}] NO_TOKEN`);
      return Response.json({
        success: false,
        error: 'Token não fornecido.'
      }, { status: 401 });
    }

    // Require JWT_SECRET
    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (!jwtSecret) {
      console.error(`[auth_createOrGetUserAccount:${requestId}] JWT_SECRET_MISSING`);
      return Response.json({
        success: false,
        error: 'Configuração do servidor inválida.'
      }, { status: 500 });
    }

    // Verify JWT
    let payload;
    try {
      payload = await verifyJwtHs256(token, jwtSecret);
      console.log(`[auth_createOrGetUserAccount:${requestId}] JWT_VERIFIED sub=${payload.sub}`);
    } catch (e) {
      console.log(`[auth_createOrGetUserAccount:${requestId}] JWT_INVALID reason=${e.message}`);
      return Response.json({
        success: false,
        error: 'Sessão inválida.'
      }, { status: 401 });
    }

    // Check session validity
    const sessions = await base44.asServiceRole.entities.AuthSession.filter({
      token_jti: payload.jti
    }, undefined, 1);

    if (sessions.length === 0) {
      console.log(`[auth_createOrGetUserAccount:${requestId}] SESSION_NOT_FOUND`);
      return Response.json({
        success: false,
        error: 'Sessão não encontrada.'
      }, { status: 401 });
    }

    const session = sessions[0];

    // Check if revoked
    if (session.revoked_at) {
      console.log(`[auth_createOrGetUserAccount:${requestId}] SESSION_REVOKED`);
      return Response.json({
        success: false,
        error: 'Sessão encerrada.'
      }, { status: 401 });
    }

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      console.log(`[auth_createOrGetUserAccount:${requestId}] SESSION_EXPIRED`);
      return Response.json({
        success: false,
        error: 'Sua sessão expirou.'
      }, { status: 401 });
    }

    // Get user
    const users = await base44.asServiceRole.entities.AuthUser.filter({
      id: payload.sub
    }, undefined, 1);

    if (users.length === 0) {
      console.log(`[auth_createOrGetUserAccount:${requestId}] USER_NOT_FOUND`);
      return Response.json({
        success: false,
        error: 'Usuário não encontrado.'
      }, { status: 401 });
    }

    const user = users[0];

    if (!user.is_active) {
      console.log(`[auth_createOrGetUserAccount:${requestId}] USER_INACTIVE`);
      return Response.json({
        success: false,
        error: 'Conta desativada.'
      }, { status: 403 });
    }

    console.log(`[auth_createOrGetUserAccount:${requestId}] AUTH_OK user_id=${user.id}`);

    // Check if UserAccount exists
    const existingAccounts = await base44.asServiceRole.entities.UserAccount.filter({
      user_id: user.id
    }, undefined, 1);

    if (existingAccounts.length > 0) {
      console.log(`[auth_createOrGetUserAccount:${requestId}] ACCOUNT_FOUND`);
      return Response.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            login_id: user.login_id,
            role: user.role || 'user'
          },
          userAccount: existingAccounts[0]
        }
      });
    }

    // Create UserAccount if doesn't exist
    const newAccount = await base44.asServiceRole.entities.UserAccount.create({
      user_id: user.id,
      level: 1,
      exp: 0,
      crystal_fragments: 0,
      cash_balance: 0,
      reputation_tier: 'Bronze Crystal',
      avatar_frame: 'default',
      last_daily_reset: new Date().toISOString().split('T')[0]
    });

    console.log(`[auth_createOrGetUserAccount:${requestId}] ACCOUNT_CREATED account_id=${newAccount.id}`);

    return Response.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          login_id: user.login_id,
          role: user.role || 'user'
        },
        userAccount: newAccount,
        created: true
      }
    });

  } catch (error) {
    console.error(`[auth_createOrGetUserAccount:${requestId}] ERROR:`, error);
    return Response.json({
      success: false,
      error: 'Erro ao processar solicitação.'
    }, { status: 500 });
  }
});