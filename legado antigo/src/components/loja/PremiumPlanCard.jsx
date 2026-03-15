import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Zap, CheckCircle, Coins, DollarSign, Package, Clock, Gift } from 'lucide-react';
import CrystalBorder from '@/components/ui/CrystalBorder';
import MetalButton from '@/components/ui/MetalButton';
import { Badge } from '@/components/ui/badge';

const PremiumPlanCard = React.memo(({ plan, index, onPurchaseCash, onPurchaseBRL, processingPlan }) => {
  const isPopular = plan.badge === 'MAIS VANTAJOSO';
  const isMax = plan.badge === 'MÁXIMA VANTAGEM';
  const isProcessingCash = processingPlan === `${plan.key}_cash`;
  const isProcessingBRL = processingPlan === `${plan.key}_brl`;
  
  const tierData = {
    PREMIUM_1: { tier: 'Bronze Crystal', icon: Star, color: '#CD7F32' },
    PREMIUM_2: { tier: 'Platinum Crystal', icon: Zap, color: '#E5E4E2' },
    PREMIUM_3: { tier: 'Legendary Arch-Crystal', icon: Crown, color: '#FFD700' }
  }[plan.key];
  
  const Icon = tierData.icon;

  const summaryBenefits = [
    'Todos os cartões remotos e de loja por 30 dias',
    'Poções especiais e itens permanentes de combate',
    `Bônus EXP ${plan.status.bonus_exp} e taxa de drop ${plan.status.aumento_taxa_drop}`,
    'Recompensas Premium em calabouços',
    plan.sorteios_mensais && 'Sorteios mensais exclusivos',
    plan.descontos_loja && `Descontos de ${plan.descontos_loja_percentual} na loja`,
    plan.destaque_rankings && 'Destaque visual em rankings'
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={isPopular ? 'lg:scale-110 lg:-mt-6 lg:z-10' : ''}
    >
      <div className={`relative ${isPopular ? 'ring-4 ring-[#19E0FF] rounded-2xl shadow-2xl shadow-[#19E0FF]/30' : ''}`}>
        {plan.badge && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
            <Badge className="bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-white font-bold px-6 py-2 text-sm shadow-lg">
              ⭐ {plan.badge}
            </Badge>
          </div>
        )}
        
        <CrystalBorder tier={tierData.tier} showLabel={false}>
          <div className={`p-8 h-full flex flex-col ${isPopular ? 'bg-gradient-to-b from-[#19E0FF]/5 to-transparent' : ''}`}>
            {/* Header */}
            <div className="text-center mb-6">
              <div 
                className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${tierData.color}20` }}
              >
                <Icon className="w-10 h-10" style={{ color: tierData.color }} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-[#A9B2C7] text-sm">{plan.description}</p>
            </div>

            {/* Pricing */}
            <div className="text-center mb-6">
              <div className="mb-2">
                <div className="text-5xl font-black text-white mb-1">
                  R$ {plan.price_brl}
                </div>
                <div className="text-[#A9B2C7] text-sm">por 30 dias</div>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-lg mt-3">
                <Coins className="w-4 h-4 text-[#19E0FF]" />
                <span className="text-[#19E0FF] font-bold text-sm">
                  ou {plan.price_cash.toLocaleString('pt-BR')} Cash
                </span>
              </div>
            </div>

            {/* Summary Benefits */}
            <div className="flex-1 mb-6">
              <div className="space-y-3">
                {summaryBenefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#19E0FF] flex-shrink-0 mt-0.5" />
                    <span className="text-[#A9B2C7] text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-3 mt-auto">
              <MetalButton
                onClick={() => onPurchaseBRL(plan.key)}
                disabled={isProcessingBRL || isProcessingCash}
                loading={isProcessingBRL}
                className="w-full"
                variant={isPopular ? "primary" : isMax ? "gold" : "secondary"}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Ativar {plan.name}
              </MetalButton>
              <MetalButton
                onClick={() => onPurchaseCash(plan.key)}
                disabled={isProcessingBRL || isProcessingCash}
                loading={isProcessingCash}
                className="w-full"
                variant="secondary"
              >
                <Coins className="w-4 h-4 mr-2" />
                Comprar com Cash
              </MetalButton>
            </div>
          </div>
        </CrystalBorder>
      </div>
    </motion.div>
  );
});

PremiumPlanCard.displayName = 'PremiumPlanCard';

export default PremiumPlanCard;