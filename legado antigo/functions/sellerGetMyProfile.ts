// functions/sellerGetMyProfile.js
// Get seller profile with MASKED sensitive data (canonical camelCase)
// VERSION: 7.0.0 - BODY TOKEN AUTH (self-contained, no local imports)

const BUILD_STAMP = "sellerGetMyProfile-v7-bodytoken";

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// JWT verification with HS256 (self-contained for platform deployment compatibility)
async function verifyJwtHs256(token, secret) {
  const encoder = new TextEncoder();
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('INVALID_TOKEN_FORMAT');
  }
  
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  
  const payloadJson = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'));
  const payload = JSON.parse(payloadJson);
  
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('TOKEN_EXPIRED');
  }
  
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

Deno.serve(async (req) => {
  try {
    const data = await req.json().catch(() => ({}));
    
    // Self-test
    if (data?.__selfTest === true) {
      return Response.json({
        ok: true,
        data: { self_test: true },
        _build: BUILD_STAMP
      }, { status: 200 });
    }

    const token = String(data?.token || "").trim();
    
    if (!token) {
      return Response.json({ 
        ok: false, 
        error: { code: 'UNAUTHORIZED', message: 'Sessão expirada. Faça login novamente.' },
        _build: BUILD_STAMP
      }, { status: 401 });
    }

    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (!jwtSecret) {
      return Response.json({
        ok: false,
        error: { code: 'SERVER_CONFIG_ERROR', message: 'Erro de configuração do servidor' },
        _build: BUILD_STAMP
      }, { status: 500 });
    }

    let payload;
    try {
      payload = await verifyJwtHs256(token, jwtSecret);
    } catch (e) {
      const errorMsg = e.message === 'TOKEN_EXPIRED' 
        ? 'Sessão expirada. Faça login novamente.'
        : 'Sessão inválida. Faça login novamente.';
      
      return Response.json({
        ok: false,
        error: { code: 'UNAUTHORIZED', message: errorMsg },
        _build: BUILD_STAMP
      }, { status: 401 });
    }

    if (!payload.sub) {
      return Response.json({
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Sessão inválida. Faça login novamente.' },
        _build: BUILD_STAMP
      }, { status: 401 });
    }

    const userId = payload.sub;
    const base44 = createClientFromRequest(req);
    
    // Fetch seller profile by user_id
    const profiles = await base44.asServiceRole.entities.SellerProfile.filter({
      user_id: userId
    }, undefined, 1);

    if (profiles.length === 0) {
      return Response.json({
        ok: true,
        profile: null,
        _build: BUILD_STAMP
      });
    }

    const profile = profiles[0];

    // Normalize status: 'pending' → 'verified' (auto-approve + heal DB)
    let normalizedStatus = profile.efi_split_status || 'missing';
    
    if (normalizedStatus === 'pending') {
      normalizedStatus = 'verified';
      
      // Persist the fix to heal DB (fire-and-forget, don't block response)
      base44.asServiceRole.entities.SellerProfile.update(profile.id, {
        efi_split_status: 'verified'
      }).catch(err => {
        console.error(`[sellerGetMyProfile] Failed to heal pending status for profile ${profile.id}:`, err);
      });
    }

    // Mask sensitive data (keep only needed fields)
    const maskedProfile = {
      id: profile.id,
      user_id: profile.user_id,
      full_name: profile.full_name,
      efi_split_account: profile.efi_split_account ? '***' + profile.efi_split_account.slice(-4) : null,
      efi_split_document: profile.efi_split_document ? profile.efi_split_document.slice(0, 3) + '***' : null,
      efi_split_status: normalizedStatus,
      efi_split_updated_at: profile.efi_split_updated_at,
      is_kyc_verified: profile.is_kyc_verified || false,
      risk_tier: profile.risk_tier || 'new'
    };

    return Response.json({
      ok: true,
      profile: maskedProfile,
      _build: BUILD_STAMP
    });

  } catch (error) {
    console.error('[sellerGetMyProfile] ERROR:', error);
    return Response.json({
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao buscar perfil' },
      _build: BUILD_STAMP
    }, { status: 500 });
  }
});