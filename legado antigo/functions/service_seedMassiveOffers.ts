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

    const { count = 200 } = await req.json();

    // Check if already seeded
    const existing = await base44.asServiceRole.entities.ServiceOffer.list(null, 50);
    if (existing.length >= 50) {
      return Response.json({
        success: true,
        message: 'Ofertas massivas já existem',
        offers_count: existing.length
      });
    }

    // Get users to be providers
    const users = await base44.asServiceRole.entities.User.list(null, 50);
    if (users.length === 0) {
      return Response.json({
        success: false,
        error: 'Nenhum usuário encontrado.'
      }, { status: 404 });
    }

    const categories = ['DUNGEON_CARRY', 'LEVEL_RUSH', 'TG_SUPPORT', 'CRAFTING', 'QUEST_HELP', 'OTHER'];
    const dungeonCodes = ['ICRH', 'FT2', 'LAKESIDE', 'PANIC_CAVE', 'ALTAR_SIENA', 'CHAOS_ARENA'];
    
    const serviceTitles = {
      'DUNGEON_CARRY': [
        'Carry ICRH Completo',
        'Carry FT2 Rápido',
        'Lakeside Full Clear',
        'Panic Cave Speed Run',
        'Altar Siena Garantido'
      ],
      'LEVEL_RUSH': [
        'Rush 1 ao 150 em 1 Dia',
        'Power Level 100-180',
        'Level Express 1-200',
        'Rush de Nível Rápido'
      ],
      'TG_SUPPORT': [
        'Suporte TG - Healer',
        'Suporte TG - Tank',
        'DPS para TG',
        'Comandante TG Experiente'
      ],
      'CRAFTING': [
        'Craft +15 Garantido',
        'Upgrade de Armas',
        'Craft de Armadura',
        'Slot de Runas'
      ],
      'QUEST_HELP': [
        'Ajuda Quest Transcendência',
        'Quest de Classe Avançada',
        'Ajuda Boss Fight',
        'Quest Épica Completa'
      ],
      'OTHER': [
        'Consultoria de Build',
        'Farm de Materiais',
        'Treinamento PvP',
        'Guia Personalizado'
      ]
    };

    const offers = [];
    
    for (let i = 0; i < Math.min(count, users.length * 10); i++) {
      const provider = users[i % users.length];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const titles = serviceTitles[category];
      const title = titles[Math.floor(Math.random() * titles.length)] + ` #${i + 1}`;
      
      const paymentType = Math.random() > 0.5 ? 'BRL' : 'CASH';
      const priceBRL = paymentType === 'BRL' ? Math.floor(Math.random() * 150) + 50 : null;
      const priceCash = paymentType === 'CASH' ? Math.floor(Math.random() * 8000) + 2000 : null;

      const offerData = {
        provider_user_id: provider.id,
        title: title,
        description: `Serviço de alta qualidade. Experiência comprovada. Entre em contato para mais detalhes.`,
        category: category,
        dungeon_code: category === 'DUNGEON_CARRY' ? dungeonCodes[Math.floor(Math.random() * dungeonCodes.length)] : null,
        min_level_required: Math.floor(Math.random() * 100) + 100,
        price_type: paymentType,
        price_brl: priceBRL,
        price_cash: priceCash,
        estimated_duration_minutes: Math.floor(Math.random() * 180) + 30,
        max_slots: Math.floor(Math.random() * 3) + 1,
        is_active: true,
        status: 'ACTIVE'
      };

      const offer = await base44.asServiceRole.entities.ServiceOffer.create(offerData);
      offers.push(offer);

      // Delay every 20 offers
      if (i % 20 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return Response.json({
      success: true,
      message: `${offers.length} ofertas de serviço criadas com sucesso`,
      offers_created: offers.length
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});