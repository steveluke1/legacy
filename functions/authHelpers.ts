/**
 * Server-side Auth Helpers (FLAT FILE - DEPLOY SAFE)
 * Reusable token verification functions for user and admin authentication
 * 
 * CRITICAL: This file is flat (functions/authHelpers.js) to ensure Base44 deployment includes it.
 * DO NOT move to subfolders like _shared/ as it breaks deployment.
 */

/**
 * Manually verify JWT without external dependencies
 * @param {string} token - JWT token
 * @param {string} secret - JWT secret
 * @returns {Promise<object|null>} - Decoded payload or null if invalid
 */
async function verifyJwtHs256(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const keyData = encoder.encode(secret);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = Uint8Array.from(
      atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify('HMAC', key, signature, data);
    if (!valid) return null;

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('[authHelpers] JWT verification error:', error.message);
    return null;
  }
}

/**
 * Parse Bearer token from Authorization header or request body
 * @param {Request} req - HTTP request
 * @returns {string|null} - Token or null
 */
function parseBearerToken(req) {
  // Try Authorization header first
  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

/**
 * Verify user token and return payload
 * @param {Request} req - HTTP request
 * @param {object} base44 - Base44 client instance
 * @returns {Promise<object>} - User payload { userId, login_id, role, jti }
 * @throws {Error} - 401 if unauthorized
 */
export async function verifyUserToken(req, base44) {
  const token = parseBearerToken(req);
  
  if (!token) {
    throw new Error('Você precisa entrar para continuar.');
  }

  const jwtSecret = Deno.env.get('JWT_SECRET');
  if (!jwtSecret) {
    console.error('[authHelpers] JWT_SECRET not configured');
    throw new Error('Configuração de segurança ausente. Contate o administrador do sistema.');
  }

  const payload = await verifyJwtHs256(token, jwtSecret);
  if (!payload) {
    throw new Error('Token inválido ou expirado.');
  }

  // Check session in database
  const sessions = await base44.asServiceRole.entities.AuthSession.filter({
    user_id: payload.sub,
    token_jti: payload.jti
  }, undefined, 1);

  if (sessions.length === 0) {
    throw new Error('Sessão não encontrada.');
  }

  const session = sessions[0];
  if (session.revoked_at) {
    throw new Error('Sessão revogada.');
  }

  // Load user
  const users = await base44.asServiceRole.entities.AuthUser.filter({
    id: payload.sub
  }, undefined, 1);

  if (users.length === 0) {
    throw new Error('Usuário não encontrado.');
  }

  const user = users[0];
  if (!user.is_active) {
    throw new Error('Conta desativada.');
  }

  return {
    userId: payload.sub,
    login_id: payload.login_id,
    email: payload.email,
    role: payload.role,
    jti: payload.jti
  };
}

/**
 * Verify admin token and return payload
 * @param {Request} req - HTTP request
 * @param {object} base44 - Base44 client instance
 * @returns {Promise<object>} - Admin payload { adminId, email, role, jti }
 * @throws {Error} - 401 if unauthorized
 */
export async function verifyAdminToken(req, base44) {
  const token = parseBearerToken(req);
  
  if (!token) {
    throw new Error('Acesso restrito. Faça login de administrador.');
  }

  const jwtSecret = Deno.env.get('ADMIN_JWT_SECRET');
  if (!jwtSecret) {
    console.error('[authHelpers] ADMIN_JWT_SECRET not configured');
    throw new Error('Configuração de segurança ausente. Contate o administrador do sistema.');
  }

  const payload = await verifyJwtHs256(token, jwtSecret);
  if (!payload) {
    throw new Error('Token de administrador inválido ou expirado.');
  }

  // Check session in database
  const sessions = await base44.asServiceRole.entities.AdminSession.filter({
    admin_user_id: payload.sub,
    token_jti: payload.jti
  }, undefined, 1);

  if (sessions.length === 0) {
    throw new Error('Sessão de administrador não encontrada.');
  }

  const session = sessions[0];
  if (session.revoked_at) {
    throw new Error('Sessão de administrador revogada.');
  }

  // Load admin user
  const admins = await base44.asServiceRole.entities.AdminUser.filter({
    id: payload.sub
  }, undefined, 1);

  if (admins.length === 0) {
    throw new Error('Administrador não encontrado.');
  }

  const admin = admins[0];
  if (!admin.is_active) {
    throw new Error('Conta de administrador desativada.');
  }

  return {
    adminId: payload.sub,
    email: payload.email,
    username: payload.username,
    role: payload.role,
    jti: payload.jti
  };
}