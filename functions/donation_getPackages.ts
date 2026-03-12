import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const DONATION_PACKAGES = [
  {
    id: 'DONATION_10',
    label: 'R$ 10,00 → 1.000 Cash',
    amount_brl: 10,
    base_cash: 1000,
    bonus_percent: 0,
    total_cash: 1000
  },
  {
    id: 'DONATION_25',
    label: 'R$ 25,00 → 2.500 Cash',
    amount_brl: 25,
    base_cash: 2500,
    bonus_percent: 0,
    total_cash: 2500
  },
  {
    id: 'DONATION_50',
    label: 'R$ 50,00 → 5.000 Cash + 3% bônus (5.150 Cash)',
    amount_brl: 50,
    base_cash: 5000,
    bonus_percent: 3,
    total_cash: 5150
  },
  {
    id: 'DONATION_100',
    label: 'R$ 100,00 → 10.000 Cash + 5% bônus (10.500 Cash)',
    amount_brl: 100,
    base_cash: 10000,
    bonus_percent: 5,
    total_cash: 10500
  },
  {
    id: 'DONATION_250',
    label: 'R$ 250,00 → 25.000 Cash + 7% bônus (26.750 Cash)',
    amount_brl: 250,
    base_cash: 25000,
    bonus_percent: 7,
    total_cash: 26750
  },
  {
    id: 'DONATION_500',
    label: 'R$ 500,00 → 50.000 Cash + 10% bônus (55.000 Cash)',
    amount_brl: 500,
    base_cash: 50000,
    bonus_percent: 10,
    total_cash: 55000
  },
  {
    id: 'DONATION_1000',
    label: 'R$ 1.000,00 → 100.000 Cash + 13% bônus (113.000 Cash)',
    amount_brl: 1000,
    base_cash: 100000,
    bonus_percent: 13,
    total_cash: 113000
  },
  {
    id: 'DONATION_5000',
    label: 'R$ 5.000,00 → 500.000 Cash + 15% bônus (575.000 Cash)',
    amount_brl: 5000,
    base_cash: 500000,
    bonus_percent: 15,
    total_cash: 575000
  },
  {
    id: 'DONATION_10000',
    label: 'R$ 10.000,00 → 1.000.000 Cash + 20% bônus (1.200.000 Cash)',
    amount_brl: 10000,
    base_cash: 1000000,
    bonus_percent: 20,
    total_cash: 1200000
  }
];

Deno.serve(async (req) => {
  try {
    return Response.json({
      success: true,
      packages: DONATION_PACKAGES
    });
  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});