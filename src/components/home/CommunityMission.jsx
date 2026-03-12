import React from 'react';
import { motion } from 'framer-motion';
import GlowCard from '@/components/ui/GlowCard';

const EARLY_LOGIN_REWARDS = [
{
  tierLabel: 'Top 10 primeiros a logar no jogo',
  rewardName: 'Mercenário Yuan',
  icon: '🏆',
  gradient: 'from-[#FFD700]/20 to-[#F7CE46]/20',
  borderColor: 'border-[#FFD700]/50'
},
{
  tierLabel: 'Top 50 primeiros a logar no jogo',
  rewardName: '1.500 gemas',
  icon: '🥈',
  gradient: 'from-[#C0C0C0]/20 to-[#A9B2C7]/20',
  borderColor: 'border-[#C0C0C0]/50'
},
{
  tierLabel: 'Top 100 primeiros a logar no jogo',
  rewardName: '30k de WEXP',
  icon: '🥉',
  gradient: 'from-[#CD7F32]/20 to-[#8B4513]/20',
  borderColor: 'border-[#CD7F32]/50'
}];


export default function CommunityMission() {
  return (
    <section className="py-20 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}>

          <GlowCard className="p-8 bg-gradient-to-br from-[#0C121C] to-[#05070B]">
            <h2 className="text-center text-white text-3xl md:text-4xl font-bold mb-8">
              🎁 Recompensas por ordem de chegada
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {EARLY_LOGIN_REWARDS.map((reward, index) =>
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className={`bg-gradient-to-br ${reward.gradient} border ${reward.borderColor} rounded-lg p-4`}>

                  <div className="text-center">
                    <div className="text-3xl mb-2">{reward.icon}</div>
                    <p className="text-white font-semibold text-sm mb-2">
                      {reward.tierLabel}
                    </p>
                    <div className="pt-2 border-t border-white/20">
                      <p className="text-[#19E0FF] font-bold text-sm">
                        Ganha: {reward.rewardName}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <p className="text-center text-[#F7CE46] text-sm font-semibold">Corra: as recompensas são limitadas— e os 10 primeiros ganham as 3 recompensas.

            </p>
          </GlowCard>
        </motion.div>
      </div>
    </section>);

}