import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trophy, Medal, Flame, Skull, Target, Calendar, ArrowLeft } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import CrystalBorder from '@/components/ui/CrystalBorder';
import { Skeleton } from '@/components/ui/skeleton';

export default function RankingPageTemplate({
  type, // 'corredores' | 'matador'
  pageTitle,
  pageSubtitle,
  periodLabel,
  prizeType, // 'BRL' | 'CASH'
  prizes, // array of { place, value, color }
  top3, // top 3 players
  restOfRanking, // remaining players
  columns, // array of column configs
  isLoading,
  showBackButton = false
}) {
  const TypeIcon = type === 'corredores' ? Flame : Skull;
  const typeColor = type === 'corredores' ? '#FF4B6A' : '#FF4B6A';

  const getMedalColor = (position) => {
    switch (position) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return '#A9B2C7';
    }
  };

  const getCrownIcon = (position) => {
    if (position === 1) return <Trophy className="w-8 h-8 text-[#FFD700]" />;
    if (position === 2) return <Medal className="w-7 h-7 text-[#C0C0C0]" />;
    if (position === 3) return <Medal className="w-6 h-6 text-[#CD7F32]" />;
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-16 w-full bg-[#19E0FF]/10 mb-8" />
          <Skeleton className="h-64 w-full bg-[#19E0FF]/10 mb-8" />
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full bg-[#19E0FF]/10" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4 relative overflow-hidden">
      {/* Background effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FF4B6A]/10 via-[#FFD700]/5 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Back button */}
        {showBackButton && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link
              to={createPageUrl('Home')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0C121C] border border-[#19E0FF]/30 text-[#19E0FF] rounded-lg hover:bg-[#19E0FF]/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Home
            </Link>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF4B6A]/10 border border-[#FF4B6A]/30 rounded-full mb-6">
            <TypeIcon className="w-6 h-6" style={{ color: typeColor }} />
            <span className="font-bold text-sm uppercase tracking-wider" style={{ color: typeColor }}>
              {pageSubtitle}
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
            {pageTitle}
          </h1>
          <p className="text-xl text-[#A9B2C7] max-w-3xl mx-auto mb-6">
            {type === 'corredores' 
              ? 'Quem dominar as dungeons conquista reconhecimento real!'
              : 'Os guerreiros mais letais da TG desta semana'}
          </p>
          <div className="flex items-center justify-center gap-2 text-[#A9B2C7]">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Período: {periodLabel}</span>
          </div>
        </motion.div>

        {/* Awards Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <GlowCard className="p-8 bg-gradient-to-r from-[#FFD700]/10 to-[#19E0FF]/5" glowColor="#FFD700">
            <h2 className="text-2xl font-bold text-white text-center mb-6 flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-[#FFD700]" />
              Premiação {prizeType === 'BRL' ? 'Real' : 'em CASH'}
            </h2>
            <div className={`grid gap-6 ${prizes.length === 5 ? 'md:grid-cols-5' : 'md:grid-cols-3'}`}>
              {prizes.map((award, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    boxShadow: [
                      `0 0 20px ${award.color}40`,
                      `0 0 30px ${award.color}60`,
                      `0 0 20px ${award.color}40`
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-6 bg-[#0C121C] border rounded-lg text-center"
                  style={{ borderColor: `${award.color}40` }}
                >
                  <p className="text-[#A9B2C7] text-sm mb-2">{award.place}º Lugar</p>
                  <motion.p
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-3xl font-black"
                    style={{ color: award.color }}
                  >
                    {award.value}
                  </motion.p>
                </motion.div>
              ))}
            </div>
          </GlowCard>
        </motion.div>

        {/* Top 3 Podium */}
        {top3.length > 0 && (
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[top3[1], top3[0], top3[2]].filter(Boolean).map((player, idx) => {
              const actualPosition = player.position;
              const heightClass = actualPosition === 1 ? 'md:mt-0' : 'md:mt-12';
              const tierMap = {
                1: 'Legendary Arch-Crystal',
                2: 'Platinum Crystal',
                3: 'Bronze Crystal'
              };

              return (
                <motion.div
                  key={player.player_name || player.character_name}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.2 }}
                  className={heightClass}
                >
                  <CrystalBorder tier={tierMap[actualPosition]} showLabel={false}>
                    <div className="p-8 text-center relative">
                      {actualPosition === 1 && (
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="absolute -top-6 left-1/2 -translate-x-1/2"
                        >
                          <div className="relative">
                            <Flame className="w-16 h-16 text-[#FF4B6A]" />
                            <div className="absolute inset-0 bg-[#FF4B6A]/30 blur-xl" />
                          </div>
                        </motion.div>
                      )}

                      <div className="mb-4 mt-4">
                        {getCrownIcon(actualPosition)}
                      </div>

                      <div className="text-6xl font-black mb-2" style={{ color: getMedalColor(actualPosition) }}>
                        #{actualPosition}
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-1">
                        {player.player_name || player.character_name}
                      </h3>
                      <p className="text-[#F7CE46] text-sm mb-4">{player.guild || player.guild_name}</p>

                      <div className="space-y-2">
                        {columns.map((col, colIdx) => (
                          <div key={colIdx} className="flex items-center justify-between px-4 py-2 bg-[#05070B] rounded-lg">
                            <span className="text-[#A9B2C7] text-sm">{col.label}:</span>
                            <span className="font-bold text-lg" style={{ color: col.valueColor }}>
                              {player[col.key]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CrystalBorder>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Rest of ranking */}
        {restOfRanking.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <GlowCard className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#19E0FF]/10">
                      <th className="text-left py-4 px-4 text-[#A9B2C7] font-medium text-sm">#</th>
                      <th className="text-left py-4 px-4 text-[#A9B2C7] font-medium text-sm">Jogador</th>
                      <th className="text-left py-4 px-4 text-[#A9B2C7] font-medium text-sm hidden sm:table-cell">Guilda</th>
                      {columns.map((col, colIdx) => (
                        <th key={colIdx} className="text-right py-4 px-4 text-[#A9B2C7] font-medium text-sm">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {restOfRanking.map((player, index) => (
                      <motion.tr
                        key={player.player_name || player.character_name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-[#19E0FF]/5 hover:bg-[#19E0FF]/5 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <span className="text-[#A9B2C7] font-medium">{player.position}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-white font-medium">{player.player_name || player.character_name}</span>
                        </td>
                        <td className="py-4 px-4 hidden sm:table-cell">
                          <span className="text-[#F7CE46] text-sm">{player.guild || player.guild_name}</span>
                        </td>
                        {columns.map((col, colIdx) => (
                          <td key={colIdx} className="py-4 px-4 text-right">
                            <span className="font-bold" style={{ color: col.valueColor }}>
                              {player[col.key]}
                            </span>
                          </td>
                        ))}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlowCard>
          </motion.div>
        )}

        {/* Empty state */}
        {top3.length === 0 && restOfRanking.length === 0 && (
          <div className="text-center py-20">
            <Target className="w-20 h-20 text-[#A9B2C7]/30 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">Ainda ninguém registrou nesta semana!</h3>
            <p className="text-[#A9B2C7]">Volte mais tarde e participe do ranking!</p>
          </div>
        )}
      </div>
    </div>
  );
}