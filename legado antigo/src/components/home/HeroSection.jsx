import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ChevronRight, Trophy, Sword } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#05070B] via-[#0C121C] to-[#05070B]" />
        
        {/* Animated grid */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #19E0FF08 1px, transparent 1px),
              linear-gradient(to bottom, #19E0FF08 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Glowing orbs */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#19E0FF] rounded-full blur-[150px] opacity-30"
        />
        <motion.div
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-[#1A9FE8] rounded-full blur-[120px] opacity-20"
        />
        
        {/* Character silhouette effect */}
        <div className="absolute bottom-0 right-0 w-full md:w-1/2 h-full opacity-30 pointer-events-none">
          <div 
            className="absolute bottom-0 right-0 w-full h-full"
            style={{
              background: `
                radial-gradient(ellipse at 80% 100%, #19E0FF20 0%, transparent 50%),
                radial-gradient(ellipse at 60% 80%, #1A9FE810 0%, transparent 40%)
              `
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-full mb-6"
          >
            <div className="w-2 h-2 bg-[#19E0FF] rounded-full animate-pulse" />
            <span className="text-[#19E0FF] text-sm font-medium">Servidor Online</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight"
          >
            <span className="block">CABAL</span>
            <span className="block bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] bg-clip-text text-transparent">
              ZIRON
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-[#A9B2C7] mb-4 font-light"
          >
            Seu novo portal para Nevareth
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-[#A9B2C7]/80 mb-8 max-w-2xl"
          >
            Servidor privado de CABAL Online com DGs desafiadoras, combates explosivos, 
            TG ranqueada e um meta otimizado para 2025.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-4"
          >
            <Link to={createPageUrl('Registrar')}>
              <GradientButton size="lg">
                <span className="flex items-center gap-2">
                  Começar agora
                  <ChevronRight className="w-5 h-5" />
                </span>
              </GradientButton>
            </Link>
            <Link to={createPageUrl('Ranking')}>
              <GradientButton variant="secondary" size="lg">
                <span className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Ver ranking oficial
                </span>
              </GradientButton>
            </Link>
          </motion.div>

          {/* Stats preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[
              { label: 'Jogadores Online', value: '1.2K+' },
              { label: 'Guildas Ativas', value: '150+' },
              { label: 'Batalhas TG/dia', value: '500+' },
              { label: 'DGs Completadas', value: '10K+' },
            ].map((stat, index) => (
              <div key={index} className="text-center md:text-left">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-[#A9B2C7]">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#05070B] to-transparent" />
    </section>
  );
}