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

    const { contract_id, action } = await req.json();

    if (!contract_id || !action) {
      return Response.json({
        success: false,
        error: 'Parâmetros inválidos.'
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
    const previousStatus = contract.status;
    let newStatus = previousStatus;
    let errorMsg = null;

    // Check permissions and validate transitions
    switch (action) {
      case 'MARK_IN_PROGRESS':
        if (user.id !== contract.provider_user_id) {
          errorMsg = 'Apenas o prestador pode marcar o serviço como em andamento.';
        } else if (previousStatus !== 'PAID') {
          errorMsg = 'Ação inválida para o status atual do contrato.';
        } else {
          newStatus = 'IN_PROGRESS';
        }
        break;

      case 'MARK_COMPLETED':
        if (user.id !== contract.buyer_user_id) {
          errorMsg = 'Apenas o comprador pode confirmar a conclusão do serviço.';
        } else if (previousStatus !== 'IN_PROGRESS') {
          errorMsg = 'Ação inválida para o status atual do contrato.';
        } else {
          newStatus = 'COMPLETED';
        }
        break;

      case 'OPEN_DISPUTE':
        if (user.id !== contract.buyer_user_id) {
          errorMsg = 'Apenas o comprador pode abrir uma disputa.';
        } else if (!['PAID', 'IN_PROGRESS'].includes(previousStatus)) {
          errorMsg = 'Não é possível abrir disputa neste status.';
        } else {
          newStatus = 'DISPUTE_OPEN';
        }
        break;

      case 'CANCEL':
        // Only admin or parties involved (under certain conditions)
        if (user.role !== 'admin' && ![contract.buyer_user_id, contract.provider_user_id].includes(user.id)) {
          errorMsg = 'Você não tem permissão para cancelar este contrato.';
        } else if (['COMPLETED', 'CANCELLED', 'DISPUTE_RESOLVED'].includes(previousStatus)) {
          errorMsg = 'Não é possível cancelar um contrato neste status.';
        } else {
          newStatus = 'CANCELLED';
        }
        break;

      case 'RESOLVE_DISPUTE':
        if (user.role !== 'admin') {
          errorMsg = 'Apenas administradores podem resolver disputas.';
        } else if (previousStatus !== 'DISPUTE_OPEN') {
          errorMsg = 'Não há disputa aberta para resolver.';
        } else {
          newStatus = 'DISPUTE_RESOLVED';
        }
        break;

      default:
        errorMsg = 'Ação desconhecida.';
    }

    if (errorMsg) {
      return Response.json({
        success: false,
        error: errorMsg
      }, { status: 400 });
    }

    // Update contract
    await base44.asServiceRole.entities.ServiceContract.update(contract_id, {
      status: newStatus
    });

    // Log status change
    await base44.asServiceRole.entities.ServiceContractLog.create({
      contract_id,
      actor_user_id: user.id,
      previous_status: previousStatus,
      new_status: newStatus,
      action_type: action,
      message: `${user.username || user.full_name} alterou o status de ${previousStatus} para ${newStatus}`
    });

    await base44.asServiceRole.entities.MarketAuditLog.create({
      action: 'SERVICE_CONTRACT_STATUS_UPDATED',
      user_id: user.id,
      username: user.username || user.full_name,
      metadata_json: JSON.stringify({
        contract_id,
        action,
        previous_status: previousStatus,
        new_status: newStatus
      })
    });

    // Send notifications
    try {
      const notificationMessages = {
        'IN_PROGRESS': 'Seu contrato foi atualizado para: Em Andamento',
        'COMPLETED': 'Seu contrato foi concluído com sucesso.',
        'CANCELLED': 'Seu contrato foi cancelado.',
        'DISPUTE_OPEN': 'Uma disputa foi aberta no seu contrato.'
      };

      const message = notificationMessages[newStatus] || 'Seu contrato foi atualizado.';

      // Notify buyer
      await base44.asServiceRole.functions.invoke('notification_create', {
        user_id: contract.buyer_user_id,
        message: message,
        type: 'contract_updated',
        related_entity_id: contract_id,
        action_url: `/mercado/servicos/contrato/${contract_id}`
      });

      // Notify provider
      await base44.asServiceRole.functions.invoke('notification_create', {
        user_id: contract.provider_user_id,
        message: message,
        type: 'contract_updated',
        related_entity_id: contract_id,
        action_url: `/mercado/servicos/contrato/${contract_id}`
      });
    } catch (e) {
      // Non-critical error
    }

    // If CASH payment and completed, deduct from buyer
    if (newStatus === 'COMPLETED' && contract.payment_type === 'CASH') {
      try {
        const offer = await base44.asServiceRole.entities.ServiceOffer.filter({ id: contract.offer_id });
        if (offer.length > 0 && offer[0].price_cash) {
          await base44.asServiceRole.functions.invoke('wallet_deductCash', {
            user_id: contract.buyer_user_id,
            amount: offer[0].price_cash,
            reason: `Pagamento de serviço: ${offer[0].title}`
          });

          // Add to provider
          await base44.asServiceRole.functions.invoke('wallet_addCash', {
            user_id: contract.provider_user_id,
            amount: offer[0].price_cash,
            reason: `Recebimento de serviço: ${offer[0].title}`
          });
        }
      } catch (e) {
        console.error('Erro ao processar CASH:', e);
      }
    }

    // Get updated contract
    const updatedContracts = await base44.asServiceRole.entities.ServiceContract.filter({ id: contract_id });

    return Response.json({
      success: true,
      contract: updatedContracts[0]
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});