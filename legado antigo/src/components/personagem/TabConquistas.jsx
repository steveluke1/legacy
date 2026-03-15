import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Search, Award } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function TabConquistas({ data }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  if (!data) {
    return (
      <div className="text-center py-12 text-[#A9B2C7]">
        Nenhuma conquista disponível
      </div>
    );
  }

  // Get achievements array
  const achievements = data.unlocked || [];
  const filteredAchievements = achievements.filter(a => {
    const matchesSearch = !searchTerm || a.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Conquistas Desbloqueadas</h2>
          <p className="text-[#A9B2C7]">Marcos alcançados em sua jornada</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B2C7]" />
          <Input
            placeholder="Pesquisar conquistas"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#0C121C] border-[#19E0FF]/20"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-[#19E0FF]/10 to-[#1A9FE8]/10 border border-[#19E0FF]/30 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[#A9B2C7] text-sm">Total de Conquistas</div>
            <div className="text-white font-bold text-2xl">{achievements.length}</div>
          </div>
          <div>
            <div className="text-[#A9B2C7] text-sm">Pontos de Conquista</div>
            <div className="text-[#F7CE46] font-bold text-2xl">{data.total_points || 0}</div>
          </div>
          <Award className="w-12 h-12 text-[#19E0FF]" />
        </div>
      </div>

      {/* Achievements List */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredAchievements.map((achievement, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-[#0C121C] border border-[#19E0FF]/30 rounded-lg p-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#19E0FF]/20">
                <Trophy className="w-6 h-6 text-[#19E0FF]" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold mb-1">{achievement.title}</h4>
                <p className="text-[#A9B2C7] text-sm mb-2">{achievement.description}</p>
                {achievement.reward && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-[#F7CE46]/10 border border-[#F7CE46]/30 rounded text-[#F7CE46]">
                      {achievement.reward}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}