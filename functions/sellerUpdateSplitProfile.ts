// functions/sellerUpdateSplitProfile.js
// Update seller's Efí Split configuration (canonical camelCase)
// VERSION: 8.0.0 - BODY TOKEN AUTH (custom JWT HS256) - Force redeploy

const BUILD_STAMP = "sellerUpdateSplitProfile-v8-bodytoken-20260113";

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// JWT verification with HS256 (copied from auth_me.js for self-contained deployment)
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

Deno.serve(async (req) => {
  try {
    const data = await req.json().catch(() => ({}));
    
    // SELF-TEST FIRST (for deployment verification)
    if (data?.__selfTest === true) {
      return Response.json({
        ok: true,
        data: { self_test: true },
        _build: BUILD_STAMP
      }, { status: 200 });
    }

    const correlationId = `seller-split-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Auth required - extract token from body
    const token = String(data?.token || "").trim();
    
    if (!token) {
      return Response.json({ 
        ok: false, 
        error: { code: 'UNAUTHORIZED', message: 'Sessão expirada. Faça login novamente.' },
        _build: BUILD_STAMP
      }, { status: 401 });
    }

    // Verify JWT
    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (!jwtSecret) {
      console.error(`[sellerUpdateSplitProfile:${correlationId}] JWT_SECRET missing`);
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
      console.log(`[sellerUpdateSplitProfile:${correlationId}] JWT_INVALID reason=${e.message}`);
      const errorMsg = e.message === 'TOKEN_EXPIRED' 
        ? 'Sessão expirada. Faça login novamente.'
        : 'Sessão inválida. Faça login novamente.';
      
      return Response.json({
        ok: false,
        error: { code: 'UNAUTHORIZED', message: errorMsg },
        _build: BUILD_STAMP
      }, { status: 401 });
    }

    // Validate required claims
    if (!payload.sub) {
      return Response.json({
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Sessão inválida. Faça login novamente.' },
        _build: BUILD_STAMP
      }, { status: 401 });
    }

    const userId = payload.sub;
    const base44 = createClientFromRequest(req);

    const { full_name, efi_split_account, efi_split_document } = data;

    // Validate inputs
    if (!full_name || full_name.trim().length < 3) {
      return Response.json({
        ok: false,
        error: { code: 'INVALID_NAME', message: 'Nome completo é obrigatório (mínimo 3 caracteres)' },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    if (!efi_split_account || efi_split_account.trim().length === 0) {
      return Response.json({
        ok: false,
        error: { code: 'INVALID_ACCOUNT', message: 'Número da conta Efí é obrigatório' },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    // Validate document (digits only, 11 or 14)
    const cleanDoc = (efi_split_document || '').replace(/\D/g, '');
    
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
      return Response.json({
        ok: false,
        error: { 
          code: 'INVALID_DOCUMENT', 
          message: 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos' 
        },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    // Check if profile exists
    const existingProfiles = await base44.asServiceRole.entities.SellerProfile.filter({
      user_id: userId
    }, undefined, 1);

    const now = new Date().toISOString();
    const profileData = {
      full_name: full_name.trim(),
      efi_split_account: efi_split_account.trim(),
      efi_split_document: cleanDoc,
      efi_split_status: 'pending',
      efi_split_updated_at: now
    };

    let profile;

    if (existingProfiles.length > 0) {
      // Update existing
      profile = await base44.asServiceRole.entities.SellerProfile.update(
        existingProfiles[0].id,
        profileData
      );
    } else {
      // Create new
      profile = await base44.asServiceRole.entities.SellerProfile.create({
        user_id: userId,
        ...profileData,
        is_kyc_verified: false,
        risk_tier: 'new'
      });
    }

    console.log(`[sellerUpdateSplitProfile:${correlationId}] SUCCESS user=${userId}`);

    return Response.json({
      ok: true,
      data: {
        profile_id: profile.id,
        efi_split_status: profile.efi_split_status,
        updated_at: profile.efi_split_updated_at
      },
      _build: BUILD_STAMP
    });

  } catch (error) {
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao salvar dados',
        detail: String(error?.message || error)
      },
      _build: BUILD_STAMP
    }, { status: 500 });
  }
});