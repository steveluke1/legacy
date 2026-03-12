import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({
        success: false,
        error: 'Apenas administradores podem resolver disputas.'
      }, { status: 403 });
    }

    const { contract_id, resolution_notes } = await req.json();

    if (!contract_id) {
      return Response.json({
        success: false,
        error: 'contract_id é obrigatório.'
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

    if (contract.status !== 'DISPUTE_OPEN') {
      return Response.json({
        success: false,
        error: 'Este contrato não está em disputa.'
      }, { status: 400 });
    }

    // Update contract status
    await base44.asServiceRole.entities.ServiceContract.update(contract_id, {
      status: 'DISPUTE_RESOLVED',
      internal_admin_notes: resolution_notes || 'Resolvido por administrador'
    });

    // Create log entry
    await base44.asServiceRole.entities.ServiceContractLog.create({
      contract_id: contract_id,
      actor_user_id: user.id,
      previous_status: 'DISPUTE_OPEN',
      new_status: 'DISPUTE_RESOLVED',
      action_type: 'RESOLVE_DISPUTE',
      message: `Disputa resolvida por administrador: ${resolution_notes || 'Sem notas adicionais'}`
    });

    // Notify buyer and provider
    await base44.asServiceRole.functions.invoke('notification_create', {
      user_id: contract.buyer_user_id,
      message: 'Uma ação administrativa foi aplicada ao seu contrato.',
      type: 'admin_action',
      related_entity_id: contract_id,
      action_url: `/mercado/servicos/contrato/${contract_id}`
    });

    await base44.asServiceRole.functions.invoke('notification_create', {
      user_id: contract.provider_user_id,
      message: 'Uma ação administrativa foi aplicada ao seu contrato.',
      type: 'admin_action',
      related_entity_id: contract_id,
      action_url: `/mercado/servicos/contrato/${contract_id}`
    });

    return Response.json({
      success: true,
      message: 'Disputa resolvida com sucesso',
      contract_id: contract_id
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});