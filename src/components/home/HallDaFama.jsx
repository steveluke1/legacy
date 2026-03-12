import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Crown, Swords, Target, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GlowCard from '@/components/ui/GlowCard';

export default function HallDaFama() {
  const { data, isLoading } = useQuery({
    queryKey: ['weekly-champion'],
    queryFn: async () => {
      const res = await base44.functions.invoke('hallGetWeeklyChampion', {});
      if (!res.data || !res.data.success) {
        throw new Error(res.data?.error || 'Erro ao carregar campeão');
      }
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Show empty state if no real data
  const champion = data?.data?.champion || data?.champion;
  const weekRange = data?.data?.week_range || data?.week_range;
  const available = data?.data?.available !== false;

  // If no champion data or not available, show empty state
  if (!available || !champion) {
    return (
      <div className="relative">
        <div className="max-w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-full mb-6">
              <Trophy className="w-6 h-6 text-[#FFD700]" />
              <span className="text-[#FFD700] font-bold text-sm uppercase tracking-wider">
                Hall da Fama
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Conquistas Históricas
            </h2>
            <p className="text-[#A9B2C7] text-lg">
              Reconhecimento aos maiores guerreiros de Nevareth
            </p>
          </motion.div>

          <GlowCard className="p-12 text-center">
            <Trophy className="w-16 h-16 text-[#FFD700]/40 mx-auto mb-4" />
            <p className="text-[#A9B2C7] text-lg">
              {!available ? 'Dados indisponíveis no momento' : 'Sem dados no momento'}
            </p>
            <p className="text-[#A9B2C7]/60 text-sm mt-2">
              {!available ? 'O Hall da Fama será exibido quando houver dados reais disponíveis' : 'O Hall da Fama será exibido após as primeiras conquistas serem registradas'}
            </p>
          </GlowCard>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="max-w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-full mb-6">
            <Trophy className="w-6 h-6 text-[#FFD700]" />
            <span className="text-[#FFD700] font-bold text-sm uppercase tracking-wider">
              Hall da Fama
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Conquistas Históricas
          </h2>
          <p className="text-[#A9B2C7] text-lg">
            Reconhecimento aos maiores guerreiros de Nevareth
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative"
        >
          <GlowCard className="p-12 bg-gradient-to-br from-[#FFD700]/5 to-transparent" glowColor="#FFD700">
            <div className="text-center">
              {/* Crown decoration */}
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="inline-block mb-6"
              >
                <Crown className="w-20 h-20 text-[#FFD700] drop-shadow-[0_0_15px_rgba(247,206,70,0.5)]" />
              </motion.div>

              <div className="mb-6">
                <p className="text-[#F7CE46] text-sm font-bold uppercase tracking-wider mb-3">
                  Maior Destaque da Semana
                </p>
                <h3 className="text-5xl md:text-6xl font-black text-white mb-2 relative inline-block">
                  {champion.player_name}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-[#FFD700]/20 blur-2xl -z-10"
                  />
                </h3>
                {champion.guild && (
                  <p className="text-[#19E0FF] text-xl font-bold">
                    {champion.guild}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-8 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-[#FFD700]" />
                  </div>
                  <div className="text-left">
                    <p className="text-[#A9B2C7] text-sm">Pontos Acumulados</p>
                    <p className="text-3xl font-bold text-white">{champion.points.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-[#FF4B6A]/20 flex items-center justify-center">
                    <Swords className="w-8 h-8 text-[#FF4B6A]" />
                  </div>
                  <div className="text-left">
                    <p className="text-[#A9B2C7] text-sm">Kills em TG</p>
                    <p className="text-3xl font-bold text-white">{champion.kills_registered}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-[#19E0FF]/20 flex items-center justify-center">
                    <Target className="w-8 h-8 text-[#19E0FF]" />
                  </div>
                  <div className="text-left">
                    <p className="text-[#A9B2C7] text-sm">DGs Concluídas</p>
                    <p className="text-3xl font-bold text-white">{champion.dg_concluded}</p>
                  </div>
                </div>
              </div>

              {weekRange && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0C121C] border border-[#F7CE46]/30 rounded-lg">
                  <Trophy className="w-4 h-4 text-[#F7CE46]" />
                  <span className="text-[#A9B2C7] text-sm">
                    Período: {weekRange}
                  </span>
                </div>
              )}
            </div>
          </GlowCard>
        </motion.div>
      </div>
    </div>
  );
}