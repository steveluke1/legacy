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
        cash_balance: 0,
        reputation_tier: 'Bronze Crystal',
        avatar_frame: 'default'
      });
    } else {
      userAccount = userAccounts[0];
    }

    // Credit Cash to BOTH fields for backwards compatibility
    const newCrystalFragments = (userAccount.crystal_fragments || 0) + payload.total_cash;
    const newCashBalance = (userAccount.cash_balance || 0) + payload.total_cash;
    
    await base44.asServiceRole.entities.UserAccount.update(userAccount.id, {
      crystal_fragments: newCrystalFragments,
      cash_balance: newCashBalance
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
        new_cash_balance: newCashBalance
      })
    });

    return Response.json({
      success: true,
      cash_credited: payload.total_cash,
      new_balance: newCashBalance,
      message: `${payload.total_cash.toLocaleString('pt-BR')} Cash creditado com sucesso!`
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});