import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check if already seeded
    const existingDemo = await base44.asServiceRole.entities.MarketListing.filter({ is_demo: true });
    if (existingDemo.length > 0) {
      return Response.json({
        status: 'already_seeded',
        message: 'Dados de demonstração do CABAL ZIRON já foram criados.',
        existing_count: existingDemo.length
      });
    }

    const createdData = {
      item_offers: 0,
      alz_offers: 0,
      players: 0,
      guilds: 0
    };

    // Create demo seller users first
    const demoSellers = [
      { username: 'VendedorZiron', user_id: 'demo_seller_1' },
      { username: 'MercadorNevareth', user_id: 'demo_seller_2' },
      { username: 'TradeMasterBR', user_id: 'demo_seller_3' }
    ];

    // ==========================================
    // 1) CREATE 20 ITEM OFFERS
    // ==========================================
    const itemOffers = [
      // ARMAS (6)
      {
        seller_user_id: 'demo_seller_1',
        seller_username: 'VendedorZiron',
        type: 'ITEM',
        item_name: 'Espada de Titânio +12',
        item_description: 'Item de alto dano físico para Guerreiro. Perfeito para PvP e dungeons de alto nível.',
        quantity_units: 1,
        price_brl: 49.90,
        status: 'ACTIVE',
        seller_notes: 'Entrega imediata após pagamento',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_2',
        seller_username: 'MercadorNevareth',
        type: 'ITEM',
        item_name: 'Orbe Arcano Supremo +15',
        item_description: 'Orbe mágico supremo para Magos. Aumenta dano mágico em 35%.',
        quantity_units: 1,
        price_brl: 79.90,
        status: 'ACTIVE',
        seller_notes: 'Item raro, última unidade',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_3',
        seller_username: 'TradeMasterBR',
        type: 'ITEM',
        item_name: 'Katanas Gêmeas da Ruptura +13',
        item_description: 'Lâminas duplas para Espadachim. Combo devastador com +40% crítico.',
        quantity_units: 1,
        price_brl: 59.90,
        status: 'ACTIVE',
        seller_notes: 'Ideal para builds de crítico',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_1',
        seller_username: 'VendedorZiron',
        type: 'ITEM',
        item_name: 'Arco Celestial do Caçador +14',
        item_description: 'Arco lendário para Arqueiro Arcano. Aumenta range e precisão.',
        quantity_units: 1,
        price_brl: 69.90,
        status: 'ACTIVE',
        seller_notes: 'Entrega em até 30 minutos',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_2',
        seller_username: 'MercadorNevareth',
        type: 'ITEM',
        item_name: 'Canhões Gêmeos de Mithril +12',
        item_description: 'Arma poderosa para Atirador Arcano. DPS consistente.',
        quantity_units: 1,
        price_brl: 54.90,
        status: 'ACTIVE',
        seller_notes: 'Pronto para TG',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_3',
        seller_username: 'TradeMasterBR',
        type: 'ITEM',
        item_name: 'Espada Cristalina Arcana +15',
        item_description: 'Espada híbrida para Force Blader. Dano físico e mágico balanceado.',
        quantity_units: 1,
        price_brl: 89.90,
        status: 'ACTIVE',
        seller_notes: 'Item Premium, build completa',
        is_demo: true
      },
      
      // ARMADURAS (6)
      {
        seller_user_id: 'demo_seller_1',
        seller_username: 'VendedorZiron',
        type: 'ITEM',
        item_name: 'Armadura de Mithril do Guardião +10',
        item_description: 'Set completo para Force Shielder. Defesa +50%, HP +3000.',
        quantity_units: 1,
        price_brl: 39.90,
        status: 'ACTIVE',
        seller_notes: 'Ideal para tankar bosses',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_2',
        seller_username: 'MercadorNevareth',
        type: 'ITEM',
        item_name: 'Armadura Sombria do Assassino +11',
        item_description: 'Set para Espadachim. Evasão +30%, velocidade de ataque +25%.',
        quantity_units: 1,
        price_brl: 44.90,
        status: 'ACTIVE',
        seller_notes: 'Build PvP otimizada',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_3',
        seller_username: 'TradeMasterBR',
        type: 'ITEM',
        item_name: 'Túnica Arcana da Sabedoria +12',
        item_description: 'Túnica para Mago. MP +5000, cooldown -20%, resistência mágica.',
        quantity_units: 1,
        price_brl: 42.90,
        status: 'ACTIVE',
        seller_notes: 'Set completo de Mago',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_1',
        seller_username: 'VendedorZiron',
        type: 'ITEM',
        item_name: 'Armadura de Batalha de Titânio +13',
        item_description: 'Set pesado para Guerreiro. Defesa física +45%, STR +200.',
        quantity_units: 1,
        price_brl: 52.90,
        status: 'ACTIVE',
        seller_notes: 'Tank ou DPS viável',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_2',
        seller_username: 'MercadorNevareth',
        type: 'ITEM',
        item_name: 'Traje Cristalino do Atirador +11',
        item_description: 'Set leve para Force Gunner. DEX +250, crítico +20%.',
        quantity_units: 1,
        price_brl: 47.90,
        status: 'ACTIVE',
        seller_notes: 'Build ranged DPS',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_3',
        seller_username: 'TradeMasterBR',
        type: 'ITEM',
        item_name: 'Set Hybrid de Obsidiana +14',
        item_description: 'Armadura híbrida para Force Blader. INT +180, STR +180.',
        quantity_units: 1,
        price_brl: 64.90,
        status: 'ACTIVE',
        seller_notes: 'Build avançada FB',
        is_demo: true
      },

      // ACESSÓRIOS (4)
      {
        seller_user_id: 'demo_seller_1',
        seller_username: 'VendedorZiron',
        type: 'ITEM',
        item_name: 'Anel da Ruptura Cristalina',
        item_description: 'Anel raro. Crítico +15%, penetração +10%, HP +1500.',
        quantity_units: 1,
        price_brl: 29.90,
        status: 'ACTIVE',
        seller_notes: 'Slot único',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_2',
        seller_username: 'MercadorNevareth',
        type: 'ITEM',
        item_name: 'Colar do Vazio Arcano',
        item_description: 'Colar lendário. Resistência mágica +25%, MP regen +30%.',
        quantity_units: 1,
        price_brl: 34.90,
        status: 'ACTIVE',
        seller_notes: 'Perfeito para casters',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_3',
        seller_username: 'TradeMasterBR',
        type: 'ITEM',
        item_name: 'Brincos da Velocidade Eterna',
        item_description: 'Brincos épicos. Velocidade de movimento +20%, evasão +18%.',
        quantity_units: 1,
        price_brl: 27.90,
        status: 'ACTIVE',
        seller_notes: 'Ideal para kiting',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_1',
        seller_username: 'VendedorZiron',
        type: 'ITEM',
        item_name: 'Amuleto do Guardião de Nevareth',
        item_description: 'Amuleto raro. Defesa +30%, HP regen +40%, imunidade a stun 10%.',
        quantity_units: 1,
        price_brl: 38.90,
        status: 'ACTIVE',
        seller_notes: 'Essencial para PvP',
        is_demo: true
      },

      // MATERIAIS/CRISTAIS (4)
      {
        seller_user_id: 'demo_seller_2',
        seller_username: 'MercadorNevareth',
        type: 'ITEM',
        item_name: 'Cristais de Transcendência (x50)',
        item_description: 'Lote de 50 cristais para transcendência de skills até T5.',
        quantity_units: 50,
        price_brl: 19.90,
        status: 'ACTIVE',
        seller_notes: 'Preço por lote completo',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_3',
        seller_username: 'TradeMasterBR',
        type: 'ITEM',
        item_name: 'Fragmentos Cristalinos Supremos (x100)',
        item_description: 'Fragmentos usados para craft de itens épicos. 100 unidades.',
        quantity_units: 100,
        price_brl: 24.90,
        status: 'ACTIVE',
        seller_notes: 'Farm de 1 semana',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_1',
        seller_username: 'VendedorZiron',
        type: 'ITEM',
        item_name: 'Pedras de Upgrade +12 (x20)',
        item_description: 'Lote de 20 pedras para upgrade de equipamentos até +12.',
        quantity_units: 20,
        price_brl: 15.90,
        status: 'ACTIVE',
        seller_notes: 'Taxa de sucesso 70%',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_2',
        seller_username: 'MercadorNevareth',
        type: 'ITEM',
        item_name: 'Essências Arcanas Puras (x30)',
        item_description: 'Essências para craft de acessórios místicos. 30 unidades.',
        quantity_units: 30,
        price_brl: 21.90,
        status: 'ACTIVE',
        seller_notes: 'Difícil de farmar',
        is_demo: true
      }
    ];

    for (const offer of itemOffers) {
      await base44.asServiceRole.entities.MarketListing.create(offer);
      createdData.item_offers++;
    }

    // ==========================================
    // 2) CREATE 20 ALZ OFFERS
    // ==========================================
    const alzOffers = [
      {
        seller_user_id: 'demo_seller_1',
        seller_username: 'VendedorZiron',
        type: 'ALZ',
        item_name: 'Pacote de 50.000 ALZ',
        item_description: 'Entrega via correio do jogo em até 30 minutos após pagamento.',
        alz_amount: 50000,
        price_brl: 5.90,
        status: 'ACTIVE',
        seller_notes: 'Entrega rápida garantida',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_2',
        seller_username: 'MercadorNevareth',
        type: 'ALZ',
        item_name: 'Venda de 100.000 ALZ',
        item_description: 'Moeda do jogo entregue diretamente no seu personagem via correio.',
        alz_amount: 100000,
        price_brl: 10.90,
        status: 'ACTIVE',
        seller_notes: 'Vendedor verificado',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_3',
        seller_username: 'TradeMasterBR',
        type: 'ALZ',
        item_name: 'Pacote de 250.000 ALZ',
        item_description: 'Pacote intermediário de ALZ. Entrega em até 20 minutos.',
        alz_amount: 250000,
        price_brl: 24.90,
        status: 'ACTIVE',
        seller_notes: 'Melhor custo-benefício',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_1',
        seller_username: 'VendedorZiron',
        type: 'ALZ',
        item_name: 'Venda de 500.000 ALZ',
        item_description: 'Meio milhão de ALZ. Ideal para equipar seu personagem.',
        alz_amount: 500000,
        price_brl: 47.90,
        status: 'ACTIVE',
        seller_notes: 'Entrega imediata',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_2',
        seller_username: 'MercadorNevareth',
        type: 'ALZ',
        item_name: 'Pacote de 750.000 ALZ',
        item_description: 'Grande quantidade de ALZ para upgrade de equipamentos.',
        alz_amount: 750000,
        price_brl: 69.90,
        status: 'ACTIVE',
        seller_notes: 'Preço promocional',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_3',
        seller_username: 'TradeMasterBR',
        type: 'ALZ',
        item_name: 'Venda de 1.000.000 ALZ',
        item_description: '1 milhão de ALZ. Quantidade suficiente para builds completas.',
        alz_amount: 1000000,
        price_brl: 89.90,
        status: 'ACTIVE',
        seller_notes: 'Estoque limitado',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_1',
        seller_username: 'VendedorZiron',
        type: 'ALZ',
        item_name: 'Pacote Premium 1.500.000 ALZ',
        item_description: '1.5M ALZ. Perfeito para montar sets completos +15.',
        alz_amount: 1500000,
        price_brl: 129.90,
        status: 'ACTIVE',
        seller_notes: 'Oferta premium',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_2',
        seller_username: 'MercadorNevareth',
        type: 'ALZ',
        item_name: 'Venda de 2.000.000 ALZ',
        item_description: '2 milhões de ALZ. Quantidade para dominar o servidor.',
        alz_amount: 2000000,
        price_brl: 169.90,
        status: 'ACTIVE',
        seller_notes: 'Vendedor top rated',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_3',
        seller_username: 'TradeMasterBR',
        type: 'ALZ',
        item_name: 'Mega Pacote 3.000.000 ALZ',
        item_description: '3M ALZ. Para jogadores sérios que querem poder máximo.',
        alz_amount: 3000000,
        price_brl: 239.90,
        status: 'ACTIVE',
        seller_notes: 'Melhor negócio do servidor',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_1',
        seller_username: 'VendedorZiron',
        type: 'ALZ',
        item_name: 'Venda de 5.000.000 ALZ',
        item_description: '5 milhões de ALZ. Quantidade épica para builds lendárias.',
        alz_amount: 5000000,
        price_brl: 379.90,
        status: 'ACTIVE',
        seller_notes: 'Entrega parcelada disponível',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_2',
        seller_username: 'MercadorNevareth',
        type: 'ALZ',
        item_name: 'Pacote Iniciante 80.000 ALZ',
        item_description: 'Pacote para começar no servidor. Entrega rápida.',
        alz_amount: 80000,
        price_brl: 8.90,
        status: 'ACTIVE',
        seller_notes: 'Ideal para novatos',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_3',
        seller_username: 'TradeMasterBR',
        type: 'ALZ',
        item_name: 'Venda de 150.000 ALZ',
        item_description: 'ALZ para upgrade de equipamentos básicos.',
        alz_amount: 150000,
        price_brl: 14.90,
        status: 'ACTIVE',
        seller_notes: 'Entregas diárias',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_1',
        seller_username: 'VendedorZiron',
        type: 'ALZ',
        item_name: 'Pacote de 350.000 ALZ',
        item_description: 'Quantidade média para crafting e upgrades.',
        alz_amount: 350000,
        price_brl: 32.90,
        status: 'ACTIVE',
        seller_notes: 'Preço competitivo',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_2',
        seller_username: 'MercadorNevareth',
        type: 'ALZ',
        item_name: 'Venda de 600.000 ALZ',
        item_description: 'ALZ suficiente para montar um set épico.',
        alz_amount: 600000,
        price_brl: 54.90,
        status: 'ACTIVE',
        seller_notes: 'Entrega 24/7',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_3',
        seller_username: 'TradeMasterBR',
        type: 'ALZ',
        item_name: 'Pacote de 900.000 ALZ',
        item_description: 'Quase 1M de ALZ por preço promocional.',
        alz_amount: 900000,
        price_brl: 79.90,
        status: 'ACTIVE',
        seller_notes: 'Desconto especial',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_1',
        seller_username: 'VendedorZiron',
        type: 'ALZ',
        item_name: 'Venda de 1.250.000 ALZ',
        item_description: '1.25M ALZ. Para players intermediários avançados.',
        alz_amount: 1250000,
        price_brl: 109.90,
        status: 'ACTIVE',
        seller_notes: 'Vendedor confiável',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_2',
        seller_username: 'MercadorNevareth',
        type: 'ALZ',
        item_name: 'Pacote de 1.800.000 ALZ',
        item_description: 'Quase 2M de ALZ. Quantidade para dominar TG.',
        alz_amount: 1800000,
        price_brl: 154.90,
        status: 'ACTIVE',
        seller_notes: 'Estoque garantido',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_3',
        seller_username: 'TradeMasterBR',
        type: 'ALZ',
        item_name: 'Mega Pacote 4.000.000 ALZ',
        item_description: '4 milhões de ALZ. Para guildas e grupos.',
        alz_amount: 4000000,
        price_brl: 319.90,
        status: 'ACTIVE',
        seller_notes: 'Entrega parcelada ok',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_1',
        seller_username: 'VendedorZiron',
        type: 'ALZ',
        item_name: 'Pacote Supremo 7.000.000 ALZ',
        item_description: '7M ALZ. Quantidade lendária para domínio total.',
        alz_amount: 7000000,
        price_brl: 529.90,
        status: 'ACTIVE',
        seller_notes: 'VIP seller exclusive',
        is_demo: true
      },
      {
        seller_user_id: 'demo_seller_2',
        seller_username: 'MercadorNevareth',
        type: 'ALZ',
        item_name: 'Venda de 10.000.000 ALZ',
        item_description: '10 milhões de ALZ. Para os verdadeiros campeões de Nevareth.',
        alz_amount: 10000000,
        price_brl: 749.90,
        status: 'ACTIVE',
        seller_notes: 'Maior pacote disponível',
        is_demo: true
      }
    ];

    for (const offer of alzOffers) {
      await base44.asServiceRole.entities.MarketListing.create(offer);
      createdData.alz_offers++;
    }

    // ==========================================
    // 3) CREATE 5 GUILDS FIRST (needed for players)
    // ==========================================
    const guilds = [
      {
        name: 'Crystal Dominion',
        slug: 'crystal-dominion',
        leader_name: 'CrystalLord',
        faction: 'Capella',
        member_count: 78,
        season_points: 12500,
        total_points: 45000,
        recruiting: true,
        description: 'Guilda focada em TG e dungeons de alto nível. Presença diária obrigatória.',
        emblem_url: 'https://via.placeholder.com/64/19E0FF/FFFFFF?text=CD',
        wins: 45,
        losses: 12,
        is_demo: true
      },
      {
        name: 'Ziron Legacy',
        slug: 'ziron-legacy',
        leader_name: 'LegacyKing',
        faction: 'Procyon',
        member_count: 65,
        season_points: 11200,
        total_points: 38000,
        recruiting: true,
        description: 'Guilda veterana do servidor. Recrutamento ativo para jogadores experientes.',
        emblem_url: 'https://via.placeholder.com/64/F7CE46/FFFFFF?text=ZL',
        wins: 38,
        losses: 15,
        is_demo: true
      },
      {
        name: 'Aliança de Nevareth',
        slug: 'alianca-de-nevareth',
        leader_name: 'NevarethChief',
        faction: 'Capella',
        member_count: 52,
        season_points: 9800,
        total_points: 32000,
        recruiting: true,
        description: 'Guilda PvE focada em farm e progressão. Ambiente friendly.',
        emblem_url: 'https://via.placeholder.com/64/27AE60/FFFFFF?text=AN',
        wins: 32,
        losses: 18,
        is_demo: true
      },
      {
        name: 'TG Supremacy',
        slug: 'tg-supremacy',
        leader_name: 'TGMaster',
        faction: 'Procyon',
        member_count: 80,
        season_points: 13800,
        total_points: 52000,
        recruiting: false,
        description: 'Guilda hardcore focada em Territory War. Vagas limitadas apenas para top players.',
        emblem_url: 'https://via.placeholder.com/64/FF4B6A/FFFFFF?text=TS',
        wins: 52,
        losses: 8,
        is_demo: true
      },
      {
        name: 'Guardians of Rupture',
        slug: 'guardians-of-rupture',
        leader_name: 'RuptureGuard',
        faction: 'Capella',
        member_count: 43,
        season_points: 8500,
        total_points: 28000,
        recruiting: true,
        description: 'Guilda mista PvE/PvP. Aceitamos jogadores de todos os níveis.',
        emblem_url: 'https://via.placeholder.com/64/9B59B6/FFFFFF?text=GR',
        wins: 28,
        losses: 20,
        is_demo: true
      }
    ];

    for (const guild of guilds) {
      await base44.asServiceRole.entities.Guild.create(guild);
      createdData.guilds++;
    }

    // ==========================================
    // 4) CREATE 20 RANKING PLAYERS
    // ==========================================
    const guildNames = ['Crystal Dominion', 'Ziron Legacy', 'Aliança de Nevareth', 'TG Supremacy', 'Guardians of Rupture', null];
    const classes = ['WA', 'BL', 'WI', 'FA', 'FS', 'FB', 'FG'];
    
    const playerNames = [
      'ZironBerserker', 'CrystalBlade', 'TGWarlock', 'NevarethKing', 'RuptureSlayer',
      'DarkSorcerer', 'BladeStorm', 'ArcaneMaster', 'ShadowHunter', 'TitanGuard',
      'MysticArcher', 'VoidReaper', 'ChaosKnight', 'FrostMage', 'ThunderBlade',
      'PhoenixRider', 'DragonSlayer', 'EternalGuard', 'StormCaller', 'DemonHunter'
    ];

    let baseValue = 3500;
    for (let i = 0; i < 20; i++) {
      const player = {
        user_id: `demo_player_${i + 1}`,
        username: playerNames[i],
        guild_name: guildNames[Math.floor(Math.random() * guildNames.length)],
        class_code: classes[Math.floor(Math.random() * classes.length)],
        type: 'POWER',
        season_id: '2025_S1',
        position: i + 1,
        value: baseValue - (i * 85),
        is_demo: true
      };
      await base44.asServiceRole.entities.RankingEntry.create(player);
      createdData.players++;
    }

    return Response.json({
      status: 'success',
      message: 'Demo data successfully seeded for CABAL ZIRON',
      created: createdData,
      details: {
        marketplace_items: createdData.item_offers,
        marketplace_alz: createdData.alz_offers,
        ranking_players: createdData.players,
        guilds: createdData.guilds,
        total_records: createdData.item_offers + createdData.alz_offers + createdData.players + createdData.guilds
      }
    });

  } catch (error) {
    return Response.json({ 
      status: 'error',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});