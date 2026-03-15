import React from 'react';
import { motion } from 'framer-motion';
import { Package, Sparkles } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import MetalButton from '@/components/ui/MetalButton';

// Image URL placeholder - will be provided later
const PRELAUNCH_IMAGE_URL = "";

const PACKAGE_ITEMS = [
  'Fantasia Anjo Dourado (Rosto)',
  'Fantasia Anjo Dourado',
  'Fantasia Moto Rei Leão — o Guardião dos Céus Dourado',
  'Fantasia de Arma Guardião da Luz',
  'Fantasia de Asa Anjo'
];

export default function PreLaunchPackageCard() {
  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <GlowCard className="p-8 bg-gradient-to-br from-[#0C121C] to-[#05070B]">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 mb-3">
                <Package className="w-6 h-6 text-[#FFD700]" />
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  Pacote Pré-Lançamento
                </h2>
                <Sparkles className="w-6 h-6 text-[#FFD700]" />
              </div>
              <p className="text-[#A9B2C7] text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                Fantasias exclusivas do pré-lançamento. Depois que o servidor abrir, 
                elas não estarão disponíveis na loja do jogo — é a sua única chance de garantir.
              </p>
            </div>

            {/* Image or Placeholder */}
            <div className="mb-6 rounded-lg overflow-hidden">
              {PRELAUNCH_IMAGE_URL ? (
                <img 
                  src={PRELAUNCH_IMAGE_URL} 
                  alt="Pacote Pré-Lançamento"
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-[#FFD700]/20 via-[#19E0FF]/10 to-[#FFD700]/20 rounded-lg flex flex-col items-center justify-center border-2 border-[#FFD700]/30">
                  <Package className="w-16 h-16 text-[#FFD700] mb-3" />
                  <p className="text-[#A9B2C7] text-sm">Imagem do pacote (em breve)</p>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="mb-6">
              <h3 className="text-[#19E0FF] font-bold text-lg mb-3">Itens inclusos:</h3>
              <ul className="space-y-2">
                {PACKAGE_ITEMS.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-white"
                  >
                    <span className="text-[#FFD700] mt-1">✦</span>
                    <span className="text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price Badge */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-2 px-6 py-2 bg-[#FFD700]/20 border border-[#FFD700]/50 rounded-full">
                <span className="text-[#FFD700] font-bold text-2xl">R$ 99,90</span>
              </div>
            </div>

            {/* CTA Button (Disabled) */}
            <div className="text-center">
              <MetalButton
                disabled
                size="lg"
                className="px-12 opacity-60 cursor-not-allowed"
              >
                Garantir por R$ 99,90
              </MetalButton>
              <p className="text-[#A9B2C7] text-xs mt-3">
                Link de pagamento em breve.
              </p>
            </div>
          </GlowCard>
        </motion.div>
      </div>
    </section>
  );
}