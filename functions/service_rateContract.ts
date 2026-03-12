import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({
        success: false,
        error: 'Você precisa estar logado.'
      }, { status: 401 });
    }

    const { contract_id, score, comment } = await req.json();

    if (!contract_id || !score || score < 1 || score > 5) {
      return Response.json({
        success: false,
        error: 'Dados inválidos. A nota deve ser entre 1 e 5.'
      }, { status: 400 });
    }

    // Get contract
    const contracts = await base44.asServiceRole.entities.ServiceContract.filter({ id: contract_id });
    
    if (contracts.length === 0) {
      return Response.json({
        success: false,
        error: 'Contrato não encontrado.'
      }, { status: 404 });
    }

    const contract = contracts[0];

    // Only buyer can rate
    if (user.id !== contract.buyer_user_id) {
      return Response.json({
        success: false,
        error: 'Apenas o comprador pode avaliar o serviço.'
      }, { status: 403 });
    }

    // Only if completed
    if (contract.status !== 'COMPLETED') {
      return Response.json({
        success: false,
        error: 'Você só pode avaliar serviços concluídos.'
      }, { status: 400 });
    }

    // Check if already rated
    const existingRating = await base44.asServiceRole.entities.MarketReputation.filter({
      order_id: contract_id,
      buyer_user_id: user.id,
      context: 'SERVICE_CONTRACT'
    });

    if (existingRating.length > 0) {
      return Response.json({
        success: false,
        error: 'Você já avaliou este serviço.'
      }, { status: 400 });
    }

    // Create rating
    await base44.asServiceRole.entities.MarketReputation.create({
      order_id: contract_id,
      seller_user_id: contract.provider_user_id,
      buyer_user_id: user.id,
      score,
      comment: comment || null,
      context: 'SERVICE_CONTRACT'
    });

    // Log
    await base44.asServiceRole.entities.MarketAuditLog.create({
      action: 'SERVICE_CONTRACT_RATED',
      user_id: user.id,
      username: user.username || user.full_name,
      metadata_json: JSON.stringify({ contract_id, score })
    });

    // Send notification to provider
    try {
      await base44.asServiceRole.functions.invoke('notification_create', {
        user_id: contract.provider_user_id,
        message: 'Você recebeu uma nova avaliação.',
        type: 'contract_rated',
        related_entity_id: contract_id
      });
    } catch (e) {
      // Non-critical error
    }

    return Response.json({
      success: true,
      message: 'Avaliação enviada com sucesso!'
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});