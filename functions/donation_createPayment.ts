import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const DONATION_PACKAGES = {
  'DONATION_10': { amount_brl: 10, base_cash: 1000, bonus_percent: 0, total_cash: 1000 },
  'DONATION_25': { amount_brl: 25, base_cash: 2500, bonus_percent: 0, total_cash: 2500 },
  'DONATION_50': { amount_brl: 50, base_cash: 5000, bonus_percent: 0, total_cash: 5000 },
  'DONATION_100': { amount_brl: 100, base_cash: 10000, bonus_percent: 5, total_cash: 10500 },
  'DONATION_250': { amount_brl: 250, base_cash: 25000, bonus_percent: 5, total_cash: 26250 },
  'DONATION_500': { amount_brl: 500, base_cash: 50000, bonus_percent: 10, total_cash: 55000 },
  'DONATION_1000': { amount_brl: 1000, base_cash: 100000, bonus_percent: 10, total_cash: 110000 },
  'DONATION_5000': { amount_brl: 5000, base_cash: 500000, bonus_percent: 20, total_cash: 600000 }
};

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

    const { package_id } = await req.json();
    const pkg = DONATION_PACKAGES[package_id];

    if (!pkg) {
      return Response.json({ 
        success: false,
        error: 'Pacote inválido' 
      }, { status: 400 });
    }

    // Create payment transaction
    const transaction = await base44.asServiceRole.entities.PaymentTransaction.create({
      provider: 'TEST',
      status: 'PENDING',
      gross_amount_brl: pkg.amount_brl,
      net_amount_brl: pkg.amount_brl,
      fees_brl: 0,
      currency: 'BRL',
      raw_payload: JSON.stringify({
        type: 'DONATION_CASH',
        user_id: user.id,
        package_id,
        base_cash: pkg.base_cash,
        bonus_percent: pkg.bonus_percent,
        total_cash: pkg.total_cash
      })
    });

    const bonusText = pkg.bonus_percent > 0 ? ` (bônus ${pkg.bonus_percent}%)` : '';
    const summary = `Você está doando R$ ${pkg.amount_brl.toFixed(2)} e receberá ${pkg.total_cash.toLocaleString('pt-BR')} Cash${bonusText}.`;

    return Response.json({
      success: true,
      transaction_id: transaction.id,
      payment_url: `/minha-conta/doacao?payment_pending=${transaction.id}`,
      summary
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});