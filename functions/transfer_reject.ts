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

    const { transfer_id } = await req.json();

    const transfers = await base44.asServiceRole.entities.TransferRequest.filter({
      id: transfer_id
    });

    if (transfers.length === 0) {
      return Response.json({ 
        success: false,
        error: 'Transferência não encontrada.' 
      }, { status: 404 });
    }

    const transfer = transfers[0];

    if (transfer.to_user_id !== user.id) {
      return Response.json({ 
        success: false,
        error: 'Você não tem permissão para recusar esta transferência.' 
      }, { status: 403 });
    }

    if (transfer.status !== 'PENDENTE') {
      return Response.json({ 
        success: false,
        error: 'Esta transferência não está mais pendente.' 
      }, { status: 400 });
    }

    await base44.asServiceRole.entities.TransferRequest.update(transfer.id, {
      status: 'RECUSADO',
      processed_at: new Date().toISOString()
    });

    await base44.asServiceRole.entities.MarketAuditLog.create({
      action: 'ORDER_CANCELLED',
      user_id: user.id,
      username: user.full_name,
      metadata_json: JSON.stringify({
        type: 'TRANSFER_REJECT',
        transfer_id
      })
    });

    return Response.json({
      success: true,
      message: 'Transferência recusada com sucesso.'
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});