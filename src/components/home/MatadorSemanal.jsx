import React from 'react';
import { motion } from 'framer-motion';
import { Skull, Trophy, Calendar } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useRankingMatador } from '@/components/hooks/useRankings';

export default function MatadorSemanal() {
  const { available, top3, prizes, periodLabel, isLoading, success } = useRankingMatador();

  const getMedalColor = (position) => {
    switch (position) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return '#A9B2C7';
    }
  };

  return (
    <div className="relative">
      <div className="max-w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF4B6A]/10 border border-[#FF4B6A]/30 rounded-full mb-6">
            <Skull className="w-6 h-6 text-[#FF4B6A]" />
            <span className="text-[#FF4B6A] font-bold text-sm uppercase tracking-wider">
              Matador da Semana
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Os Maiores Assassinos
          </h2>
          <p className="text-[#A9B2C7] text-lg mb-4">
            Mate mais na TG e conquiste prêmios em CASH!
          </p>
          {periodLabel && (
            <div className="flex items-center justify-center gap-2 text-[#A9B2C7]">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Período: {periodLabel}</span>
            </div>
          )}
        </motion.div>

        {/* Awards Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <GlowCard className="p-6 bg-gradient-to-r from-[#FFD700]/10 to-[#19E0FF]/5" glowColor="#FFD700">
            <h3 className="text-xl font-bold text-white text-center mb-6 flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-[#FFD700]" />
              Premiação em CASH
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {prizes.slice(0, 3).map((award, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    boxShadow: [
                      `0 0 15px ${award.color}40`,
                      `0 0 25px ${award.color}60`,
                      `0 0 15px ${award.color}40`
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-4 bg-[#0C121C] border rounded-lg text-center"
                  style={{ borderColor: `${award.color}40` }}
                >
                  <p className="text-[#A9B2C7] text-xs mb-1">{award.place}º Lugar</p>
                  <p className="text-2xl font-black" style={{ color: award.color }}>
                    {award.value}
                  </p>
                </motion.div>
              ))}
            </div>
          </GlowCard>
        </motion.div>

        {/* Top 3 Cards or Empty State */}
        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <GlowCard className="p-6 text-center">
                  <div className="h-12 bg-[#19E0FF]/20 rounded mb-4" />
                  <div className="h-6 bg-[#19E0FF]/10 rounded mb-2" />
                  <div className="h-4 bg-[#19E0FF]/10 rounded mb-4" />
                  <div className="flex justify-around">
                    <div className="h-8 w-16 bg-[#19E0FF]/10 rounded" />
                    <div className="h-8 w-16 bg-[#19E0FF]/10 rounded" />
                  </div>
                </GlowCard>
              </div>
            ))}
          </div>
        ) : (!available || !success || top3.length === 0) ? (
          <div className="mb-8">
            <GlowCard className="p-12 text-center">
              <Skull className="w-16 h-16 text-[#FF4B6A]/40 mx-auto mb-4" />
              <p className="text-[#A9B2C7] text-lg">
                {!available ? 'Dados indisponíveis no momento' : 'Ranking em breve'}
              </p>
              <p className="text-[#A9B2C7]/60 text-sm mt-2">
                {!available ? 'Rankings serão exibidos quando houver dados reais disponíveis' : 'Os primeiros matadores aparecerão aqui em breve'}
              </p>
            </GlowCard>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {top3.map((player, idx) => (
              <motion.div
                key={player.character_name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={player.position === 1 ? 'md:scale-105' : ''}
              >
                <GlowCard 
                  className="p-6 text-center"
                  glowColor={getMedalColor(player.position)}
                >
                  {player.position === 1 && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-[#FFD700]/20 blur-xl -z-10 rounded-xl"
                    />
                  )}
                  <div className="text-5xl font-black mb-2" style={{ color: getMedalColor(player.position) }}>
                    #{player.position}
                  </div>
                  <h4 className="text-xl font-bold text-white mb-1">{player.character_name}</h4>
                  <p className="text-[#F7CE46] text-sm mb-4">{player.guild_name}</p>
                  <div className="flex justify-around text-center">
                    <div>
                      <p className="text-[#A9B2C7] text-xs">Nação</p>
                      <p className="text-[#19E0FF] font-bold text-sm">{player.nation}</p>
                    </div>
                    <div>
                      <p className="text-[#A9B2C7] text-xs">Kills</p>
                      <p className="text-[#FF4B6A] font-bold">{player.kills}</p>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Ver ranking completo */}
        <div className="text-center">
          <Link to={createPageUrl('RankingMatadorSemanal')}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-[#FF4B6A] to-[#FFD700] text-[#05070B] font-bold rounded-lg hover:shadow-lg hover:shadow-[#FF4B6A]/30 transition-all"
            >
              Ver Ranking Completo
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  );
}