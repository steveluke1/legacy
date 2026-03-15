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

    const { contract_id } = await req.json();

    const contracts = await base44.asServiceRole.entities.ServiceContract.filter({ id: contract_id });

    if (contracts.length === 0) {
      return Response.json({
        success: false,
        error: 'Contrato não encontrado.'
      }, { status: 404 });
    }

    const contract = contracts[0];

    // Check permission
    if (user.id !== contract.buyer_user_id && 
        user.id !== contract.provider_user_id &&
        user.role !== 'admin') {
      return Response.json({
        success: false,
        error: 'Você não tem permissão para visualizar este contrato.'
      }, { status: 403 });
    }

    // Get offer
    const offer = await base44.asServiceRole.entities.ServiceOffer.filter({ id: contract.offer_id });

    // Get buyer and provider info
    const buyer = await base44.asServiceRole.entities.User.filter({ id: contract.buyer_user_id });
    const provider = await base44.asServiceRole.entities.User.filter({ id: contract.provider_user_id });

    // Get logs
    const logs = await base44.asServiceRole.entities.ServiceContractLog.filter({
      contract_id
    }, 'created_date');

    return Response.json({
      success: true,
      contract,
      offer: offer[0] || null,
      buyer: buyer[0] || null,
      provider: provider[0] || null,
      logs
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});