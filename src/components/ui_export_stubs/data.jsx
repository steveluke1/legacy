// UI EXPORT STUB — Data Layer
// Replace with real API calls to your Next.js backend

export const STUB_GUILDS = [
  {
    id: '1',
    name: 'Apocalypse',
    slug: 'apocalypse',
    faction: 'Procyon',
    level: 12,
    member_count: 98,
    recruiting: true,
    description: 'A guilda mais temida de Nevareth'
  },
  {
    id: '2',
    name: 'Phoenix',
    slug: 'phoenix',
    faction: 'Capella',
    level: 11,
    member_count: 95,
    recruiting: false,
    description: 'Das cinzas, renascemos mais fortes'
  },
  {
    id: '3',
    name: 'Legends',
    slug: 'legends',
    faction: 'Procyon',
    level: 10,
    member_count: 87,
    recruiting: true,
    description: 'Lendas nunca morrem'
  },
  {
    id: '4',
    name: 'Elite',
    slug: 'elite',
    faction: 'Capella',
    level: 9,
    member_count: 82,
    recruiting: true,
    description: 'Somente os melhores'
  },
  {
    id: '5',
    name: 'Warriors',
    slug: 'warriors',
    faction: 'Procyon',
    level: 8,
    member_count: 76,
    recruiting: false,
    description: 'Guerreiros de coração'
  },
  {
    id: '6',
    name: 'Shadow Legion',
    slug: 'shadow-legion',
    faction: 'Capella',
    level: 7,
    member_count: 71,
    recruiting: true,
    description: 'Nas sombras, conquistamos'
  }
];

export const STUB_ENQUETES = [
  {
    id: 'enq_001',
    pergunta: 'Qual deve ser o próximo evento do servidor?',
    opcoes: [
      { id: 'opt_001', texto: 'Bingo', votos: 128 },
      { id: 'opt_002', texto: 'Natal', votos: 342 },
      { id: 'opt_003', texto: 'Páscoa', votos: 96 }
    ],
    is_active: true,
    created_at: '2025-12-10T10:00:00Z'
  },
  {
    id: 'enq_002',
    pergunta: 'Qual DG deve ser liberada primeiro?',
    opcoes: [
      { id: 'opt_004', texto: 'Drag 3SS', votos: 214 },
      { id: 'opt_005', texto: 'T3', votos: 187 },
      { id: 'opt_006', texto: 'Ilha da Miragem', votos: 401 }
    ],
    is_active: true,
    created_at: '2025-12-11T14:30:00Z'
  },
  {
    id: 'enq_003',
    pergunta: 'Qual modelo de TG você prefere?',
    opcoes: [
      { id: 'opt_007', texto: 'TG focada em player', votos: 356 },
      { id: 'opt_008', texto: 'TG focada em mob', votos: 142 },
      { id: 'opt_009', texto: 'TG mista', votos: 289 }
    ],
    is_active: true,
    created_at: '2025-12-09T16:00:00Z'
  }
];

const STUB_PRODUCTS = [
  {
    id: 'prod_bronze_001',
    name: 'Gift Card Bronze',
    description: 'Cartão de 100 fragmentos cristalinos',
    tier: 'BRONZE',
    quantity: 100,
    price_cash: 5000
  },
  {
    id: 'prod_prata_001',
    name: 'Gift Card Prata',
    description: 'Cartão de 250 fragmentos cristalinos',
    tier: 'PRATA',
    quantity: 250,
    price_cash: 12000
  },
  {
    id: 'prod_ouro_001',
    name: 'Gift Card Ouro',
    description: 'Cartão de 500 fragmentos cristalinos',
    tier: 'OURO',
    quantity: 500,
    price_cash: 23000
  }
];

const STUB_PLANS = [
  {
    key: 'VIP_SIMPLE',
    name: 'VIP Bronze',
    price_brl: 1990,
    price_cash: 10000,
    benefits: ['+15% EXP', '+10% Drop', 'Teleporte rápido', 'Canal VIP']
  },
  {
    key: 'VIP_MEDIUM',
    name: 'VIP Platinum',
    price_brl: 3990,
    price_cash: 20000,
    benefits: ['+25% EXP', '+15% Drop', '+5% Crit', 'Teleporte premium', 'Loot box mensal']
  },
  {
    key: 'VIP_COMPLETE',
    name: 'VIP Legendary',
    price_brl: 5990,
    price_cash: 30000,
    benefits: ['+35% EXP', '+20% Drop', '+10% Crit', 'Teleporte ilimitado', 'Loot box semanal', 'Nome colorido']
  }
];

const STUB_USER_ACCOUNT = {
  user_id: 'user_demo_123',
  level: 5,
  exp: 1250,
  cash_balance: 50000,
  crystal_fragments: 120,
  current_title: 'Novato',
  reputation_tier: 'Bronze Crystal'
};

export async function getStoreData() {
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    products: STUB_PRODUCTS,
    plans: STUB_PLANS,
    currentVip: null,
    inventory: {}
  };
}

export async function getUserAccount(userId) {
  await new Promise(resolve => setTimeout(resolve, 200));
  return STUB_USER_ACCOUNT;
}