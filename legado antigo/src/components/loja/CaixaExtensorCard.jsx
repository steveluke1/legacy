import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Box, Zap } from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '@/components/ui/GlowCard';
import MetalButton from '@/components/ui/MetalButton';
import { useNavigate } from 'react-router-dom';

// Canonical drop table for "Caixa Misteriosa tchapi" - MUST MATCH backend
const MYSTERY_BOX_DROPS_MOCK = [
  { reward: 'amuleto da yul +15 (1 dia)', chance: '1%', color: '#FFD700' },
  { reward: 'anel de aniversario (1 dia)', chance: '1%', color: '#FFD700' },
  { reward: 'Bracelete da yul +15 (1 dia)', chance: '1%', color: '#FFD700' },
  { reward: 'Brinco da yul +15 (1 dia)', chance: '1%', color: '#FFD700' },
  { reward: 'Entrada de dx premiun (1 dia)', chance: '15%', color: '#A855F7' },
  { reward: 'caixa de proteção', chance: '2%', color: '#A855F7' },
  { reward: 'acessórios +15 (1 dia)', chance: '3%', color: '#A855F7' },
  { reward: 'perola wexp 1000% (8 horas)', chance: '4%', color: '#19E0FF' },
  { reward: 'perola EXP 1000% (12 horas)', chance: '4%', color: '#19E0FF' },
  { reward: 'perola XP de pet 1000% (12 horas)', chance: '4%', color: '#19E0FF' },
  { reward: 'Dgs aleatórias', chance: '64%', color: '#19E0FF' }
];

export default function CaixaExtensorCard() {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  const purchaseMutation = useMutation({
    mutationFn: async (qty) => {
      const res = await base44.functions.invoke('mystery_purchaseBox', { quantity: qty });
      
      if (!res.data?.success) {
        throw new Error(res.data?.error || 'Erro ao comprar caixas');
      }
      
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.quantityCreated} Caixa(s) Misteriosa(s) tchapi comprada(s) com sucesso!`, {
        duration: 4000,
        action: {
          label: 'Ir para Minhas Caixas',
          onClick: () => navigate('/minha-conta/caixas-extensor')
        }
      });
    },
    onError: (error) => {
      console.error('Purchase error:', error);
      toast.error(error.response?.data?.error || error.message || 'Erro ao comprar caixas');
    },
    retry: 0
  });

  const handlePurchase = () => {
    purchaseMutation.mutate(quantity);
  };

  const totalPrice = (4.90 * quantity).toFixed(2);

  return (
    <GlowCard className="p-6" glowColor="#A855F7">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-[#A855F7] to-[#9333EA] rounded-xl flex items-center justify-center">
          <Box className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            Caixa Misteriosa tchapi
            <Zap className="w-4 h-4 text-[#FACC15]" />
          </h3>
          <p className="text-[#A9B2C7] text-sm">
            Tente a sorte e receba recompensas premium e DGs aleatórias.
          </p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-4">
        <div className="text-2xl font-black text-[#A855F7]">
          R$ 4,90
          <span className="text-xs text-[#A9B2C7] ml-2">por caixa</span>
        </div>
      </div>

      {/* Probabilities */}
      <div className="mb-4">
        <h4 className="text-white font-bold mb-2 text-sm">Recompensas possíveis:</h4>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {MYSTERY_BOX_DROPS_MOCK.map((drop, idx) => (
            <div key={idx} className="flex items-center justify-between p-1.5 bg-[#05070B] rounded text-xs">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: drop.color }}
                />
                <span className="text-[#A9B2C7]">{drop.reward}</span>
              </div>
              <span className="text-white font-bold flex-shrink-0">{drop.chance}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quantity Buttons */}
      <div className="mb-4">
        <label className="block text-white font-bold mb-2 text-sm">Quantidade:</label>
        <div className="flex gap-2 flex-wrap">
          {[1, 25, 50, 100].map(qty => (
            <button
              key={qty}
              onClick={() => setQuantity(qty)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                quantity === qty
                  ? 'bg-[#A855F7] text-white'
                  : 'bg-[#05070B] text-[#A855F7] border border-[#A855F7]/30 hover:bg-[#A855F7]/10'
              }`}
            >
              {qty}
            </button>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="mb-4 p-3 bg-[#05070B] border border-[#A855F7]/30 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-[#A9B2C7] text-sm">Total:</span>
          <span className="text-xl font-black text-[#A855F7]">R$ {totalPrice}</span>
        </div>
      </div>

      {/* Purchase Button */}
      <MetalButton
        onClick={handlePurchase}
        loading={purchaseMutation.isPending}
        disabled={purchaseMutation.isPending}
        className="w-full"
        size="md"
        variant="primary"
      >
        {purchaseMutation.isPending ? 'Processando...' : `Comprar Caixa${quantity > 1 ? 's' : ''}`}
      </MetalButton>
    </GlowCard>
  );
}