import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({
        success: false,
        error: 'Apenas administradores podem executar esta função.'
      }, { status: 403 });
    }

    // Get all users
    const users = await base44.asServiceRole.entities.User.list();
    if (users.length === 0) {
      return Response.json({
        success: false,
        error: 'Nenhum usuário encontrado'
      }, { status: 404 });
    }

    const notifications = [];

    // Create notifications for each user
    for (const targetUser of users) {
      const userNotifications = [
        {
          user_id: targetUser.id,
          message: 'Bem-vindo ao CABAL ZIRON! Complete suas missões diárias para ganhar recompensas.',
          type: 'system',
          action_url: '/painel'
        },
        {
          user_id: targetUser.id,
          message: 'Novo evento de TG está acontecendo AGORA! Junte-se à batalha e ganhe pontos de honra.',
          type: 'system',
          action_url: '/tg-ao-vivo'
        },
        {
          user_id: targetUser.id,
          message: 'Sua guild subiu de nível! Novos benefícios foram desbloqueados.',
          type: 'system'
        },
        {
          user_id: targetUser.id,
          message: 'Você foi mencionado no ranking semanal! Confira sua posição e recompensas.',
          type: 'system',
          action_url: '/ranking-corredores'
        },
        {
          user_id: targetUser.id,
          message: 'Novo pacote Premium disponível na loja com 30% de desconto por tempo limitado!',
          type: 'system',
          action_url: '/loja'
        },
        {
          user_id: targetUser.id,
          message: 'Alguém enviou uma solicitação de serviço para você no Mercado.',
          type: 'contract_created',
          action_url: '/mercado/servicos/contratos'
        },
        {
          user_id: targetUser.id,
          message: 'Seu anúncio no Mercado recebeu um novo interessado.',
          type: 'system',
          action_url: '/mercado/minhas-ofertas'
        },
        {
          user_id: targetUser.id,
          message: 'Você recebeu uma avaliação 5 estrelas no seu último serviço prestado!',
          type: 'contract_rated'
        },
        {
          user_id: targetUser.id,
          message: 'Sua transferência de 50.000 CASH foi concluída com sucesso.',
          type: 'system',
          action_url: '/minha-conta/transferencias'
        },
        {
          user_id: targetUser.id,
          message: 'Novo artigo na Wiki: "Guia Completo de Territory War". Não perca!',
          type: 'system',
          action_url: '/wiki'
        }
      ];

      notifications.push(...userNotifications);
    }

    // Create all notifications
    const created = [];
    for (const notif of notifications) {
      const notification = await base44.asServiceRole.entities.Notification.create(notif);
      created.push(notification);
    }

    return Response.json({
      success: true,
      message: `${created.length} notificações demo criadas com sucesso`,
      count: created.length
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});