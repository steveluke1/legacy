import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const navItems = [
  { label: 'Portal', path: 'Home' },
  { label: 'Rankings', path: 'Ranking' },
  { label: 'Wiki', path: 'Wiki' },
  { label: 'Mercado', path: 'Mercado' },
  { label: 'Comunidade', path: 'Guildas' },
  { label: 'Suporte', path: 'Suporte' }
];

export default function MinimalNav({ visible = true }) {
  if (!visible) return null;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.5 }}
      className="fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
    >
      <div className="flex items-center gap-1 px-4 py-2 bg-[#0C121C]/60 backdrop-blur-md border border-[#19E0FF]/20 rounded-full">
        {navItems.map((item, index) => (
          <Link
            key={index}
            to={createPageUrl(item.path)}
            className="px-4 py-2 text-sm text-[#A9B2C7] hover:text-[#19E0FF] transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </motion.nav>
  );
}