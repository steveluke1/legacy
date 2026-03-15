import React from 'react';
import { motion } from 'framer-motion';
import { Feather, TrendingUp } from 'lucide-react';

export default function TabAsaArcana({ data }) {
  if (!data) {
    return (
      <div className="text-center py-12 text-[#A9B2C7]">
        Nenhuma Asa Arcana disponível
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Feather className="w-20 h-20 text-[#19E0FF] mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-white mb-2">Asa Arcana</h2>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="px-6 py-2 bg-[#9B59B6]/20 border border-[#9B59B6]/30 rounded-lg">
            <span className="text-[#9B59B6] font-bold text-lg">{data.grade}</span>
          </div>
          <div className="px-6 py-2 bg-[#19E0FF]/20 border border-[#19E0FF]/30 rounded-lg">
            <span className="text-[#19E0FF] font-bold text-lg">Nível {data.level}</span>
          </div>
        </div>
      </div>

      {/* Bonuses */}
      {data.bonuses && data.bonuses.length > 0 && (
        <div className="bg-gradient-to-r from-[#F7CE46]/10 to-[#FFD700]/10 border border-[#F7CE46]/30 rounded-lg p-6">
          <h3 className="text-xl font-bold text-[#F7CE46] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Bônus Ativos
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {data.bonuses.map((bonus, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="text-white py-2 px-4 bg-[#0C121C]/50 rounded"
              >
                • {bonus}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Techniques */}
      {data.techniques && data.techniques.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Técnicas Arcanas</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {data.techniques.map((technique, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-5 hover:border-[#19E0FF]/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#19E0FF]/20 flex items-center justify-center flex-shrink-0">
                    <Feather className="w-5 h-5 text-[#19E0FF]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-bold mb-1">{technique.name}</h4>
                    <p className="text-[#A9B2C7] text-sm">{technique.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}