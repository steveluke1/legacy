import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Download, Gamepad2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SectionTitle from '@/components/ui/SectionTitle';
import GradientButton from '@/components/ui/GradientButton';

const steps = [
  {
    icon: UserPlus,
    number: '01',
    title: 'Criar Conta',
    description: 'Registre-se gratuitamente em menos de um minuto. Apenas nome de usuário, e-mail e senha.'
  },
  {
    icon: Download,
    number: '02',
    title: 'Baixar Cliente Legacy of Nevareth',
    description: 'Faça download do nosso cliente otimizado. Instalação rápida e sem complicações.'
  },
  {
    icon: Gamepad2,
    number: '03',
    title: 'Entrar em Nevareth',
    description: 'Crie seu personagem, evolua, entre em uma guilda e dispute os rankings!'
  }
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-[#05070B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle 
          title="Como Funciona"
          subtitle="Três passos simples para começar sua jornada"
        />

        <div className="mt-16 relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-24 left-1/2 -translate-x-1/2 w-2/3 h-0.5 bg-gradient-to-r from-transparent via-[#19E0FF]/30 to-transparent" />
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="flex flex-col items-center text-center">
                  {/* Number badge */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8] flex items-center justify-center">
                      <step.icon className="w-9 h-9 text-[#05070B]" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#05070B] border-2 border-[#19E0FF] rounded-lg flex items-center justify-center">
                      <span className="text-[#19E0FF] text-xs font-bold">{step.number}</span>
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 w-20 h-20 rounded-2xl bg-[#19E0FF]/30 blur-xl -z-10" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-[#A9B2C7] leading-relaxed">{step.description}</p>
                </div>

                {/* Arrow for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-24 -right-6 text-[#19E0FF]/30">
                    <ChevronRight className="w-8 h-8" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <Link to={createPageUrl('Registrar')}>
            <GradientButton size="lg">
              <span className="flex items-center gap-2">
                Criar minha conta agora
                <ChevronRight className="w-5 h-5" />
              </span>
            </GradientButton>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}