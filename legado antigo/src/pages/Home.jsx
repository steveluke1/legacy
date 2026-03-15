import React, { lazy, Suspense } from 'react';
import HeroRightSection from '@/components/home/HeroRightSection';
import HallDaFama from '@/components/home/HallDaFama';
import CorredoresSemanal from '@/components/home/CorredoresSemanal';
import PrizeCounter from '@/components/home/PrizeCounter';
import FeaturesSection from '@/components/home/FeaturesSection';
import VisualBadges from '@/components/home/VisualBadges';
import HowItWorks from '@/components/home/HowItWorks';
import PreRegistrationRewards from '@/components/home/PreRegistrationRewards';
import PreLaunchPackageCard from '@/components/home/PreLaunchPackageCard';
import CommunityMission from '@/components/home/CommunityMission';
import CommunitySection from '@/components/home/CommunitySection';
import FinalCTA from '@/components/home/FinalCTA';
import { usePrefetchCommonPages } from '@/components/hooks/usePrefetch';

// Lazy load MatadorSemanal for better initial load performance
const MatadorSemanal = lazy(() => import('@/components/home/MatadorSemanal'));

export default function Home() {
  // Prefetch likely next pages for instant navigation
  usePrefetchCommonPages();

  return (
    <div className="relative">
      {/* Background personagem CABAL */}
      <div 
        className="fixed inset-0 z-0 opacity-10 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: "url('blob:https://dash.cloudflare.com/adaf8583-ac7a-4fb2-acd4-28322c36cf5a')",
          backgroundBlendMode: 'overlay'
        }}
      />
      
      <div className="relative z-10">
        {/* Hero Top Split Layout */}
        <section className="relative min-h-screen flex items-center overflow-hidden py-20">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#05070B] via-[#0C121C] to-[#05070B]" />
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
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#19E0FF] rounded-full blur-[150px] opacity-20 animate-pulse" />
            <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-[#1A9FE8] rounded-full blur-[120px] opacity-15 animate-pulse" />
          </div>

          {/* Content Container */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* LEFT: Hall da Fama + Corredor */}
              <div className="order-2 lg:order-1 space-y-8">
                <HallDaFama />
                <CorredoresSemanal />
              </div>

              {/* RIGHT: Servidor Online / CABAL ZIRON / Status + Matador da Semana */}
              <div className="order-1 lg:order-2 space-y-8">
                <HeroRightSection />
                
                {/* Matador da Semana */}
                <Suspense fallback={
                  <div className="py-8 flex items-center justify-center bg-[#05070B]/50 rounded-xl border border-[#19E0FF]/10">
                    <div className="text-[#19E0FF] text-sm">Carregando matador da semana...</div>
                  </div>
                }>
                  <MatadorSemanal />
                </Suspense>
              </div>
            </div>
          </div>

          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#05070B] to-transparent" />
        </section>

        <PrizeCounter />
        <PreLaunchPackageCard />
        <PreRegistrationRewards />
        <CommunityMission />
        <FeaturesSection />
        <VisualBadges />
        <HowItWorks />
        <CommunitySection />
        <FinalCTA />
      </div>
    </div>
  );
}