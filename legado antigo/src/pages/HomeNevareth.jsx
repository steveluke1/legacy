import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ParticleField from '@/components/nevareth/ParticleField';
import CursorLight from '@/components/nevareth/CursorLight';
import ArcaneSymbols from '@/components/nevareth/ArcaneSymbols';
import IdentityChoice from '@/components/nevareth/IdentityChoice';
import MinimalNav from '@/components/nevareth/MinimalNav';
import EntryButtons from '@/components/nevareth/EntryButtons';
import FloatingSignal from '@/components/nevareth/FloatingSignal';

export default function HomeNevareth() {
  const [stage, setStage] = useState('VOID'); // VOID -> INTERACTION -> REVELATION -> SIGNALS -> CHOICE -> ENTRY
  const [userInteracted, setUserInteracted] = useState(false);
  const [selectedIdentity, setSelectedIdentity] = useState(null);
  const [showNav, setShowNav] = useState(false);

  // Detect first interaction
  useEffect(() => {
    const handleInteraction = () => {
      if (!userInteracted) {
        setUserInteracted(true);
      }
    };

    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('click', handleInteraction);
    
    return () => {
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, [userInteracted]);

  // Show nav after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNav(true);
    }, 15000);
    
    return () => clearTimeout(timer);
  }, []);

  // Stage progression
  useEffect(() => {
    if (stage === 'VOID' && userInteracted) {
      setTimeout(() => setStage('INTERACTION'), 1000);
    }
  }, [userInteracted, stage]);

  const handleContinue = () => {
    setStage('REVELATION');
    setTimeout(() => setStage('SIGNALS'), 3000);
    setTimeout(() => setStage('CHOICE'), 6000);
  };

  const handleIdentityChoice = (identity) => {
    setSelectedIdentity(identity);
    setTimeout(() => {
      setStage('ENTRY');
      setShowNav(true);
    }, 2000);
  };

  return (
    <div className="relative min-h-screen bg-[#05070B] overflow-hidden">
      {/* SEO - hidden */}
      <h1 className="sr-only">CABAL ZIRON — Servidor privado de CABAL Online com rankings, mercado e comunidade</h1>
      
      {/* Particle field */}
      <ParticleField 
        intensity={stage === 'ENTRY' ? 'high' : 'medium'} 
        active={stage !== 'VOID'} 
      />

      {/* Cursor light */}
      <CursorLight 
        active={stage !== 'ENTRY'} 
        color={
          selectedIdentity === 'poder' ? '#19E0FF' :
          selectedIdentity === 'conquista' ? '#F7CE46' :
          selectedIdentity === 'pertencimento' ? '#FF4B6A' :
          '#19E0FF'
        }
      />

      {/* Arcane symbols */}
      <ArcaneSymbols visible={stage === 'REVELATION' || stage === 'SIGNALS' || stage === 'CHOICE' || stage === 'ENTRY'} />

      {/* Minimal Nav */}
      <MinimalNav visible={showNav && stage === 'ENTRY'} />

      {/* Content stages */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          {/* Stage 1: VOID */}
          {stage === 'VOID' && (
            <motion.div
              key="void"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              className="text-center space-y-6 pointer-events-none"
            >
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 2, delay: 0.5 }}
                className="text-2xl md:text-3xl font-light text-white/60"
              >
                Você sente isso?
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 2, delay: 2 }}
                className="text-xl md:text-2xl font-light text-[#19E0FF]/70"
              >
                Algo desperta em Nevareth.
              </motion.p>
            </motion.div>
          )}

          {/* Stage 2: INTERACTION */}
          {stage === 'INTERACTION' && (
            <motion.div
              key="interaction"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="text-center space-y-8"
            >
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5 }}
                className="text-2xl md:text-3xl font-light text-white/70 mb-12"
              >
                Poucos atravessam este limiar.
              </motion.p>

              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(25, 224, 255, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleContinue}
                className="px-10 py-4 bg-[#0C121C]/80 border-2 border-[#19E0FF]/40 text-[#19E0FF] font-bold text-lg rounded-lg hover:border-[#19E0FF]/80 transition-all backdrop-blur-sm pointer-events-auto"
              >
                CONTINUAR
              </motion.button>
            </motion.div>
          )}

          {/* Stage 3: REVELATION */}
          {stage === 'REVELATION' && (
            <motion.div
              key="revelation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              className="text-center space-y-8 max-w-3xl pointer-events-none"
            >
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, delay: 0 }}
                className="text-2xl md:text-3xl font-light text-white/80"
              >
                Este não é apenas um servidor.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, delay: 1 }}
                className="text-2xl md:text-3xl font-light text-white/80"
              >
                É um mundo em movimento.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, delay: 2 }}
                className="text-2xl md:text-3xl font-light text-[#19E0FF]/90"
              >
                E ele não espera.
              </motion.p>
            </motion.div>
          )}

          {/* Stage 4: SIGNALS */}
          {stage === 'SIGNALS' && (
            <motion.div
              key="signals"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full relative"
            >
              <FloatingSignal text="Servidor: ONLINE" delay={0} position="topLeft" />
              <FloatingSignal text="Guerra Territorial: ATIVA" delay={0.5} position="topRight" />
              <FloatingSignal text="Economia: VIVA" delay={1} position="bottomLeft" />
              <FloatingSignal text="Rankings: VALENDO PRÊMIOS" delay={1.5} position="bottomRight" />
            </motion.div>
          )}

          {/* Stage 5: CHOICE */}
          {stage === 'CHOICE' && (
            <motion.div
              key="choice"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
            >
              <IdentityChoice onChoice={handleIdentityChoice} />
            </motion.div>
          )}

          {/* Stage 6: ENTRY */}
          {stage === 'ENTRY' && (
            <motion.div
              key="entry"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
              className="text-center"
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="mb-12"
              >
                <h2 className="text-5xl md:text-7xl font-black mb-4">
                  <span className="block text-white tracking-tight">CABAL</span>
                  <span className="block bg-gradient-to-r from-[#19E0FF] via-[#1A9FE8] to-[#19E0FF] bg-clip-text text-transparent">
                    ZIRON
                  </span>
                </h2>
                <div className="h-1 w-20 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] rounded-full mx-auto mb-6" />
                <p className="text-xl text-[#A9B2C7]">
                  Servidor privado premium de CABAL Online
                </p>
              </motion.div>

              <EntryButtons visible={true} />

              {/* Footer text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="mt-16 text-[#A9B2C7]/50 text-sm"
              >
                DGs desafiadoras • PvP competitivo • TG ranqueada
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Noise texture overlay */}
      <div 
        className="fixed inset-0 opacity-[0.015] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          zIndex: 3
        }}
      />
    </div>
  );
}