import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const VALID_TYPES = ['PERSONAGEM', 'COLECAO', 'MERITO', 'LINK_ESTELAR'];

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

    const { type, target_identifier, quantity, notes } = await req.json();

    if (!VALID_TYPES.includes(type)) {
      return Response.json({ 
        success: false,
        error: 'Tipo de transferência inválido.' 
      }, { status: 400 });
    }

    // Find target user
    const targetUsers = await base44.asServiceRole.entities.User.filter({
      email: target_identifier
    });

    let targetUser = targetUsers.length > 0 ? targetUsers[0] : null;

    if (!targetUser) {
      const byName = await base44.asServiceRole.entities.User.filter({
        full_name: target_identifier
      });
      targetUser = byName.length > 0 ? byName[0] : null;
    }

    if (!targetUser) {
      return Response.json({ 
        success: false,
        error: 'Jogador de destino não encontrado.' 
      }, { status: 404 });
    }

    if (targetUser.id === user.id) {
      return Response.json({ 
        success: false,
        error: 'Você não pode fazer transferência para a própria conta.' 
      }, { status: 400 });
    }

    let finalQuantity = quantity || 1;
    if (type !== 'MERITO') {
      finalQuantity = 1;
    } else if (finalQuantity <= 0) {
      return Response.json({ 
        success: false,
        error: 'Quantidade deve ser maior que zero.' 
      }, { status: 400 });
    }

    const transfer = await base44.asServiceRole.entities.TransferRequest.create({
      type,
      from_user_id: user.id,
      from_username: user.full_name,
      to_user_id: targetUser.id,
      to_username: targetUser.full_name,
      status: 'PENDENTE',
      quantity: finalQuantity,
      notes: notes || ''
    });

    await base44.asServiceRole.entities.MarketAuditLog.create({
      action: 'ORDER_CREATED',
      user_id: user.id,
      username: user.full_name,
      metadata_json: JSON.stringify({
        type: 'TRANSFER_CREATE',
        transfer_id: transfer.id,
        transfer_type: type,
        to_user_id: targetUser.id,
        quantity: finalQuantity
      })
    });

    return Response.json({
      success: true,
      message: 'Solicitação de transferência criada com sucesso. Aguarde o outro jogador aceitar.',
      transfer
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});