import React from 'react';
import { motion } from 'framer-motion';

export default function TabRunas({ data }) {
  if (!data) {
    return (
      <div className="text-center py-12 text-[#A9B2C7]">
        Nenhuma runa disponível
      </div>
    );
  }

  // Get runes array
  const runesArray = data.essence_runes || [];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold mb-4 pb-2 border-b text-[#19E0FF] border-[#19E0FF]/40">
          Runas de Essência
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {runesArray.map((rune, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-4 hover:border-[#19E0FF]/40 transition-colors"
            >
              <div className="text-white font-bold mb-1">{rune.name}</div>
              <div className="text-[#A9B2C7] text-sm mb-2">Nível {rune.level}</div>
              <div className="text-[#19E0FF] text-sm">{rune.effect}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}