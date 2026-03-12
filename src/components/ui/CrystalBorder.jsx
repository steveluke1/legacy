import React from 'react';
import { motion } from 'framer-motion';

const tierStyles = {
  'Bronze Crystal': {
    border: 'border-[#CD7F32]',
    glow: '#CD7F32',
    shine: 'from-[#CD7F32]/20 via-[#CD7F32]/5',
    label: 'Bronze',
    shadowColor: 'rgba(205, 127, 50, 0.4)'
  },
  'Silver Crystal': {
    border: 'border-[#C0C0C0]',
    glow: '#C0C0C0',
    shine: 'from-[#C0C0C0]/20 via-[#C0C0C0]/5',
    label: 'Prata',
    shadowColor: 'rgba(192, 192, 192, 0.4)'
  },
  'Obsidian Crystal': {
    border: 'border-[#4A0E4E]',
    glow: '#4A0E4E',
    shine: 'from-[#4A0E4E]/20 via-[#4A0E4E]/5',
    label: 'Obsidiana',
    shadowColor: 'rgba(74, 14, 78, 0.4)'
  },
  'Platinum Crystal': {
    border: 'border-[#E5E4E2]',
    glow: '#E5E4E2',
    shine: 'from-[#E5E4E2]/20 via-[#E5E4E2]/5',
    label: 'Platina',
    shadowColor: 'rgba(229, 228, 226, 0.4)'
  },
  'Legendary Arch-Crystal': {
    border: 'border-[#FFD700]',
    glow: '#FFD700',
    shine: 'from-[#FFD700]/30 via-[#FFD700]/10',
    label: 'Lendário',
    shadowColor: 'rgba(255, 215, 0, 0.5)'
  }
};

export default function CrystalBorder({ 
  children, 
  tier = 'Bronze Crystal',
  className = '',
  showLabel = false,
  animate = true
}) {
  const style = tierStyles[tier] || tierStyles['Bronze Crystal'];
  
  return (
    <div className={`relative ${className}`}>
      <div className={`
        relative border-2 ${style.border} rounded-lg overflow-hidden
        bg-gradient-to-br from-[#0C121C] to-[#05070B]
      `}
      style={{
        boxShadow: `0 0 20px ${style.shadowColor}, inset 0 1px 0 rgba(255,255,255,0.1)`
      }}>
        <div 
          className={`absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b ${style.shine} to-transparent pointer-events-none`}
        />
        
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: style.glow }} />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: style.glow }} />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: style.glow }} />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: style.glow }} />
        
        {animate && (
          <motion.div
            className="absolute inset-0 opacity-0 pointer-events-none"
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{
              boxShadow: `inset 0 0 30px ${style.glow}40`
            }}
          />
        )}
        
        <div className="relative z-10">
          {children}
        </div>
      </div>
      
      {showLabel && (
        <div 
          className="absolute -top-3 left-4 px-3 py-1 text-xs font-bold rounded-full"
          style={{
            background: `linear-gradient(135deg, ${style.glow}40, ${style.glow}20)`,
            border: `1px solid ${style.glow}`,
            color: style.glow
          }}
        >
          {style.label}
        </div>
      )}
    </div>
  );
}