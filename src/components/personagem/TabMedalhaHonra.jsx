import React from 'react';
import { motion } from 'framer-motion';
import { Medal, Star } from 'lucide-react';

export default function TabMedalhaHonra({ data }) {
  if (!data) {
    return (
      <div className="text-center py-12 text-[#A9B2C7]">
        Nenhuma medalha de honra disponível
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <Medal className="w-20 h-20 text-[#FFD700] mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-2">Medalha de Honra</h2>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="text-center">
            <div className="text-[#A9B2C7] text-sm">Rank de Honra</div>
            <div className="text-[#F7CE46] font-bold text-3xl">{data.honor_rank}</div>
            {data.honor_title && (
              <div className="text-[#19E0FF] text-sm mt-1">{data.honor_title}</div>
            )}
          </div>
          <div className="h-12 w-px bg-[#19E0FF]/20" />
          <div className="text-center">
            <div className="text-[#A9B2C7] text-sm">WEXP Total</div>
            <div className="text-[#19E0FF] font-bold text-2xl">{data.wexp_total?.toLocaleString() || '0'}</div>
          </div>
        </div>
      </div>

      {/* Special Ability */}
      {data.special_ability && (
        <div className="bg-gradient-to-r from-[#9B59B6]/10 to-[#8E44AD]/10 border border-[#9B59B6]/30 rounded-lg p-6">
          <h3 className="text-[#9B59B6] font-bold text-lg mb-2">Habilidade Especial Desbloqueada</h3>
          <p className="text-white text-lg">{data.special_ability}</p>
        </div>
      )}

      {/* Active Bonuses */}
      {data.bonuses && data.bonuses.length > 0 && (
        <div className="bg-gradient-to-r from-[#F7CE46]/10 to-[#FFD700]/10 border border-[#F7CE46]/30 rounded-lg p-6">
          <h3 className="text-xl font-bold text-[#F7CE46] mb-4 flex items-center gap-2">
            <Star className="w-5 h-5" />
            Bônus Ativos
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {data.bonuses.map((bonus, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="text-white py-3 px-4 bg-[#0C121C]/50 rounded-lg border border-[#F7CE46]/20"
              >
                • {bonus}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}