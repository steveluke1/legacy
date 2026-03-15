import React from 'react';
import { motion } from 'framer-motion';
import { Award, Star } from 'lucide-react';

export default function TabMerito({ data }) {
  if (!data) {
    return (
      <div className="text-center py-12 text-[#A9B2C7]">
        Nenhum dado de mérito disponível
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#19E0FF]/20 to-[#1A9FE8]/20 border border-[#19E0FF]/30 rounded-lg p-6">
          <div className="text-[#19E0FF] text-sm mb-1">Rank de Mérito</div>
          <div className="text-white font-bold text-2xl">{data.rank}</div>
        </div>
        <div className="bg-gradient-to-br from-[#F7CE46]/20 to-[#FFD700]/20 border border-[#F7CE46]/30 rounded-lg p-6">
          <div className="text-[#F7CE46] text-sm mb-1">Pontos Gastos</div>
          <div className="text-white font-bold text-2xl">{data.points_spent}</div>
        </div>
        <div className="bg-gradient-to-br from-[#9B59B6]/20 to-[#8E44AD]/20 border border-[#9B59B6]/30 rounded-lg p-6">
          <div className="text-[#9B59B6] text-sm mb-1">Pontos Disponíveis</div>
          <div className="text-white font-bold text-2xl">{data.points_available}</div>
        </div>
      </div>

      {/* Bonuses */}
      {data.active_investments && data.active_investments.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Investimentos Ativos</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {data.active_investments.map((investment, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-4 hover:border-[#19E0FF]/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-bold">{investment.category}</span>
                  <span className="text-[#A9B2C7] text-sm">Nível {investment.level}</span>
                </div>
                <div className="text-[#19E0FF] text-sm">{investment.bonus}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}