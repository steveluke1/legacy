import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({
        success: false,
        error: 'Apenas administradores podem executar simulações.'
      }, { status: 403 });
    }

    const { activity_count = 50 } = await req.json();

    const activityLog = {
      logins: 0,
      contracts: 0,
      missions: 0,
      notifications: 0
    };

    // Get all users (limit to first 20 for simulation to avoid timeouts)
    const users = await base44.asServiceRole.entities.User.list(null, 20);
    
    if (users.length === 0) {
      return Response.json({
        success: false,
        error: 'Nenhum usuário encontrado para simular atividade.'
      }, { status: 404 });
    }

    // Simulate login events (reduced for performance)
    const loginCount = Math.min(10, users.length);
    for (let i = 0; i < loginCount; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      await base44.asServiceRole.entities.LoginLog.create({
        user_id: randomUser.id,
        username: randomUser.username || randomUser.full_name,
        ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (Simulation)',
        result: 'SUCCESS'
      });
      
      activityLog.logins++;
    }

    // Simulate service contracts (reduced for performance)
    const contractCount = Math.min(5, Math.floor(users.length / 2));
    const offers = await base44.asServiceRole.entities.ServiceOffer.filter({ is_active: true }, null, 10);
    
    if (offers.length > 0) {
      for (let i = 0; i < contractCount; i++) {
        const buyer = users[Math.floor(Math.random() * users.length)];
        const offer = offers[Math.floor(Math.random() * offers.length)];
        
        // Ensure buyer is not provider
        if (buyer.id === offer.provider_user_id) continue;

        const contract = await base44.asServiceRole.entities.ServiceContract.create({
          offer_id: offer.id,
          buyer_user_id: buyer.id,
          provider_user_id: offer.provider_user_id,
          status: 'PAID',
          payment_type: Math.random() > 0.5 ? 'BRL' : 'CASH',
          notes_from_buyer: 'Simulação de contrato'
        });

        activityLog.contracts++;

        // Create notification
        await base44.asServiceRole.functions.invoke('notification_create', {
          user_id: offer.provider_user_id,
          message: 'Você recebeu um novo contrato de serviço.',
          type: 'contract_created',
          related_entity_id: contract.id
        });

        activityLog.notifications++;
      }
    }

    // Simulate mission completions (reduced for performance)
    const missionCount = Math.min(10, users.length);
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < missionCount; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      // Get user's missions
      const missions = await base44.asServiceRole.entities.DailyMission.filter({
        user_id: randomUser.id,
        date: today,
        completed: false
      });

      if (missions.length > 0) {
        const mission = missions[0];
        
        // Complete mission
        await base44.asServiceRole.entities.DailyMission.update(mission.id, {
          completed: true,
          completed_at: new Date().toISOString()
        });

        // Update user XP
        const userAccounts = await base44.asServiceRole.entities.UserAccount.filter({ user_id: randomUser.id });
        if (userAccounts.length > 0) {
          const account = userAccounts[0];
          const newExp = (account.exp || 0) + (mission.exp_reward || 50);
          const newCrystals = (account.crystal_fragments || 0) + (mission.crystal_reward || 5);
          
          await base44.asServiceRole.entities.UserAccount.update(account.id, {
            exp: newExp,
            crystal_fragments: newCrystals
          });
        }

        activityLog.missions++;
      }
    }

    return Response.json({
      success: true,
      message: 'Atividade simulada com sucesso',
      activity_log: activityLog
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});