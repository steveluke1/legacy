import React from 'react';
import { motion } from 'framer-motion';
import { Hammer, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function TabCriacao({ data }) {
  if (!data) {
    return (
      <div className="text-center py-12 text-[#A9B2C7]">
        Nenhum dado de criação disponível
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#19E0FF]/10 to-[#1A9FE8]/10 border border-[#19E0FF]/30 rounded-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          <Hammer className="w-8 h-8 text-[#19E0FF]" />
          <div>
            <h3 className="text-xl font-bold text-white">Artesão e Criação</h3>
            <div className="flex items-center gap-4 mt-2">
              <div>
                <span className="text-[#A9B2C7] text-sm">Nível de Criação: </span>
                <span className="text-[#19E0FF] font-bold">{data.crafting_level}</span>
              </div>
              <div>
                <span className="text-[#A9B2C7] text-sm">Taxa de Sucesso: </span>
                <span className="text-[#F7CE46] font-bold">{data.success_rate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-4">
          <div className="text-[#A9B2C7] text-sm mb-1">Itens criados (últimos 7 dias)</div>
          <div className="text-[#19E0FF] font-bold text-2xl">{data.items_created_last_7_days || 0}</div>
        </div>
        <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-4">
          <div className="text-[#A9B2C7] text-sm mb-1">Falhas recentes</div>
          <div className="text-[#FF4B6A] font-bold text-2xl">{data.fails_last_7_days || 0}</div>
        </div>
        <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-4">
          <div className="text-[#A9B2C7] text-sm mb-1">Taxa de Sucesso</div>
          <div className="text-[#F7CE46] font-bold text-2xl">{data.success_rate || 0}%</div>
        </div>
      </div>

      {/* Specialties */}
      {data.specialties && data.specialties.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Especialidades de Criação</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {data.specialties.map((specialty, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-4 flex items-center gap-3"
              >
                <Hammer className="w-5 h-5 text-[#19E0FF]" />
                <span className="text-white">{specialty}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}