import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function MetalButton({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  type = 'button'
}) {
  const variants = {
    primary: `
      bg-gradient-to-b from-[#0097d8] via-[#19E0FF] to-[#0097d8]
      text-[#05070B] font-black
      shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_4px_rgba(0,151,216,0.5)]
      border-t border-[#19E0FF]
      hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_12px_rgba(25,224,255,0.6)]
    `,
    secondary: `
      bg-gradient-to-b from-[#2A3F5F] via-[#1E2A3D] to-[#0C121C]
      text-[#19E0FF]
      shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.5)]
      border border-[#19E0FF]/30
      hover:border-[#19E0FF]/60
    `,
    danger: `
      bg-gradient-to-b from-[#8B0000] via-[#FF4B6A] to-[#8B0000]
      text-white font-black
      shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_4px_rgba(255,75,106,0.5)]
      border-t border-[#FF6B8A]
      hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(255,75,106,0.6)]
    `,
    gold: `
      bg-gradient-to-b from-[#FFD700] via-[#F7CE46] to-[#DAA520]
      text-[#05070B] font-black
      shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_4px_rgba(247,206,70,0.5)]
      border-t border-[#FFD700]
      hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_12px_rgba(255,215,0,0.6)]
    `
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { y: -2 } : {}}
      whileTap={!disabled && !loading ? { y: 0 } : {}}
      className={`
        relative rounded-lg transition-all duration-200
        ${variants[variant]}
        ${sizes[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <div className="absolute inset-x-0 bottom-0 h-1 bg-black/40 rounded-b-lg" />
      
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Carregando...
          </>
        ) : (
          children
        )}
      </span>
    </motion.button>
  );
}