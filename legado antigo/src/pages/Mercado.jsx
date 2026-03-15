import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ShoppingCart, DollarSign, Package, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthProvider';
import RequireAuth from '@/components/auth/RequireAuth';
import SectionTitle from '@/components/ui/SectionTitle';
import GradientButton from '@/components/ui/GradientButton';
import MetalButton from '@/components/ui/MetalButton';
import LoadingShell from '@/components/ui/LoadingShell';

import GlowCard from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';




export default function Mercado() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionTitle 
          title="Mercado"
          subtitle="Compre e venda ALZ, itens e serviços in-game com segurança"
        />

        <div className="mt-12">
            {/* Botões Principais: Comprar e Vender ALZ */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <GlowCard 
                className="p-8 cursor-pointer text-center"
                onClick={() => navigate(createPageUrl('MercadoAlzComprar'))}
              >
                <ShoppingCart className="w-16 h-16 text-[#19E0FF] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Comprar ALZ</h3>
                <p className="text-[#A9B2C7] mb-4">
                  Veja os melhores preços e compre ALZ com PIX de forma rápida e segura
                </p>
                <MetalButton size="lg" className="w-full">
                  Ver ofertas de ALZ
                </MetalButton>
              </GlowCard>

              <GlowCard 
                className="p-8 cursor-pointer text-center"
                onClick={() => navigate(createPageUrl('MercadoAlzVender'))}
              >
                <DollarSign className="w-16 h-16 text-[#F7CE46] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Vender ALZ</h3>
                <p className="text-[#A9B2C7] mb-4">
                  Anuncie seu ALZ e receba via PIX quando houver compradores interessados
                </p>
                <MetalButton size="lg" variant="gold" className="w-full">
                  Anunciar meu ALZ
                </MetalButton>
              </GlowCard>
            </div>

            {/* Link para Minhas Ofertas */}
            <div className="mt-6">
              <GlowCard 
                className="p-6 cursor-pointer hover:border-[#19E0FF]/40 transition-colors"
                onClick={() => navigate(createPageUrl('MercadoMinhasOfertas'))}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="w-8 h-8 text-[#19E0FF]" />
                    <div>
                      <h3 className="text-lg font-bold text-white">Minhas Ofertas</h3>
                      <p className="text-[#A9B2C7] text-sm">
                        Acompanhe e gerencie suas ofertas de venda
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#A9B2C7]" />
                </div>
              </GlowCard>
            </div>
        </div>
      </div>
    </div>
  );
}