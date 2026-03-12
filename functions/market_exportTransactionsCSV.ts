import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Get all orders
    const orders = await base44.asServiceRole.entities.MarketOrder.list();

    // Build CSV
    const headers = [
      'transaction_id',
      'listing_id',
      'buyer_id',
      'buyer_username',
      'seller_username',
      'valor_brl',
      'status',
      'data_criacao',
      'data_conclusao'
    ];

    let csv = headers.join(',') + '\n';

    for (const order of orders) {
      const snapshot = order.listing_snapshot || {};
      const row = [
        order.id,
        order.listing_id,
        order.buyer_user_id,
        order.buyer_username,
        snapshot.seller_username || '',
        order.total_price_brl,
        order.status,
        order.created_date,
        order.completed_at || ''
      ];
      csv += row.map(v => `"${v}"`).join(',') + '\n';
    }

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=transacoes_mercado_ziron.csv'
      }
    });

  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});