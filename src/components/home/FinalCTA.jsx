import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight, Users, Trophy } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';

export default function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070B] via-[#0C121C] to-[#05070B]" />
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#19E0FF] rounded-full blur-[200px] opacity-20"
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
            Pronto para voltar a{' '}
            <span className="bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] bg-clip-text text-transparent">
              Nevareth
            </span>
            ?
          </h2>
          <p className="text-xl text-[#A9B2C7] mb-10 max-w-2xl mx-auto">
            Milhares de jogadores já estão conquistando os rankings. 
            Sua jornada épica em Legacy of Nevareth começa agora.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl('Registrar')}>
              <GradientButton size="lg">
                <span className="flex items-center gap-2">
                  Criar minha conta
                  <ChevronRight className="w-5 h-5" />
                </span>
              </GradientButton>
            </Link>
            <Link to={createPageUrl('Guildas')}>
              <GradientButton variant="secondary" size="lg">
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Ver guildas e ranking
                </span>
              </GradientButton>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}