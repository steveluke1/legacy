import React from 'react';
import { motion } from 'framer-motion';

const BadgeIcon = ({ rarity, size = 'md' }) => {
  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-36 h-36'
  };

  // Comum - 2 espadas cruzadas em cinza metálico
  if (rarity === 'common') {
    return (
      <svg className={sizes[size]} viewBox="0 0 100 100" fill="none">
        <defs>
          <linearGradient id="swordGray" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D1D5DB" />
            <stop offset="50%" stopColor="#9CA3AF" />
            <stop offset="100%" stopColor="#6B7280" />
          </linearGradient>
          <filter id="swordShadow">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.4"/>
          </filter>
        </defs>
        
        {/* Espada esquerda */}
        <g filter="url(#swordShadow)">
          <path d="M22 8 L22 58 L17 66 L12 58 L12 8 L17 3 Z" fill="url(#swordGray)" stroke="#4B5563" strokeWidth="1.5"/>
          <path d="M17 3 L19 8 L17 10 L15 8 Z" fill="#E5E7EB" opacity="0.8"/>
          <rect x="18" y="58" width="8" height="14" rx="2" fill="#4B5563" stroke="#374151" strokeWidth="1"/>
          <ellipse cx="22" cy="75" rx="6" ry="5" fill="#374151" stroke="#1F2937" strokeWidth="1"/>
          <line x1="17" y1="15" x2="17" y2="50" stroke="#E5E7EB" strokeWidth="1" opacity="0.3"/>
        </g>
        
        {/* Espada direita */}
        <g filter="url(#swordShadow)">
          <path d="M78 8 L78 58 L83 66 L88 58 L88 8 L83 3 Z" fill="url(#swordGray)" stroke="#4B5563" strokeWidth="1.5"/>
          <path d="M83 3 L81 8 L83 10 L85 8 Z" fill="#E5E7EB" opacity="0.8"/>
          <rect x="74" y="58" width="8" height="14" rx="2" fill="#4B5563" stroke="#374151" strokeWidth="1"/>
          <ellipse cx="78" cy="75" rx="6" ry="5" fill="#374151" stroke="#1F2937" strokeWidth="1"/>
          <line x1="83" y1="15" x2="83" y2="50" stroke="#E5E7EB" strokeWidth="1" opacity="0.3"/>
        </g>
      </svg>
    );
  }

  // Rara - 2 patas de lobo com fumaça azul mística
  if (rarity === 'rare') {
    return (
      <svg className={sizes[size]} viewBox="0 0 100 100" fill="none">
        <defs>
          <radialGradient id="pawBlue" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1E40AF" />
          </radialGradient>
          <filter id="pawGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Pata esquerda */}
        <g filter="url(#pawGlow)">
          <ellipse cx="23" cy="62" rx="14" ry="18" fill="url(#pawBlue)" stroke="#1E3A8A" strokeWidth="2"/>
          <ellipse cx="23" cy="60" rx="10" ry="14" fill="#2563EB" opacity="0.6"/>
          <circle cx="12" cy="43" r="7" fill="url(#pawBlue)" stroke="#1E3A8A" strokeWidth="1.5"/>
          <circle cx="23" cy="38" r="7" fill="url(#pawBlue)" stroke="#1E3A8A" strokeWidth="1.5"/>
          <circle cx="34" cy="43" r="7" fill="url(#pawBlue)" stroke="#1E3A8A" strokeWidth="1.5"/>
          {/* Garras */}
          <ellipse cx="12" cy="37" rx="2" ry="4" fill="#1E3A8A" opacity="0.7"/>
          <ellipse cx="23" cy="32" rx="2" ry="4" fill="#1E3A8A" opacity="0.7"/>
          <ellipse cx="34" cy="37" rx="2" ry="4" fill="#1E3A8A" opacity="0.7"/>
        </g>
        
        {/* Pata direita */}
        <g filter="url(#pawGlow)">
          <ellipse cx="77" cy="62" rx="14" ry="18" fill="url(#pawBlue)" stroke="#1E3A8A" strokeWidth="2"/>
          <ellipse cx="77" cy="60" rx="10" ry="14" fill="#2563EB" opacity="0.6"/>
          <circle cx="66" cy="43" r="7" fill="url(#pawBlue)" stroke="#1E3A8A" strokeWidth="1.5"/>
          <circle cx="77" cy="38" r="7" fill="url(#pawBlue)" stroke="#1E3A8A" strokeWidth="1.5"/>
          <circle cx="88" cy="43" r="7" fill="url(#pawBlue)" stroke="#1E3A8A" strokeWidth="1.5"/>
          <ellipse cx="66" cy="37" rx="2" ry="4" fill="#1E3A8A" opacity="0.7"/>
          <ellipse cx="77" cy="32" rx="2" ry="4" fill="#1E3A8A" opacity="0.7"/>
          <ellipse cx="88" cy="37" rx="2" ry="4" fill="#1E3A8A" opacity="0.7"/>
        </g>
        
        {/* Fumaça mística azul */}
        <motion.g
          animate={{opacity: [0.2, 0.7, 0.2], y: [0, -8, 0]}}
          transition={{duration: 3, repeat: Infinity, ease: "easeInOut"}}
        >
          <circle cx="23" cy="25" r="12" fill="#60A5FA" opacity="0.5"/>
          <circle cx="77" cy="25" r="12" fill="#60A5FA" opacity="0.5"/>
          <circle cx="23" cy="12" r="8" fill="#93C5FD" opacity="0.4"/>
          <circle cx="77" cy="12" r="8" fill="#93C5FD" opacity="0.4"/>
          <circle cx="18" cy="18" r="5" fill="#DBEAFE" opacity="0.3"/>
          <circle cx="82" cy="18" r="5" fill="#DBEAFE" opacity="0.3"/>
        </motion.g>
      </svg>
    );
  }

  // Épica - 2 cabeças de lobo feroz com fumaça e raios
  if (rarity === 'epic') {
    return (
      <svg className={sizes[size]} viewBox="0 0 100 100" fill="none">
        <defs>
          <radialGradient id="wolfRed" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FCA5A5" />
            <stop offset="40%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#991B1B" />
          </radialGradient>
          <filter id="fireGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Lobo esquerdo */}
        <g filter="url(#fireGlow)">
          <path d="M18 28 L8 47 L18 66 L40 66 L40 36 Z" fill="url(#wolfRed)" stroke="#7F1D1D" strokeWidth="2"/>
          <path d="M18 30 L12 47 L18 60 L35 60 L35 38 Z" fill="#DC2626" opacity="0.6"/>
          {/* Orelhas */}
          <path d="M8 38 L2 28 L8 42 Z" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="1.5"/>
          <path d="M8 56 L2 66 L8 52 Z" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="1.5"/>
          {/* Olho brilhante */}
          <circle cx="26" cy="46" r="4" fill="#FEE2E2"/>
          <circle cx="27" cy="45" r="2" fill="#7F1D1D"/>
          {/* Focinho */}
          <path d="M38 47 L45 50 L38 53 Z" fill="#991B1B" stroke="#7F1D1D" strokeWidth="1"/>
          <line x1="40" y1="47" x2="42" y2="44" stroke="#7F1D1D" strokeWidth="1.5"/>
          <line x1="40" y1="53" x2="42" y2="56" stroke="#7F1D1D" strokeWidth="1.5"/>
        </g>
        
        {/* Lobo direito */}
        <g filter="url(#fireGlow)">
          <path d="M82 28 L92 47 L82 66 L60 66 L60 36 Z" fill="url(#wolfRed)" stroke="#7F1D1D" strokeWidth="2"/>
          <path d="M82 30 L88 47 L82 60 L65 60 L65 38 Z" fill="#DC2626" opacity="0.6"/>
          <path d="M92 38 L98 28 L92 42 Z" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="1.5"/>
          <path d="M92 56 L98 66 L92 52 Z" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="1.5"/>
          <circle cx="74" cy="46" r="4" fill="#FEE2E2"/>
          <circle cx="73" cy="45" r="2" fill="#7F1D1D"/>
          <path d="M62 47 L55 50 L62 53 Z" fill="#991B1B" stroke="#7F1D1D" strokeWidth="1"/>
          <line x1="60" y1="47" x2="58" y2="44" stroke="#7F1D1D" strokeWidth="1.5"/>
          <line x1="60" y1="53" x2="58" y2="56" stroke="#7F1D1D" strokeWidth="1.5"/>
        </g>
        
        {/* Fumaça de fogo */}
        <motion.g animate={{opacity: [0.3, 0.7, 0.3], y: [0, -10, 0]}} transition={{duration: 2.5, repeat: Infinity}}>
          <circle cx="28" cy="18" r="10" fill="#F87171" opacity="0.5"/>
          <circle cx="72" cy="18" r="10" fill="#F87171" opacity="0.5"/>
          <circle cx="28" cy="6" r="6" fill="#FCA5A5" opacity="0.4"/>
          <circle cx="72" cy="6" r="6" fill="#FCA5A5" opacity="0.4"/>
        </motion.g>
        
        {/* Raios elétricos */}
        <motion.g animate={{opacity: [0.4, 0.9, 0.4]}} transition={{duration: 1, repeat: Infinity}}>
          <path d="M18 22 L24 10 L20 18 L28 5" stroke="#FBBF24" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M82 22 L76 10 L80 18 L72 5" stroke="#FBBF24" strokeWidth="3" fill="none" strokeLinecap="round"/>
        </motion.g>
      </svg>
    );
  }

  // Lendária - 2 capacetes divinos com efeitos celestiais
  if (rarity === 'legendary') {
    return (
      <svg className={sizes[size]} viewBox="0 0 100 100" fill="none">
        <defs>
          <radialGradient id="goldShine" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="30%" stopColor="#FCD34D" />
            <stop offset="70%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </radialGradient>
          <filter id="divineGlow">
            <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="goldMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF3C7"/>
            <stop offset="25%" stopColor="#FCD34D"/>
            <stop offset="50%" stopColor="#F59E0B"/>
            <stop offset="75%" stopColor="#D97706"/>
            <stop offset="100%" stopColor="#92400E"/>
          </linearGradient>
        </defs>
        
        {/* Capacete esquerdo */}
        <g filter="url(#divineGlow)">
          <path d="M15 22 L5 40 L5 68 L42 68 L42 35 Z" fill="url(#goldShine)" stroke="#B45309" strokeWidth="2.5"/>
          <path d="M17 25 L10 40 L10 63 L38 63 L38 38 Z" fill="url(#goldMetal)" opacity="0.7"/>
          {/* Aba lateral */}
          <path d="M5 40 L0 36 L0 62 L5 58 Z" fill="#D97706" stroke="#92400E" strokeWidth="1.5"/>
          {/* Visor */}
          <rect x="12" y="48" width="22" height="8" rx="2" fill="#92400E" opacity="0.8" stroke="#78350F" strokeWidth="1"/>
          <line x1="23" y1="48" x2="23" y2="56" stroke="#78350F" strokeWidth="1"/>
          {/* Crista */}
          <path d="M24 22 L20 12 L24 15 L28 8" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5"/>
          {/* Detalhes ornamentais */}
          <circle cx="26" cy="38" r="3" fill="#FEF3C7" opacity="0.9"/>
          <path d="M12 42 L10 38 L14 38 Z" fill="#FEF3C7" opacity="0.6"/>
        </g>
        
        {/* Capacete direito */}
        <g filter="url(#divineGlow)">
          <path d="M85 22 L95 40 L95 68 L58 68 L58 35 Z" fill="url(#goldShine)" stroke="#B45309" strokeWidth="2.5"/>
          <path d="M83 25 L90 40 L90 63 L62 63 L62 38 Z" fill="url(#goldMetal)" opacity="0.7"/>
          <path d="M95 40 L100 36 L100 62 L95 58 Z" fill="#D97706" stroke="#92400E" strokeWidth="1.5"/>
          <rect x="66" y="48" width="22" height="8" rx="2" fill="#92400E" opacity="0.8" stroke="#78350F" strokeWidth="1"/>
          <line x1="77" y1="48" x2="77" y2="56" stroke="#78350F" strokeWidth="1"/>
          <path d="M76 22 L80 12 L76 15 L72 8" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5"/>
          <circle cx="74" cy="38" r="3" fill="#FEF3C7" opacity="0.9"/>
          <path d="M88 42 L90 38 L86 38 Z" fill="#FEF3C7" opacity="0.6"/>
        </g>
        
        {/* Aura divina dourada */}
        <motion.g animate={{opacity: [0.3, 0.8, 0.3], scale: [0.9, 1.1, 0.9]}} transition={{duration: 3, repeat: Infinity}}>
          <circle cx="24" cy="12" r="14" fill="#FCD34D" opacity="0.4"/>
          <circle cx="76" cy="12" r="14" fill="#FCD34D" opacity="0.4"/>
          <circle cx="24" cy="5" r="9" fill="#FDE68A" opacity="0.3"/>
          <circle cx="76" cy="5" r="9" fill="#FDE68A" opacity="0.3"/>
        </motion.g>
        
        {/* Raios sagrados */}
        <motion.g animate={{opacity: [0.5, 1, 0.5]}} transition={{duration: 0.8, repeat: Infinity}}>
          <path d="M12 18 L18 5 L14 14 L22 2" stroke="#FEF3C7" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
          <path d="M88 18 L82 5 L86 14 L78 2" stroke="#FEF3C7" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        </motion.g>
        
        {/* Partículas brilhantes */}
        <motion.g animate={{opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8]}} transition={{duration: 2, repeat: Infinity, staggerChildren: 0.2}}>
          <circle cx="5" cy="42" r="3" fill="#FEF3C7"/>
          <circle cx="45" cy="28" r="2.5" fill="#FDE68A"/>
          <circle cx="95" cy="42" r="3" fill="#FEF3C7"/>
          <circle cx="55" cy="28" r="2.5" fill="#FDE68A"/>
          <circle cx="10" cy="30" r="2" fill="#FCD34D"/>
          <circle cx="90" cy="30" r="2" fill="#FCD34D"/>
        </motion.g>
      </svg>
    );
  }

  return null;
};

export default BadgeIcon;