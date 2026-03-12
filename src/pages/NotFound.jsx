import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { AlertTriangle, Home } from 'lucide-react';
import MetalButton from '@/components/ui/MetalButton';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#05070B] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="w-24 h-24 mx-auto mb-8 rounded-full bg-[#FF4B6A]/20 flex items-center justify-center border-2 border-[#FF4B6A]/30"
        >
          <AlertTriangle className="w-12 h-12 text-[#FF4B6A]" />
        </motion.div>

        {/* Error Code */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-8xl font-bold text-[#19E0FF] mb-4"
        >
          404
        </motion.h1>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white mb-4"
        >
          Página não encontrada
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[#A9B2C7] text-lg mb-8"
        >
          A página que você está procurando não existe ou foi movida.
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to={createPageUrl('HomeNevareth')}>
            <MetalButton variant="primary" size="lg">
              <Home className="w-5 h-5 mr-2" />
              Voltar para Início
            </MetalButton>
          </Link>
          <Link to={createPageUrl('Suporte')}>
            <MetalButton variant="secondary" size="lg">
              Suporte
            </MetalButton>
          </Link>
        </motion.div>

        {/* Additional Help */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 pt-8 border-t border-[#19E0FF]/20"
        >
          <p className="text-[#A9B2C7] text-sm mb-4">
            Links úteis:
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to={createPageUrl('Wiki')} className="text-[#19E0FF] hover:text-[#0097d8] text-sm transition-colors">
              Wiki
            </Link>
            <Link to={createPageUrl('Ranking')} className="text-[#19E0FF] hover:text-[#0097d8] text-sm transition-colors">
              Rankings
            </Link>
            <Link to={createPageUrl('Guildas')} className="text-[#19E0FF] hover:text-[#0097d8] text-sm transition-colors">
              Guildas
            </Link>
            <Link to={createPageUrl('Loja')} className="text-[#19E0FF] hover:text-[#0097d8] text-sm transition-colors">
              Loja
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}