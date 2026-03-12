import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({
        success: false,
        error: 'Você precisa estar logado para contratar um serviço.'
      }, { status: 401 });
    }

    const {
      offer_id,
      scheduled_datetime,
      notes_from_buyer
    } = await req.json();

    if (!offer_id) {
      return Response.json({
        success: false,
        error: 'ID da oferta não fornecido.'
      }, { status: 400 });
    }

    // Check RMT terms acceptance
    const termsAccepted = await base44.asServiceRole.entities.MarketTermsAccepted.filter({
      user_id: user.id
    });

    if (termsAccepted.length === 0) {
      return Response.json({
        success: false,
        error: 'Você precisa aceitar os Termos do Mercado ZIRON antes de contratar um serviço.',
        redirect: '/mercado/termos'
      }, { status: 403 });
    }

    // Get offer
    const offers = await base44.asServiceRole.entities.ServiceOffer.filter({ id: offer_id });
    
    if (offers.length === 0) {
      return Response.json({
        success: false,
        error: 'Serviço não encontrado.'
      }, { status: 404 });
    }

    const offer = offers[0];

    if (!offer.is_active || offer.status !== 'ACTIVE') {
      return Response.json({
        success: false,
        error: 'Este serviço não está mais disponível.'
      }, { status: 400 });
    }

    // Cannot buy your own service
    if (user.id === offer.provider_user_id) {
      return Response.json({
        success: false,
        error: 'Você não pode contratar seu próprio serviço.'
      }, { status: 400 });
    }

    // Determine payment amount
    const paymentAmount = offer.price_type === 'BRL' ? offer.price_brl : offer.price_cash;

    let paymentTransactionId = null;

    // Create payment transaction if BRL
    if (offer.price_type === 'BRL') {
      const paymentResponse = await base44.asServiceRole.functions.invoke('market_simulatePayment', {
        amount: paymentAmount,
        type: 'SERVICE_CONTRACT',
        reference_id: `service_${offer.id}`
      });

      if (paymentResponse.data && paymentResponse.data.success) {
        paymentTransactionId = paymentResponse.data.transaction.id;
      } else {
        return Response.json({
          success: false,
          error: 'Erro ao criar transação de pagamento.'
        }, { status: 500 });
      }
    } else if (offer.price_type === 'CASH') {
      // Deduct CASH from user balance
      const deductResponse = await base44.asServiceRole.functions.invoke('wallet_deductCash', {
        user_id: user.id,
        amount: paymentAmount,
        reason: `Service contract: ${offer.title}`
      });

      if (!deductResponse.data || !deductResponse.data.success) {
        return Response.json({
          success: false,
          error: deductResponse.data?.error || 'Saldo de CASH insuficiente.'
        }, { status: 400 });
      }
    }

    // Create contract
    const contract = await base44.asServiceRole.entities.ServiceContract.create({
      offer_id,
      buyer_user_id: user.id,
      provider_user_id: offer.provider_user_id,
      status: 'PENDING_PAYMENT',
      payment_type: offer.price_type,
      payment_transaction_id: paymentTransactionId,
      scheduled_datetime: scheduled_datetime || null,
      notes_from_buyer: notes_from_buyer || null
    });

    // Log creation
    await base44.asServiceRole.entities.ServiceContractLog.create({
      contract_id: contract.id,
      actor_user_id: user.id,
      previous_status: null,
      new_status: 'PENDING_PAYMENT',
      action_type: 'CREATE',
      message: `Contrato criado por ${user.username || user.full_name}`
    });

    await base44.asServiceRole.entities.MarketAuditLog.create({
      action: 'SERVICE_CONTRACT_CREATED',
      user_id: user.id,
      username: user.username || user.full_name,
      metadata_json: JSON.stringify({ 
        contract_id: contract.id, 
        offer_id,
        amount: paymentAmount,
        payment_type: offer.price_type
      })
    });

    // Get payment URL if BRL
    let paymentUrl = null;
    if (offer.price_type === 'BRL' && paymentTransactionId) {
      const transaction = await base44.asServiceRole.entities.PaymentTransaction.filter({ 
        id: paymentTransactionId 
      });
      if (transaction.length > 0) {
        paymentUrl = transaction[0].payment_url;
      }
    }

    // Send notification to provider
    try {
      await base44.asServiceRole.functions.invoke('notification_create', {
        user_id: offer.provider_user_id,
        message: 'Você recebeu um novo contrato de serviço.',
        type: 'contract_created',
        related_entity_id: contract.id,
        action_url: `/mercado/servicos/contrato/${contract.id}`
      });
    } catch (e) {
      // Non-critical error
    }

    return Response.json({
      success: true,
      contract,
      payment_url: paymentUrl,
      payment_type: offer.price_type
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});