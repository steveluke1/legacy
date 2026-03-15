import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { verifyUserToken } from './_shared/authHelpers.js';
import { validateCPF, validatePixKey, writeAuditLog, generateCorrelationId, safeParseJson } from './_shared/marketHelpers.js';

Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user token
    let user;
    try {
      user = await verifyUserToken(req, base44);
    } catch (authError) {
      return Response.json({
        success: false,
        error: authError.message,
        correlationId
      }, {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await req.text();
    const data = safeParseJson(body);
    
    if (!data || !data.full_name || !data.cpf || !data.efi_pix_key) {
      return Response.json({
        success: false,
        error: 'Dados inválidos: full_name, cpf e efi_pix_key são obrigatórios',
        correlationId
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validações
    if (!validateCPF(data.cpf)) {
      return Response.json({
        success: false,
        error: 'CPF inválido',
        correlationId
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!validatePixKey(data.efi_pix_key)) {
      return Response.json({
        success: false,
        error: 'Chave PIX inválida',
        correlationId
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Buscar perfil existente
    const existingProfiles = await base44.asServiceRole.entities.SellerProfile.filter({ user_id: user.userId }, undefined, 1);
    
    const profileData = {
      user_id: user.userId,
      full_name: data.full_name,
      cpf: data.cpf.replace(/\D/g, ''),
      efi_pix_key: data.efi_pix_key.trim(),
      is_kyc_verified: false,
      risk_tier: existingProfiles.length > 0 ? existingProfiles[0].risk_tier : 'new'
    };
    
    let profile;
    if (existingProfiles.length > 0) {
      // Update
      profile = await base44.asServiceRole.entities.SellerProfile.update(existingProfiles[0].id, profileData);
    } else {
      // Create
      profile = await base44.asServiceRole.entities.SellerProfile.create(profileData);
    }
    
    // Audit log
    await writeAuditLog(base44, {
      action: 'seller_profile_upserted',
      severity: 'info',
      message: `Perfil de vendedor ${existingProfiles.length > 0 ? 'atualizado' : 'criado'} para ${user.email}`,
      data: { userId: user.userId, profileId: profile.id },
      correlationId
    });
    
    return Response.json({
      success: true,
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        is_kyc_verified: profile.is_kyc_verified,
        risk_tier: profile.risk_tier
      },
      correlationId,
      notes: {
        action: existingProfiles.length > 0 ? 'updated' : 'created',
        kycRequired: true
      }
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Erro ao salvar perfil de vendedor',
      correlationId
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});