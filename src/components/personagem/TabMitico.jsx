import React from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp } from 'lucide-react';

export default function TabMitico({ data }) {
  if (!data) {
    return (
      <div className="text-center py-12 text-[#A9B2C7]">
        Nenhum dado mítico disponível
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-[#9B59B6]/20 to-[#8E44AD]/20 border border-[#9B59B6]/30 rounded-lg p-6">
          <Zap className="w-8 h-8 text-[#9B59B6] mb-3" />
          <div className="text-[#9B59B6] text-sm mb-1">Calabouços Míticos Concluídos</div>
          <div className="text-white font-bold text-2xl">{data.dungeons_cleared || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-[#F7CE46]/20 to-[#FFD700]/20 border border-[#F7CE46]/30 rounded-lg p-6">
          <TrendingUp className="w-8 h-8 text-[#F7CE46] mb-3" />
          <div className="text-[#F7CE46] text-sm mb-1">Itens Míticos Equipados</div>
          <div className="text-white font-bold text-2xl">{data.items_equipped || 0}</div>
        </div>
      </div>

      {/* Mythic Items */}
      {data.items && data.items.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#FFD700]" />
            Itens Míticos
          </h3>
          <div className="grid gap-3">
            {data.items.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gradient-to-r from-[#9B59B6]/10 to-[#8E44AD]/10 border border-[#9B59B6]/30 rounded-lg p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-[#FFD700]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-bold text-lg">{item.name}</div>
                    <div className="text-[#A9B2C7] text-sm mt-1">{item.description}</div>
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