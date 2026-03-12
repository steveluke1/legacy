import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Coins } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';

// Prize data must come from real configuration
const PRIZE_DATA = {
  totalBRL: 3700.00,  // REAL configured value for first month
  totalCash: 70000,   // REAL configured value for first month
  description: 'Premiações semanais dos rankings de Kill e DGs.'
};

export default function PrizeCounter() {
  const formatBRL = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatCash = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  return (
    <section className="py-12 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <GlowCard className="p-8 text-center bg-gradient-to-br from-[#0C121C] to-[#05070B]">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 flex items-center justify-center gap-3">
              <span className="text-2xl">🔥</span>
              PREMIAÇÃO TOTAL PARA O PRIMEIRO MES DE LANÇAMENTO
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-[#05070B]/50 border border-[#19E0FF]/30 rounded-xl p-6"
              >
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Trophy className="w-8 h-8 text-[#F7CE46]" />
                  <span className="text-[#A9B2C7] text-sm uppercase tracking-wide">
                    Prêmios em Dinheiro
                  </span>
                </div>
                <div className="text-4xl md:text-5xl font-black text-[#F7CE46]">
                  {formatBRL(PRIZE_DATA.totalBRL)}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                className="bg-[#05070B]/50 border border-[#19E0FF]/30 rounded-xl p-6"
              >
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Coins className="w-8 h-8 text-[#19E0FF]" />
                  <span className="text-[#A9B2C7] text-sm uppercase tracking-wide">
                    CASH In-Game
                  </span>
                </div>
                <div className="text-4xl md:text-5xl font-black text-[#19E0FF]">
                  +{formatCash(PRIZE_DATA.totalCash)}
                </div>
              </motion.div>
            </div>

            <p className="text-[#A9B2C7] text-lg">
              {PRIZE_DATA.description}
            </p>
          </GlowCard>
        </motion.div>
      </div>
    </section>
  );
}