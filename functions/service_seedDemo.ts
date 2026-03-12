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

    // Check if demo data already exists
    const existing = await base44.asServiceRole.entities.ServiceOffer.filter({ 
      title: 'Carry ICRH Completo com Garantia'
    });

    if (existing.length > 0) {
      return Response.json({
        success: true,
        message: 'Dados demo já existem'
      });
    }

    // Get all users
    const users = await base44.asServiceRole.entities.User.list();
    if (users.length === 0) {
      return Response.json({
        success: false,
        error: 'Nenhum usuário encontrado'
      }, { status: 404 });
    }

    const demoOffers = [
      {
        provider_user_id: users[0].id,
        title: 'Carry ICRH Completo com Garantia',
        description: 'Carry completo em Illusion Castle Radiant Hall. Garantia de pelo menos 1 item épico por run. Equipe experiente, runs rápidas em média 35 minutos.\n\nIncluído:\n- Carry completo da DG\n- Todos os drops são seus\n- Party experiente nível 200\n- Garantia de conclusão\n\nRequisitos:\n- Nível mínimo: 165\n- Estar online no horário combinado',
        category: 'DUNGEON_CARRY',
        dungeon_code: 'ICRH',
        min_level_required: 165,
        price_type: 'BRL',
        price_brl: 75.00,
        estimated_duration_minutes: 40,
        max_slots: 2,
        is_active: true,
        status: 'ACTIVE'
      },
      {
        provider_user_id: users[Math.min(1, users.length - 1)].id,
        title: 'Rush de Level 1 ao 150 em 1 Dia',
        description: 'Serviço de power leveling do level 1 ao 150 em aproximadamente 8-10 horas de jogo.\n\nO que está incluído:\n- Quests principais otimizadas\n- Farm em áreas high-exp\n- Equipamentos básicos fornecidos\n- Dicas de build e skills\n\nVocê precisará:\n- Estar disponível por 8-10h (pode ser dividido em 2 dias)\n- Seguir instruções do booster',
        category: 'LEVEL_RUSH',
        min_level_required: 1,
        price_type: 'BRL',
        price_brl: 120.00,
        estimated_duration_minutes: 600,
        max_slots: 1,
        is_active: true,
        status: 'ACTIVE'
      },
      {
        provider_user_id: users[0].id,
        title: 'Suporte TG - Healer ou Tank',
        description: 'Ofereço suporte em Territory War como Force Archer (heal) ou Force Shielder (tank).\n\nDetalhes:\n- Personagem lvl 200 full geared\n- Experiência em TG ranqueada\n- Comunicação por Discord\n- Foco em proteger os DPS da guild\n\nDisponível:\n- Segunda a Sexta: 20h às 21h\n- Sábado: 15h às 16h\n- Domingo: 21h às 22h',
        category: 'TG_SUPPORT',
        price_type: 'CASH',
        price_cash: 5000,
        estimated_duration_minutes: 60,
        max_slots: 1,
        is_active: true,
        status: 'ACTIVE'
      },
      {
        provider_user_id: users[Math.min(1, users.length - 1)].id,
        title: 'Crafting de Armas +15 Garantido',
        description: 'Serviço de craft de armas até +15 com garantia de sucesso.\n\nVocê fornece:\n- A arma base\n- Cores de upgrade necessários (quantidade será informada)\n- Taxa de serviço\n\nEu forneço:\n- Técnica de craft otimizada\n- Garantia de +15 (se falhar, tento de novo até conseguir)\n- Livestream do processo se desejar\n\nTempo estimado: 2-4 horas dependendo da sorte',
        category: 'CRAFTING',
        price_type: 'BRL',
        price_brl: 200.00,
        estimated_duration_minutes: 180,
        max_slots: 1,
        is_active: true,
        status: 'ACTIVE'
      },
      {
        provider_user_id: users[0].id,
        title: 'Ajuda em Quests de Alta Complexidade',
        description: 'Auxílio em quests difíceis, especialmente as de level 150+.\n\nAjudo com:\n- Quest de Transcendência\n- Quests de classe avançada\n- Quests épicas com boss fights\n- Explicação de mecânicas\n\nMétodo:\n- Party juntos\n- Explico cada passo\n- Ajudo a derrotar bosses difíceis',
        category: 'QUEST_HELP',
        price_type: 'CASH',
        price_cash: 2000,
        estimated_duration_minutes: 90,
        max_slots: 3,
        is_active: true,
        status: 'ACTIVE'
      },
      {
        provider_user_id: users[Math.min(2, users.length - 1)].id,
        title: 'Carry FT2 Speed Run',
        description: 'Forgotten Temple 2 em modo speedrun. Completamos em menos de 25 minutos garantido!\n\nBenefícios:\n- Run extremamente rápida\n- Todos os drops para você\n- Equipe top tier\n- Possibilidade de múltiplas runs no mesmo dia',
        category: 'DUNGEON_CARRY',
        dungeon_code: 'FT2',
        min_level_required: 140,
        price_type: 'CASH',
        price_cash: 3500,
        estimated_duration_minutes: 25,
        max_slots: 3,
        is_active: true,
        status: 'ACTIVE'
      },
      {
        provider_user_id: users[0].id,
        title: 'Farm de Alz Otimizado - 4 Horas',
        description: 'Ensino as melhores rotas e técnicas de farm de Alz. Em 4 horas você aprende tudo!\n\nVocê aprende:\n- Melhores spots por level\n- Técnicas de AOE farm\n- Gestão de inventário\n- Rotas otimizadas\n\nGarantia de aprender a farmar 50M+ Alz por dia',
        category: 'OTHER',
        price_type: 'BRL',
        price_brl: 45.00,
        estimated_duration_minutes: 240,
        max_slots: 5,
        is_active: true,
        status: 'ACTIVE'
      },
      {
        provider_user_id: users[Math.min(1, users.length - 1)].id,
        title: 'Consultoria de Build Personalizada',
        description: 'Análise completa do seu personagem e criação de build otimizada.\n\nIncluído:\n- Análise de stats atuais\n- Sugestão de equipamentos\n- Skill rotation otimizada\n- Guia de progressão\n- Suporte por 7 dias após consultoria',
        category: 'OTHER',
        price_type: 'BRL',
        price_brl: 35.00,
        estimated_duration_minutes: 120,
        max_slots: 1,
        is_active: true,
        status: 'ACTIVE'
      },
      {
        provider_user_id: users[Math.min(2, users.length - 1)].id,
        title: 'Carry Lakeside com Boss Kill',
        description: 'Carry completo de Lake in Dusk incluindo kill do boss final.\n\nDetalhes:\n- Boss final garantido\n- Chance de drops épicos\n- Experiência em mecânicas de boss\n- Party coordenada\n\nTempo médio: 35-40 minutos',
        category: 'DUNGEON_CARRY',
        dungeon_code: 'LAKESIDE',
        min_level_required: 140,
        price_type: 'BRL',
        price_brl: 65.00,
        estimated_duration_minutes: 40,
        max_slots: 2,
        is_active: true,
        status: 'ACTIVE'
      },
      {
        provider_user_id: users[0].id,
        title: 'Treinamento PvP Intensivo',
        description: 'Sessão intensiva de treinamento PvP com jogador ranqueado.\n\nVocê aprende:\n- Combos da sua classe\n- Quando usar cada skill\n- Posicionamento\n- Leitura do oponente\n- Duelos práticos com feedback\n\n3 horas de treino focado',
        category: 'OTHER',
        price_type: 'CASH',
        price_cash: 4500,
        estimated_duration_minutes: 180,
        max_slots: 2,
        is_active: true,
        status: 'ACTIVE'
      },
      {
        provider_user_id: users[Math.min(1, users.length - 1)].id,
        title: 'Serviço de Transmutação Premium',
        description: 'Transmutação de equipamentos com técnica avançada para maximizar resultados.\n\nServiço:\n- Uso de horários favoráveis\n- Técnica de timing otimizado\n- Tentativas múltiplas até resultado satisfatório\n- Materiais por sua conta',
        category: 'CRAFTING',
        price_type: 'BRL',
        price_brl: 85.00,
        estimated_duration_minutes: 90,
        max_slots: 1,
        is_active: true,
        status: 'ACTIVE'
      },
      {
        provider_user_id: users[Math.min(2, users.length - 1)].id,
        title: 'Acompanhamento War de Guild',
        description: 'Participo da Guild War ao lado da sua guild como mercenário experiente.\n\nOfereço:\n- Personagem level 200 full equip\n- Comunicação estratégica\n- Foco em objetivos\n- Experiência em wars ranqueadas',
        category: 'TG_SUPPORT',
        price_type: 'CASH',
        price_cash: 8000,
        estimated_duration_minutes: 120,
        max_slots: 1,
        is_active: true,
        status: 'ACTIVE'
      },
      {
        provider_user_id: users[0].id,
        title: 'Farming de Materiais Raros',
        description: 'Farm focado em materiais raros para craft. Você me diz o que precisa, eu farmo!\n\nMateriais disponíveis:\n- Essências elementais\n- Fragmentos de boss\n- Materiais de craft chaos\n- Quest items raros\n\nPreço varia por material',
        category: 'OTHER',
        price_type: 'BRL',
        price_brl: 95.00,
        estimated_duration_minutes: 300,
        max_slots: 1,
        is_active: true,
        status: 'ACTIVE'
      },
      {
        provider_user_id: users[Math.min(1, users.length - 1)].id,
        title: 'Montagem de Set Completo',
        description: 'Ajudo você a montar seu set completo ideal para seu level e classe.\n\nIncluído:\n- Análise de opções disponíveis\n- Farm dos itens necessários\n- Upgrade até +9\n- Slot de itens básicos\n- Dicas de manutenção',
        category: 'OTHER',
        price_type: 'BRL',
        price_brl: 150.00,
        estimated_duration_minutes: 420,
        max_slots: 1,
        is_active: true,
        status: 'ACTIVE'
      },
      {
        provider_user_id: users[Math.min(2, users.length - 1)].id,
        title: 'Carry Altar of Siena B1F',
        description: 'Carry premium no Altar of Siena primeiro andar. DG de alta dificuldade!\n\nRequisitos rigorosos:\n- Level 180+\n- Set decente\n- Seguir instruções\n\nGarantia:\n- Conclusão da DG\n- Drops para você\n- Aprendizado de mecânicas',
        category: 'DUNGEON_CARRY',
        dungeon_code: 'ASIENA',
        min_level_required: 180,
        price_type: 'BRL',
        price_brl: 120.00,
        estimated_duration_minutes: 60,
        max_slots: 1,
        is_active: true,
        status: 'ACTIVE'
      },
      {
        provider_user_id: users[0].id,
        title: 'Coach de Progression Endgame',
        description: 'Mentoria completa para progressão no endgame.\n\nTópicos cobertos:\n- Daily routine otimizada\n- Priorização de upgrades\n- Gestão de recursos\n- Meta de gear\n- Roadmap personalizado\n\nSessão de 2 horas + follow-up',
        category: 'OTHER',
        price_type: 'BRL',
        price_brl: 80.00,
        estimated_duration_minutes: 120,
        max_slots: 2,
        is_active: true,
        status: 'ACTIVE'
      },
      {
        provider_user_id: users[Math.min(1, users.length - 1)].id,
        title: 'Rush 150-180 Express',
        description: 'Power leveling expresso do 150 ao 180. Ideal para quem já conhece o jogo.\n\nMétodo:\n- Quests de alto XP\n- Grinding em spots premium\n- Buffs de XP otimizados\n\nTempo estimado: 12-15 horas',
        category: 'LEVEL_RUSH',
        min_level_required: 150,
        price_type: 'BRL',
        price_brl: 180.00,
        estimated_duration_minutes: 750,
        max_slots: 1,
        is_active: true,
        status: 'ACTIVE'
      },
      {
        provider_user_id: users[Math.min(2, users.length - 1)].id,
        title: 'Enchant de Equipamentos +20',
        description: 'Serviço especializado de enchant até +20 com técnica secreta.\n\nCondições:\n- Equipamento já em +15\n- Materiais fornecidos por você\n- Garantia de tentativas até +18\n- +19 e +20 sem garantia mas com desconto\n\nTaxa de sucesso histórica: 68%',
        category: 'CRAFTING',
        price_type: 'BRL',
        price_brl: 350.00,
        estimated_duration_minutes: 240,
        max_slots: 1,
        is_active: true,
        status: 'ACTIVE'
      },
      {
        provider_user_id: users[0].id,
        title: 'Ajuda Completa Quest Transcendência',
        description: 'Acompanhamento total na quest de transcendência mais difícil do jogo.\n\nAjudo em:\n- Todas as etapas\n- Boss fights complicados\n- Coleta de materiais\n- Explicação de mecânicas\n- Suporte durante toda quest',
        category: 'QUEST_HELP',
        price_type: 'CASH',
        price_cash: 6500,
        estimated_duration_minutes: 180,
        max_slots: 1,
        is_active: true,
        status: 'ACTIVE'
      },
      {
        provider_user_id: users[Math.min(1, users.length - 1)].id,
        title: 'Otimização de Renda Passiva',
        description: 'Consultoria para criar renda passiva no jogo através de estratégias inteligentes.\n\nEnsino:\n- Investimentos em itens\n- Timing de mercado\n- Crafting lucrativo\n- Arbitragem de preços\n- Gestão de loja\n\nPague uma vez, lucre sempre!',
        category: 'OTHER',
        price_type: 'BRL',
        price_brl: 70.00,
        estimated_duration_minutes: 150,
        max_slots: 3,
        is_active: true,
        status: 'ACTIVE'
      }
    ];

    const createdOffers = [];
    for (const offerData of demoOffers) {
      const offer = await base44.asServiceRole.entities.ServiceOffer.create(offerData);
      createdOffers.push(offer);
    }

    return Response.json({
      success: true,
      message: `${createdOffers.length} ofertas de serviço demo criadas com sucesso`,
      offers: createdOffers
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});