// functions/_shared/sellerProfileLogic.js
// Shared logic for seller profile operations

/**
 * Get seller profile with masked sensitive data
 * @param {object} base44 - Base44 SDK instance
 * @param {object} user - Authenticated user
 * @returns {Promise<object>} - { ok, data?, error? }
 */
export async function getSellerProfile(base44, user) {
  try {
    if (!user) {
      return {
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Não autorizado' }
      };
    }

    const profiles = await base44.asServiceRole.entities.SellerProfile.filter({
      user_id: user.id
    }, undefined, 1);

    if (profiles.length === 0) {
      return {
        ok: true,
        data: {
          profile: null,
          needs_setup: true
        }
      };
    }

    const profile = profiles[0];

    // MASK sensitive data for non-admin users
    let maskedProfile = { ...profile };
    
    if (user.role !== 'admin') {
      // Mask document (show only last 4 digits)
      if (profile.efi_split_document) {
        const doc = profile.efi_split_document.replace(/\D/g, '');
        maskedProfile.efi_split_document_masked = `***${doc.slice(-4)}`;
        delete maskedProfile.efi_split_document;
      }
      
      // Mask account (show only last 3 digits)
      if (profile.efi_split_account) {
        maskedProfile.efi_split_account_masked = `***${profile.efi_split_account.slice(-3)}`;
        delete maskedProfile.efi_split_account;
      }
      
      // Remove deprecated fields from response
      delete maskedProfile.cpf;
      delete maskedProfile.efi_pix_key;
    }

    return {
      ok: true,
      data: {
        profile: maskedProfile,
        needs_setup: false
      }
    };

  } catch (error) {
    console.error('[sellerProfileLogic.getSellerProfile] ERROR:', error);
    
    return {
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao buscar perfil'
      }
    };
  }
}

/**
 * Update seller's Efí Split configuration
 * @param {object} base44 - Base44 SDK instance
 * @param {object} user - Authenticated user
 * @param {object} data - { full_name, efi_split_account, efi_split_document }
 * @returns {Promise<object>} - { ok, data?, error? }
 */
export async function updateSellerSplitProfile(base44, user, data, correlationId = 'unknown') {
  try {
    if (!user) {
      return {
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Não autorizado' }
      };
    }

    const { full_name, efi_split_account, efi_split_document } = data;

    // Validate inputs
    if (!full_name || full_name.trim().length < 3) {
      return {
        ok: false,
        error: { code: 'INVALID_NAME', message: 'Nome completo é obrigatório (mínimo 3 caracteres)' }
      };
    }

    if (!efi_split_account || efi_split_account.trim().length === 0) {
      return {
        ok: false,
        error: { code: 'INVALID_ACCOUNT', message: 'Número da conta Efí é obrigatório' }
      };
    }

    // Validate document (digits only, 11 or 14)
    const cleanDoc = efi_split_document.replace(/\D/g, '');
    
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
      return {
        ok: false,
        error: { 
          code: 'INVALID_DOCUMENT', 
          message: 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos' 
        }
      };
    }

    // Check if profile exists
    const existingProfiles = await base44.asServiceRole.entities.SellerProfile.filter({
      user_id: user.id
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
        user_id: user.id,
        ...profileData,
        is_kyc_verified: false,
        risk_tier: 'new'
      });
    }

    console.log(`[sellerProfileLogic.updateSellerSplitProfile:${correlationId}] SUCCESS user=${user.id}`);

    return {
      ok: true,
      data: {
        profile_id: profile.id,
        efi_split_status: profile.efi_split_status,
        updated_at: profile.efi_split_updated_at
      }
    };

  } catch (error) {
    console.error(`[sellerProfileLogic.updateSellerSplitProfile:${correlationId}] ERROR:`, error);
    
    return {
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao salvar dados',
        detail: error.message
      }
    };
  }
}