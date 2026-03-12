import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * DISABLED IN PRODUCTION - Simulation endpoints removed
 * Real payments must use webhook confirmation only (alz_handlePixWebhook, premium_confirmPayment, etc.)
 * This function is permanently disabled to prevent fake payment confirmations
 */
Deno.serve(async (req) => {
  console.warn('[donation_simulatePayment] BLOCKED - Simulation disabled in production');
  
  return Response.json({
    success: false,
    error: {
      code: 'DISABLED',
      message: 'Recurso desativado em produção. Use apenas pagamentos reais confirmados via webhook.'
    }
  }, { status: 403 });
});

/* ORIGINAL CODE DISABLED - DO NOT REMOVE COMMENT BLOCK
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { transaction_id } = await req.json();

    // Get transaction
    const transactions = await base44.asServiceRole.entities.PaymentTransaction.filter({
      id: transaction_id
    });

    if (transactions.length === 0) {
      return Response.json({ 
        success: false,
        error: 'Transação não encontrada' 
      }, { status: 404 });
    }

    const transaction = transactions[0];
    const payload = JSON.parse(transaction.raw_payload);

    if (payload.type !== 'DONATION_CASH') {
      return Response.json({ 
        success: false,
        error: 'Tipo de transação inválido' 
      }, { status: 400 });
    }

    // Get user account
    const userAccounts = await base44.asServiceRole.entities.UserAccount.filter({
      user_id: user.id
    });

    let userAccount;
    if (userAccounts.length === 0) {
      userAccount = await base44.asServiceRole.entities.UserAccount.create({
        user_id: user.id,
        level: 1,
        exp: 0,
        crystal_fragments: 0,
        reputation_tier: 'Bronze Crystal',
        avatar_frame: 'default'
      });
    } else {
      userAccount = userAccounts[0];
    }

    // Credit Cash
    const newBalance = (userAccount.crystal_fragments || 0) + payload.total_cash;
    await base44.asServiceRole.entities.UserAccount.update(userAccount.id, {
      crystal_fragments: newBalance
    });

    // Update transaction
    await base44.asServiceRole.entities.PaymentTransaction.update(transaction.id, {
      status: 'PAID'
    });

    // Log
    await base44.asServiceRole.entities.MarketAuditLog.create({
      action: 'ORDER_PAID',
      user_id: user.id,
      username: user.full_name,
      metadata_json: JSON.stringify({
        type: 'DONATION_CASH',
        transaction_id,
        cash_credited: payload.total_cash,
        new_balance: newBalance
      })
    });

    return Response.json({
      success: true,
      cash_credited: payload.total_cash,
      new_balance: newBalance,
      message: `${payload.total_cash.toLocaleString('pt-BR')} Cash creditado com sucesso!`
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});
END DISABLED CODE */