// Dados completos dos 3 planos Premium
// Premium 3 é o plano COMPLETO com todos os valores máximos

export const premiumPlans = [
  {
    key: 'PREMIUM_1',
    name: 'Premium 1',
    badge: null,
    description: 'Entre no mundo Premium com benefícios essenciais.',
    price_brl: '19.90',
    price_cash: 6600,
    
    // ITENS PREMIUM (30 DIAS - LIGADOS À CONTA)
    items_30dias: [
      'Cartão Remoto - Yul (Lig. a Conta)',
      'Cartão Remoto - Chloe (Lig. a Conta)',
      'Cartão de Loja do Agente Remoto (Lig.a Conta)',
      'Cartão de Loja Remota - Tempo Limitado (Lig.a Conta)',
      'Cartão de Armazém Remoto (Lig.a Conta)',
      'Poção de HP Inesgotável (Lv.4) (Lig.a Conta)',
      'Sócio Especial da Yekaterina (Lig.a Conta)',
      'Benção do GM (Nv. 5) Água Sagrada x50 (Lig.a Conta)',
      'Pérola Abençoada - Armazém Quarta Aba (Lig.a Conta)'
    ],
    
    // ITENS GANHOS - PERÍODO 7 DIAS
    items_7dias: [
      'Pérola Abençoada - EXP 10000% (Tempo de uso: 7 dias)'
    ],
    
    // ITENS GANHOS - PERMANENTES
    items_permanentes: [
      'Água Sagrada Extrema 127x',
      'Água Sagrada Heroica 127x',
      'Poção de Perfurar 127x / 100 de perfuração 3º Slot'
    ],
    
    // RECURSOS
    recursos: [
      'Macro de Bm3',
      'Buffs das classes ao relogar'
    ],
    
    // STATUS (BÔNUS DE EFEITO) - VALORES REDUZIDOS
    status: {
      expandir_inventario: '2 Item',
      bonus_exp: '1000%',
      aumento_taxa_drop: '15%',
      bonus_wexp: '25%',
      bonus_pet_exp: '100%',
      expandir_armazem: '1 Item',
      gps_teletransporte: 'Sim',
      bonus_slot_loja_agente: '4 Item',
      aumentar_quantidade_registro: '25 Item',
      axp_bonus: '75%',
      aumento_t_point: '25%',
      aumento_slot_pedido_criacao: '1 Item',
      taxa_drop_caixa: '10%',
      recompensa_exclusiva_dungeon: 'Sim',
      tempo_dungeon_aumentado: '+20%'
    },
    
    // BENEFÍCIOS EXTRAS
    sorteios_mensais: false,
    descontos_loja: false,
    destaque_rankings: false
  },
  
  {
    key: 'PREMIUM_2',
    name: 'Premium 2',
    badge: 'MAIS VANTAJOSO',
    description: 'O equilíbrio perfeito entre custo e benefício.',
    price_brl: '39.90',
    price_cash: 13200,
    
    // ITENS PREMIUM (30 DIAS - LIGADOS À CONTA) - MESMOS DO PREMIUM 1 E 3
    items_30dias: [
      'Cartão Remoto - Yul (Lig. a Conta)',
      'Cartão Remoto - Chloe (Lig. a Conta)',
      'Cartão de Loja do Agente Remoto (Lig.a Conta)',
      'Cartão de Loja Remota - Tempo Limitado (Lig.a Conta)',
      'Cartão de Armazém Remoto (Lig.a Conta)',
      'Poção de HP Inesgotável (Lv.4) (Lig.a Conta)',
      'Sócio Especial da Yekaterina (Lig.a Conta)',
      'Benção do GM (Nv. 5) Água Sagrada x50 (Lig.a Conta)',
      'Pérola Abençoada - Armazém Quarta Aba (Lig.a Conta)'
    ],
    
    items_7dias: [
      'Pérola Abençoada - EXP 10000% (Tempo de uso: 7 dias)'
    ],
    
    items_permanentes: [
      'Água Sagrada Extrema 127x',
      'Água Sagrada Heroica 127x',
      'Poção de Perfurar 127x / 100 de perfuração 3º Slot'
    ],
    
    recursos: [
      'Macro de Bm3',
      'Buffs das classes ao relogar'
    ],
    
    // STATUS (BÔNUS DE EFEITO) - VALORES INTERMEDIÁRIOS
    status: {
      expandir_inventario: '3 Item',
      bonus_exp: '2500%',
      aumento_taxa_drop: '35%',
      bonus_wexp: '50%',
      bonus_pet_exp: '250%',
      expandir_armazem: '1 Item',
      gps_teletransporte: 'Sim',
      bonus_slot_loja_agente: '8 Item',
      aumentar_quantidade_registro: '40 Item',
      axp_bonus: '150%',
      aumento_t_point: '50%',
      aumento_slot_pedido_criacao: '2 Item',
      taxa_drop_caixa: '25%',
      recompensa_exclusiva_dungeon: 'Sim',
      tempo_dungeon_aumentado: '+50%'
    },
    
    sorteios_mensais: false,
    descontos_loja: true,
    descontos_loja_percentual: '5%',
    destaque_rankings: true
  },
  
  {
    key: 'PREMIUM_3',
    name: 'Premium 3 (Completo)',
    badge: 'MÁXIMA VANTAGEM',
    description: 'A experiência Premium completa, sem limitações.',
    price_brl: '99.90',
    price_cash: 33000,
    
    // ITENS PREMIUM (30 DIAS - LIGADOS À CONTA) - VALORES COMPLETOS
    items_30dias: [
      'Cartão Remoto - Yul (Lig. a Conta)',
      'Cartão Remoto - Chloe (Lig. a Conta)',
      'Cartão de Loja do Agente Remoto (Lig.a Conta)',
      'Cartão de Loja Remota - Tempo Limitado (Lig.a Conta)',
      'Cartão de Armazém Remoto (Lig.a Conta)',
      'Poção de HP Inesgotável (Lv.4) (Lig.a Conta)',
      'Sócio Especial da Yekaterina (Lig.a Conta)',
      'Benção do GM (Nv. 5) Água Sagrada x50 (Lig.a Conta)',
      'Pérola Abençoada - Armazém Quarta Aba (Lig.a Conta)'
    ],
    
    items_7dias: [
      'Pérola Abençoada - EXP 10000% (Tempo de uso: 7 dias)'
    ],
    
    items_permanentes: [
      'Água Sagrada Extrema 127x',
      'Água Sagrada Heroica 127x',
      'Poção de Perfurar 127x / 100 de perfuração 3º Slot'
    ],
    
    recursos: [
      'Macro de Bm3',
      'Buffs das classes ao relogar'
    ],
    
    // STATUS (BÔNUS DE EFEITO) - VALORES MÁXIMOS (REFERÊNCIA COMPLETA)
    status: {
      expandir_inventario: '4 Item',
      bonus_exp: '5000%',
      aumento_taxa_drop: '70%',
      bonus_wexp: '100%',
      bonus_pet_exp: '500%',
      expandir_armazem: '1 Item',
      gps_teletransporte: 'Sim',
      bonus_slot_loja_agente: '12 Item',
      aumentar_quantidade_registro: '65 Item',
      axp_bonus: '300%',
      aumento_t_point: '100%',
      aumento_slot_pedido_criacao: '3 Item',
      taxa_drop_caixa: '50%',
      recompensa_exclusiva_dungeon: 'Sim',
      tempo_dungeon_aumentado: '+100%'
    },
    
    sorteios_mensais: true,
    descontos_loja: true,
    descontos_loja_percentual: '10%',
    destaque_rankings: true,
    destaque_rankings_icon: true // Ícone de coroa
  }
];

// Dados para a tabela de comparação detalhada
export const comparisonTableRows = [
  {
    category: 'Bônus de Progressão',
    rows: [
      { label: 'Bônus EXP', p1: '1000%', p2: '2500%', p3: '5000%' },
      { label: 'Aumento da Taxa de Drop', p1: '15%', p2: '35%', p3: '70%' },
      { label: 'Bônus WEXP', p1: '25%', p2: '50%', p3: '100%' },
      { label: 'Bônus de Pet EXP', p1: '100%', p2: '250%', p3: '500%' },
      { label: 'AXP Bônus', p1: '75%', p2: '150%', p3: '300%' },
      { label: 'Aumento de T-Point', p1: '25%', p2: '50%', p3: '100%' }
    ]
  },
  {
    category: 'Capacidade e Slots',
    rows: [
      { label: 'Expandir Inventário', p1: '2 Item', p2: '3 Item', p3: '4 Item' },
      { label: 'Expandir Armazém Pessoal', p1: '1 Item', p2: '1 Item', p3: '1 Item' },
      { label: 'Bônus Slot Loja do Agente', p1: '4 Item', p2: '8 Item', p3: '12 Item' },
      { label: 'Aumentar Quantidade de Registro', p1: '25 Item', p2: '40 Item', p3: '65 Item' },
      { label: 'Aumento de Slot de Pedido de Criação', p1: '1 Item', p2: '2 Item', p3: '3 Item' }
    ]
  },
  {
    category: 'Dungeons e Recompensas',
    rows: [
      { label: 'Taxa de Drop de Caixa Aumentada', p1: '10%', p2: '25%', p3: '50%' },
      { label: 'Recompensa Exclusiva Premium de Calabouço', p1: 'Sim', p2: 'Sim', p3: 'Sim' },
      { label: 'Tempo de Calabouço Aumentado', p1: '+20%', p2: '+50%', p3: '+100%' }
    ]
  },
  {
    category: 'Benefícios Especiais',
    rows: [
      { label: 'Sorteios mensais exclusivos', p1: 'Não', p2: 'Não', p3: 'Sim' },
      { label: 'Descontos na loja', p1: 'Não', p2: '5%', p3: '10%' },
      { label: 'Destaque em rankings', p1: 'Não', p2: 'Sim', p3: 'crown' } // 'crown' = ícone especial
    ]
  }
];