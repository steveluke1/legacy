import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function GradientButton({ 
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
    primary: 'bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] hover:shadow-lg hover:shadow-[#19E0FF]/30',
    secondary: 'bg-transparent border-2 border-[#19E0FF] text-[#19E0FF] hover:bg-[#19E0FF]/10',
    danger: 'bg-gradient-to-r from-[#FF4B6A] to-[#FF6B8A] text-white hover:shadow-lg hover:shadow-[#FF4B6A]/30',
    honor: 'bg-gradient-to-r from-[#F7CE46] to-[#FFD700] text-[#05070B] hover:shadow-lg hover:shadow-[#F7CE46]/30',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={`
        font-semibold rounded-lg transition-all duration-300
        ${variants[variant]}
        ${sizes[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Carregando...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}