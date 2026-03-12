import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const VIP_PLANS = [
  {
    key: 'VIP_SIMPLE',
    name: 'VIP Cristal',
    description: 'Plano básico com benefícios essenciais para começar',
    duration_days: 30,
    price_brl: 35,
    price_cash: 3000,
    benefits: {
      items_30d: [
        'Cartão de Loja do Agente Remoto (30 dias)',
        'Cartão de Loja Remota - Tempo Limitado (30 dias)',
        'Cartão de Armazém Remoto (30 dias)',
        'Poção de HP Inesgotável (Lv.4) (30 dias)'
      ],
      status: [
        'Bônus EXP 500%',
        'Aumento da Taxa de Drop 70%',
        'Bônus WEXP 100%',
        'Bônus de Pet EXP 500%',
        'AXP Bônus 300%',
        'Taxa de Drop de Caixa Aumentada 50%'
      ],
      outros: [
        'Expandir Inventário 4 Item',
        'Expandir Armazém Pessoal 1 Item',
        'GPS de teletransporte'
      ]
    }
  },
  {
    key: 'VIP_MEDIUM',
    name: 'VIP Platina Ziron',
    description: 'Plano intermediário com recursos avançados e itens permanentes',
    duration_days: 30,
    price_brl: 60,
    price_cash: 6000,
    benefits: {
      items_30d: [
        'Cartão de Loja do Agente Remoto (30 dias)',
        'Cartão de Loja Remota - Tempo Limitado (30 dias)',
        'Cartão de Armazém Remoto (30 dias)',
        'Poção de HP Inesgotável (Lv.4) (30 dias)',
        'Poção de MP Inesgotável (Lv.4) (30 dias)',
        'Cartão Remoto - Yul (30 dias)',
        'Cartão Remoto - Chloe (30 dias)',
        'Sócio Especial da Yekaterina (30 dias)',
        'Benção do GM (Nv. 5) Água Sagrada x50 (30 dias)',
        'Pérola Abençoada - Armazém Quarta Aba (30 dias)'
      ],
      items_permanentes: [
        'Água Sagrada Extrema 127x (Permanente)',
        'Água Sagrada Heroica 127x (Permanente)',
        'Poção de Perfurar 127x / 100 de perfuração 3º Slot (Permanente)'
      ],
      recursos: [
        'Macro de BM3',
        'Buffs das classes ao relogar'
      ],
      status: [
        'Bônus EXP 500%',
        'Aumento da Taxa de Drop 70%',
        'Bônus WEXP 100%',
        'Bônus de Pet EXP 500%',
        'AXP Bônus 300%',
        'Taxa de Drop de Caixa Aumentada 50%'
      ],
      outros: [
        'Expandir Inventário 4 Item',
        'Expandir Armazém Pessoal 1 Item',
        'GPS de teletransporte',
        'Bônus Slot Loja do Agente 12 Item',
        'Aumentar Quantidade de Registro 65 Item',
        'Aumento de Slot de Pedido de Criação 3 Item',
        'Recompensa Exclusiva Premium de Calabouço',
        'Tempo de Calabouço Aumentado'
      ]
    }
  },
  {
    key: 'VIP_COMPLETE',
    name: 'VIP Myth Ziron',
    description: 'Plano completo com todos os benefícios e acesso a canais premium',
    duration_days: 30,
    price_brl: 90,
    price_cash: 8000,
    benefits: {
      items_30d: [
        'Cartão Remoto - Yul (30 dias)',
        'Cartão Remoto - Chloe (30 dias)',
        'Cartão de Loja do Agente Remoto (30 dias)',
        'Cartão de Loja Remota - Tempo Limitado (30 dias)',
        'Cartão de Armazém Remoto (30 dias)',
        'Poção de HP Inesgotável (Lv.4) (30 dias)',
        'Poção de MP Inesgotável (Lv.4) (30 dias)',
        'Sócio Especial da Yekaterina (30 dias)',
        'Benção do GM (Nv. 5) Água Sagrada x50 (30 dias)',
        'Pérola Abençoada - Armazém Quarta Aba (30 dias)'
      ],
      items_7d: [
        'Pérola Abençoada - EXP 10000% (Tempo de uso: 7 dias)'
      ],
      items_permanentes: [
        'Água Sagrada Extrema 127x (Permanente)',
        'Água Sagrada Heroica 127x (Permanente)',
        'Poção de Perfurar 127x / 100 de perfuração 3º Slot (Permanente)'
      ],
      recursos: [
        'Macro de BM3',
        'Buffs das classes ao relogar',
        'Auto Select para Destruir Itens',
        'Acesso a Canais Premium (Drops x6-x10)'
      ],
      status: [
        'Bônus EXP 5000%',
        'Aumento da Taxa de Drop 70%',
        'Bônus WEXP 100%',
        'Bônus de Pet EXP 500%',
        'AXP Bônus 300%',
        'Taxa de Drop de Caixa Aumentada 50%'
      ],
      outros: [
        'Expandir Inventário 4 Item',
        'Expandir Armazém Pessoal 1 Item',
        'GPS de teletransporte',
        'Bônus Slot Loja do Agente 12 Item',
        'Aumentar Quantidade de Registro 65 Item',
        'Aumento de Slot de Pedido de Criação 3 Item',
        'Recompensa Exclusiva Premium de Calabouço',
        'Tempo de Calabouço Aumentado'
      ]
    }
  }
];

Deno.serve(async (req) => {
  try {
    return Response.json({
      success: true,
      plans: VIP_PLANS
    });
  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});