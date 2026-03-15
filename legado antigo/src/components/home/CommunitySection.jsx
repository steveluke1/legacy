import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Youtube, Twitch, ExternalLink } from 'lucide-react';
import SectionTitle from '@/components/ui/SectionTitle';
import GlowCard from '@/components/ui/GlowCard';

const communities = [
  {
    name: 'Discord',
    description: 'Junte-se à nossa comunidade no Discord. Tire dúvidas, encontre grupos e fique por dentro das novidades.',
    icon: MessageCircle,
    color: '#5865F2',
    link: 'https://discord.gg/cabalziron',
    members: '5.000+'
  },
  {
    name: 'YouTube',
    description: 'Tutoriais, gameplays, builds e atualizações. Inscreva-se no nosso canal oficial.',
    icon: Youtube,
    color: '#FF0000',
    link: 'https://youtube.com/@cabalziron',
    members: '2.500+'
  },
  {
    name: 'Twitch',
    description: 'Assista streams ao vivo de TG, DGs e eventos especiais da comunidade Legacy of Nevareth.',
    icon: Twitch,
    color: '#9146FF',
    link: 'https://twitch.tv/cabalziron',
    members: '1.200+'
  }
];

export default function CommunitySection() {
  return (
    <section className="py-20 bg-[#0C121C]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle 
          title="Comunidade Legacy of Nevareth"
          subtitle="Conecte-se com milhares de jogadores apaixonados por CABAL"
        />

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {communities.map((community, index) => (
            <motion.a
              key={index}
              href={community.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="block"
            >
              <GlowCard className="p-6 h-full group" glowColor={community.color}>
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${community.color}20` }}
                  >
                    <community.icon className="w-7 h-7" style={{ color: community.color }} />
                  </div>
                  <ExternalLink className="w-5 h-5 text-[#A9B2C7] group-hover:text-white transition-colors" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{community.name}</h3>
                <p className="text-[#A9B2C7] text-sm leading-relaxed mb-4">{community.description}</p>
                
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: community.color }}
                  />
                  <span className="text-sm font-medium" style={{ color: community.color }}>
                    {community.members} membros
                  </span>
                </div>
              </GlowCard>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}