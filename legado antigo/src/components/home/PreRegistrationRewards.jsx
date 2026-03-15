import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Calendar, Award } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import MetalButton from '@/components/ui/MetalButton';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const REWARDS_LIST = [
  'k-red (7 dias)',
  'Perola de exp 1000% (1 dia)',
  'Amuleto da dor +6 (7 dias)',
  'Anel da sorte +2 x2 (7 dias)',
  'anel critico +2 x2 (7 dias)',
  'Bracelet e brinco +5 (7 dias)',
  'Dragona raro sabio e lutador (7 dias)',
  'talisma de ambar +3 (7 dias)',
  'Arcana do guardiao +7 (7 dias)',
  'arcana do caos +7 (7 dias)',
  'cornalina +9 (7 dias)',
  'talisma do caos +5 (7 dias)',
  'cinto sabio e lutador +7 (7 dias)',
  'agua sagrada heroica x50 (7 dias)',
  'agua sagrada extrema x50 (7 dias)',
  'poçao de perfurar x50 expiraçao (7 dias)',
  'bençao do GM (nv3) x30 expiraçao (7 dias)',
  'poçao hp e mp nv4 + nucleo guia (7 dias)',
  'poçao de furia (nv3) x50 (7 dias)'
];

// Helper to chunk rewards into columns
const chunkRewards = (items, chunkSize = 5) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
};


export default function PreRegistrationRewards() {
  const navigate = useNavigate();
  const rewardColumns = chunkRewards(REWARDS_LIST, 5);

  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <span className="text-3xl">🎁</span>
            Recompensas de Pré-Registro
          </h2>
          <p className="text-[#A9B2C7] text-lg max-w-2xl mx-auto">
            Bônus de pré-lançamento exclusivo: crie sua conta antes do lançamento para garantir. Após o lançamento, não ficará disponível.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 max-w-6xl mx-auto"
        >
          <GlowCard className="p-8 bg-gradient-to-br from-[#0C121C] to-[#05070B]">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#19E0FF]/20 flex items-center justify-center">
                <Award className="w-8 h-8 text-[#19E0FF]" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-[#19E0FF] text-center mb-8">
              Pré-Registro 14 Dias — recompensas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {rewardColumns.map((column, colIdx) => (
                <ul key={colIdx} className="space-y-2">
                  {column.map((item, itemIdx) => (
                    <li
                      key={itemIdx}
                      className="flex items-start gap-2 text-white"
                    >
                      <span className="text-[#19E0FF] mt-1 flex-shrink-0">•</span>
                      <span className="text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </GlowCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <MetalButton
            onClick={() => navigate(createPageUrl('Registrar'))}
            size="lg"
            className="px-12"
          >
            Garantir minhas recompensas
          </MetalButton>
        </motion.div>
      </div>
    </section>
  );
}