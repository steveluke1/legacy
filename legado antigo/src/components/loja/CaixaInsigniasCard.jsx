import React, { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Package, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '@/components/ui/GlowCard';
import MetalButton from '@/components/ui/MetalButton';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const RARITY_INFO = [
  { rarity: 'Insígna (Rara)', chance: '79,49%', color: '#22C55E' },
  { rarity: 'Insígna (Unica)', chance: '15,00%', color: '#3B82F6' },
  { rarity: 'Insígna (Epico)', chance: '5,00%', color: '#A855F7' },
  { rarity: 'Insígna (Mestre)', chance: '0,50%', color: '#EF4444' },
  { rarity: 'Insígna (Lendaria)', chance: '0,01%', color: '#FACC15' }
];

export default function CaixaInsigniasCard() {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  const purchaseMutation = useMutation({
    mutationFn: async (qty) => {
      const res = await base44.functions.invoke('badge_purchaseLootBox', { 
        loot_box_type_slug: 'caixa-insignias-ziron',
        quantity: qty 
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.error || 'Erro ao comprar caixas');
      }
      
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.quantityCreated} caixa(s) de insígnias comprada(s) com sucesso!`, {
        duration: 4000,
        action: {
          label: 'Ir para minhas caixas',
          onClick: () => navigate(createPageUrl('MinhaContaCaixasInsignias'))
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
    <GlowCard className="p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8] rounded-xl flex items-center justify-center">
          <Package className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            Caixa de Insígnias
            <Sparkles className="w-4 h-4 text-[#F7CE46]" />
          </h3>
          <p className="text-[#A9B2C7] text-sm">
            Cada caixa garante 1 insígnia exclusiva. Chance de obter insígnias de diferentes raridades.
          </p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-4">
        <div className="text-2xl font-black text-[#19E0FF]">
          R$ 4,90
          <span className="text-xs text-[#A9B2C7] ml-2">por caixa</span>
        </div>
      </div>

      {/* Probabilities */}
      <div className="mb-4">
        <h4 className="text-white font-bold mb-2 text-sm">Chances de Raridade:</h4>
        <div className="space-y-1">
          {RARITY_INFO.map((info, idx) => (
            <div key={idx} className="flex items-center justify-between p-1.5 bg-[#05070B] rounded text-xs">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: info.color }}
                />
                <span className="text-[#A9B2C7]">{info.rarity}</span>
              </div>
              <span className="text-white font-bold">{info.chance}</span>
            </div>
          ))}
        </div>
        <p className="text-[#A9B2C7] text-xs mt-2">
          As chances acima indicam a raridade da insígnia obtida em cada caixa.
        </p>
      </div>

      {/* Quantity Buttons Only */}
      <div className="mb-4">
        <label className="block text-white font-bold mb-2 text-sm">Quantidade:</label>
        <div className="flex gap-2 flex-wrap">
          {[1, 10, 25, 50, 100].map(qty => (
            <button
              key={qty}
              onClick={() => setQuantity(qty)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                quantity === qty
                  ? 'bg-[#19E0FF] text-[#05070B]'
                  : 'bg-[#05070B] text-[#19E0FF] border border-[#19E0FF]/30 hover:bg-[#19E0FF]/10'
              }`}
            >
              {qty}
            </button>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="mb-4 p-3 bg-[#05070B] border border-[#19E0FF]/30 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-[#A9B2C7] text-sm">Total:</span>
          <span className="text-xl font-black text-[#19E0FF]">R$ {totalPrice}</span>
        </div>
      </div>

      {/* Purchase Button */}
      <MetalButton
        onClick={handlePurchase}
        loading={purchaseMutation.isPending}
        className="w-full"
        size="md"
      >
        Comprar Caixa{quantity > 1 ? 's' : ''}
      </MetalButton>
    </GlowCard>
  );
}