import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const GIFT_CARD_PRODUCTS = [
  {
    id: 'GIFT_BRONZE',
    name: 'Cartão de Presente (Bronze)',
    tier: 'BRONZE',
    quantity: 1,
    price_cash: 200,
    description: 'Cartão de presente nível Bronze. Entregue via portal.'
  },
  {
    id: 'GIFT_PRATA',
    name: 'Cartão de Presente (Prata)',
    tier: 'PRATA',
    quantity: 1,
    price_cash: 500,
    description: 'Cartão de presente nível Prata. Entregue via portal.'
  },
  {
    id: 'GIFT_OURO',
    name: 'Cartão de Presente (Ouro)',
    tier: 'OURO',
    quantity: 1,
    price_cash: 1000,
    description: 'Cartão de presente nível Ouro. Entregue via portal.'
  }
];

Deno.serve(async (req) => {
  try {
    return Response.json({
      success: true,
      products: GIFT_CARD_PRODUCTS
    });
  } catch (error) {
    return Response.json({ 
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
});