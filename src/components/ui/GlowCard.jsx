import React from 'react';
import { motion } from 'framer-motion';

export default function GlowCard({ 
  children, 
  className = '', 
  glowColor = '#19E0FF',
  hover = true,
  onClick 
}) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : {}}
      onClick={onClick}
      className={`
        relative bg-[#0C121C] border border-[#19E0FF]/20 rounded-xl overflow-hidden
        ${hover ? 'hover:border-[#19E0FF]/40 transition-colors cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Inner glow effect */}
      <div 
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${glowColor}10 0%, transparent 50%)`
        }}
      />
      {children}
    </motion.div>
  );
}