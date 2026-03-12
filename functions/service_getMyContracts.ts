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

    // Get contracts where user is buyer
    const asBuyer = await base44.asServiceRole.entities.ServiceContract.filter({
      buyer_user_id: user.id
    }, '-created_date');

    // Get contracts where user is provider
    const asProvider = await base44.asServiceRole.entities.ServiceContract.filter({
      provider_user_id: user.id
    }, '-created_date');

    // Enrich with offer and user data
    const enrichContract = async (contract, role) => {
      const offer = await base44.asServiceRole.entities.ServiceOffer.filter({ id: contract.offer_id });
      const otherUserId = role === 'buyer' ? contract.provider_user_id : contract.buyer_user_id;
      const otherUser = await base44.asServiceRole.entities.User.filter({ id: otherUserId });

      return {
        ...contract,
        offer_title: offer[0]?.title || 'Serviço',
        other_user_name: otherUser[0]?.username || otherUser[0]?.full_name || 'Usuário',
        role
      };
    };

    const enrichedAsBuyer = await Promise.all(asBuyer.map(c => enrichContract(c, 'buyer')));
    const enrichedAsProvider = await Promise.all(asProvider.map(c => enrichContract(c, 'provider')));

    return Response.json({
      success: true,
      as_buyer: enrichedAsBuyer,
      as_provider: enrichedAsProvider
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});