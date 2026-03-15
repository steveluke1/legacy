import React from 'react';
import { Star, Zap, Shield, Award } from 'lucide-react';

const badgeConfig = {
  'Elite Seller': {
    icon: Star,
    color: '#FFD700',
    bg: 'bg-[#FFD700]/20',
    border: 'border-[#FFD700]/50',
    description: '+20 vendas no mês'
  },
  'FastTrade': {
    icon: Zap,
    color: '#19E0FF',
    bg: 'bg-[#19E0FF]/20',
    border: 'border-[#19E0FF]/50',
    description: 'Entregas em <2h'
  },
  'Zero Disputes': {
    icon: Shield,
    color: '#10B981',
    bg: 'bg-[#10B981]/20',
    border: 'border-[#10B981]/50',
    description: 'Sem disputas em 30 dias'
  },
  'Trusted Diamond': {
    icon: Award,
    color: '#E5E4E2',
    bg: 'bg-[#E5E4E2]/20',
    border: 'border-[#E5E4E2]/50',
    description: 'Avaliação 4.8+ (50+ vendas)'
  }
};

export default function SellerBadge({ badge, showTooltip = true }) {
  const config = badgeConfig[badge];
  
  if (!config) return null;
  
  const Icon = config.icon;
  
  return (
    <div className="group relative inline-flex">
      <div 
        className={`
          flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
          ${config.bg} ${config.border} border
        `}
        style={{ color: config.color }}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{badge}</span>
      </div>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#0C121C] border border-[#19E0FF]/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          <p className="text-[#A9B2C7] text-xs">{config.description}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2 h-2 bg-[#0C121C] border-r border-b border-[#19E0FF]/30 transform rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}