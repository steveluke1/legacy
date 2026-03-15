import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Map, Swords, TrendingUp } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import SectionTitle from '@/components/ui/SectionTitle';

const features = [
  {
    icon: Zap,
    title: 'Combos, BM e Explosão de Dano',
    description: 'Sistema de combate refinado com combos fluidos, Battle Mode otimizado e dano satisfatório. Sinta cada hit conectar.',
    color: '#19E0FF'
  },
  {
    icon: Map,
    title: 'DGs com Ranking e Tempo',
    description: 'Dungeons desafiadoras com sistema de ranking por tempo. Compita com outros jogadores e mostre sua maestria.',
    color: '#F7CE46'
  },
  {
    icon: Swords,
    title: 'TG e PvP Ranqueado',
    description: 'Tierra Gloriosa equilibrada e sistema de PvP com ranking de honra. Batalhas épicas entre Capella e Procyon.',
    color: '#FF4B6A'
  },
  {
    icon: TrendingUp,
    title: 'Progressão Moderna',
    description: 'Economia balanceada, drops justos e progressão que respeita seu tempo. A essência do CABAL com melhorias de 2025.',
    color: '#1A9FE8'
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-[#0C121C]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle 
          title="Por que Legacy of Nevareth?"
          subtitle="Descubra o que torna nossa experiência única em Nevareth"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <GlowCard className="p-6 h-full" glowColor={feature.color}>
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${feature.color}15` }}
                >
                  <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-[#A9B2C7] leading-relaxed">{feature.description}</p>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}