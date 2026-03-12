import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { adminToken, new_fee_percent } = await req.json();

    // Verify admin authentication
    if (!adminToken) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verify admin session
    const adminSessions = await base44.asServiceRole.entities.AdminSession.filter({ 
      token: adminToken 
    });
    
    if (adminSessions.length === 0) {
      return Response.json({ error: 'Sessão admin inválida' }, { status: 403 });
    }

    if (new_fee_percent === undefined || new_fee_percent === null) {
      return Response.json({ 
        error: 'new_fee_percent é obrigatório' 
      }, { status: 400 });
    }

    if (new_fee_percent < 0 || new_fee_percent > 20) {
      return Response.json({ 
        error: 'Taxa deve estar entre 0% e 20%' 
      }, { status: 400 });
    }

    // Get current settings
    const settings = await base44.asServiceRole.entities.MarketSettings.filter({ 
      id: 'global' 
    });

    let currentSettings;
    let oldFee = 1.5;

    if (settings.length > 0) {
      currentSettings = settings[0];
      oldFee = currentSettings.market_fee_percent;

      // Update existing settings
      await base44.asServiceRole.entities.MarketSettings.update(currentSettings.id, {
        market_fee_percent: new_fee_percent,
        updated_at: new Date().toISOString(),
        updated_by_admin_id: adminSessions[0].admin_user_id
      });
    } else {
      // Create new settings
      currentSettings = await base44.asServiceRole.entities.MarketSettings.create({
        id: 'global',
        market_fee_percent: new_fee_percent,
        efi_environment: 'homolog',
        efi_split_enabled: true,
        updated_at: new Date().toISOString(),
        updated_by_admin_id: adminSessions[0].admin_user_id
      });
    }

    // Create ledger entry
    await base44.asServiceRole.entities.LedgerEntry.create({
      entry_id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'FEE_CHANGED',
      ref_id: 'global',
      actor: 'admin',
      actor_id: adminSessions[0].admin_user_id,
      metadata: {
        old_fee_percent: oldFee,
        new_fee_percent: new_fee_percent,
        changed_at: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      old_fee_percent: oldFee,
      new_fee_percent: new_fee_percent,
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in admin_setMarketFeePercent:', error);
    return Response.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
});