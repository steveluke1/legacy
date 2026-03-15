import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Trophy, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function EntryButtons({ visible = false }) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.5, delay: 0.5 }}
      className="relative z-50 pointer-events-auto flex flex-col items-center gap-6"
    >
      {/* Primary CTA */}
      <Link to={createPageUrl('Home')}>
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(25, 224, 255, 0.4)' }}
          whileTap={{ scale: 0.98 }}
          className="group relative px-12 py-5 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-black text-lg rounded-xl overflow-hidden shadow-2xl shadow-[#19E0FF]/30"
        >
          <motion.div
            className="absolute inset-0 bg-white/20"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6 }}
          />
          <span className="relative flex items-center gap-3">
            ENTRAR EM NEVARETH
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </span>
        </motion.button>
      </Link>

      {/* Secondary CTAs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link to={createPageUrl('Ranking')}>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ y: -2 }}
            className="px-8 py-3 bg-[#0C121C]/80 border-2 border-[#19E0FF]/30 text-[#19E0FF] font-bold rounded-lg hover:border-[#19E0FF]/60 transition-all backdrop-blur-sm flex items-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            Ver Rankings
          </motion.button>
        </Link>

        <Link to={createPageUrl('Registrar')}>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            whileHover={{ y: -2 }}
            className="px-8 py-3 bg-[#0C121C]/80 border-2 border-[#F7CE46]/30 text-[#F7CE46] font-bold rounded-lg hover:border-[#F7CE46]/60 transition-all backdrop-blur-sm flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Criar Conta
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}