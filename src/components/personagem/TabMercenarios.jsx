import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

export default function TabMercenarios({ data }) {
  if (!data) {
    return (
      <div className="text-center py-12 text-[#A9B2C7]">
        Nenhum mercenário disponível
      </div>
    );
  }

  // Get mercenaries array
  const mercenaries = data.active_mercenaries || [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Mercenários Recrutados</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {mercenaries.map((merc, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-6 hover:border-[#19E0FF]/40 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#19E0FF]/20 to-[#1A9FE8]/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-8 h-8 text-[#19E0FF]" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-1">{merc.name}</h3>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded text-[#19E0FF] text-xs">
                    {merc.role}
                  </span>
                  <span className="text-[#A9B2C7] text-sm">Nível {merc.level}</span>
                </div>
                <p className="text-[#A9B2C7] text-sm">{merc.usage}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}