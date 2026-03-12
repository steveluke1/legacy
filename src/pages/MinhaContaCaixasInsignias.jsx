import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Package, Loader2, Lock, Unlock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlowCard from '@/components/ui/GlowCard';
import MetalButton from '@/components/ui/MetalButton';
import LootBoxOpeningModal from '@/components/loja/LootBoxOpeningModal';
import MultiLootBoxOpeningModal from '@/components/loja/MultiLootBoxOpeningModal';
import RequireAuth from '@/components/auth/RequireAuth';
import LoadingShell from '@/components/ui/LoadingShell';

export default function MinhaContaCaixasInsignias() {
  const [openingBoxId, setOpeningBoxId] = useState(null);
  const [openingMultiple, setOpeningMultiple] = useState(0);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['user-loot-boxes'],
    queryFn: async () => {
      const res = await base44.functions.invoke('badge_getUserLootBoxes', {});
      if (!res.data || !res.data.success) {
        throw new Error(res.data?.error || 'Erro ao carregar caixas');
      }
      return res.data;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  const handleOpenBox = useCallback((boxId) => {
    setOpeningBoxId(boxId);
  }, []);

  const handleCloseModal = useCallback(() => {
    setOpeningBoxId(null);
    setOpeningMultiple(0);
    queryClient.invalidateQueries({ queryKey: ['user-loot-boxes'] });
  }, [queryClient]);

  if (isLoading) {
    return (
      <RequireAuth>
        <LoadingShell message="Carregando caixas..." fullScreen={false} />
      </RequireAuth>
    );
  }

  const unopenedBoxes = data?.lootBoxes?.filter(b => b.status === 'unopened') || [];
  const openedBoxes = data?.lootBoxes?.filter(b => b.status === 'opened') || [];

  return (
    <RequireAuth>
    <div className="min-h-screen bg-[#05070B] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Opened Count */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Minhas Caixas</h1>
            <p className="text-[#A9B2C7]">Abra suas caixas de insígnias e descubra quais tesouros esperam por você.</p>
          </div>
          
          {openedBoxes.length > 0 && (
            <GlowCard className="p-4">
              <div className="flex items-center gap-3">
                <Unlock className="w-5 h-5 text-[#A9B2C7]" />
                <div>
                  <div className="text-xs text-[#A9B2C7]">Caixas Abertas</div>
                  <div className="text-2xl font-black text-white">{openedBoxes.length}</div>
                </div>
              </div>
            </GlowCard>
          )}
        </div>

        {/* Unopened Boxes */}
        {unopenedBoxes.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Lock className="w-6 h-6 text-[#19E0FF]" />
                Caixas Fechadas ({unopenedBoxes.length})
              </h2>
              {unopenedBoxes.length >= 10 && (
                <div className="flex gap-3">
                  {unopenedBoxes.length >= 100 && (
                    <MetalButton
                      onClick={() => {
                        setOpeningMultiple(100);
                      }}
                      variant="gold"
                      className="flex items-center gap-2"
                    >
                      <Zap className="w-5 h-5" />
                      Abrir 100 Caixas
                    </MetalButton>
                  )}
                  {unopenedBoxes.length >= 50 && (
                    <MetalButton
                      onClick={() => {
                        setOpeningMultiple(50);
                      }}
                      variant="gold"
                      className="flex items-center gap-2"
                    >
                      <Zap className="w-5 h-5" />
                      Abrir 50 Caixas
                    </MetalButton>
                  )}
                  <MetalButton
                    onClick={() => {
                      setOpeningMultiple(10);
                    }}
                    variant="gold"
                    className="flex items-center gap-2"
                  >
                    <Zap className="w-5 h-5" />
                    Abrir 10 Caixas
                  </MetalButton>
                </div>
              )}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unopenedBoxes.map((box, idx) => (
                <motion.div
                  key={box.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <GlowCard className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8] rounded-xl flex items-center justify-center">
                        <Package className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold">{box.lootBoxTypeName}</h3>
                        <div className="inline-block px-2 py-1 bg-[#19E0FF]/20 border border-[#19E0FF]/40 rounded text-xs text-[#19E0FF] font-bold mt-1">
                          Fechada
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-[#A9B2C7] mb-4">
                      Adquirida em: {new Date(box.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    <MetalButton
                      onClick={() => handleOpenBox(box.id)}
                      className="w-full"
                      disabled={openingBoxId !== null || openingMultiple > 0}
                    >
                      {openingBoxId === box.id ? 'Abrindo...' : 'Abrir Caixa'}
                    </MetalButton>
                  </GlowCard>
                </motion.div>
              ))}
            </div>
          </div>
        )}



        {/* Empty State */}
        {unopenedBoxes.length === 0 && openedBoxes.length === 0 && (
          <GlowCard className="p-12 text-center">
            <Package className="w-20 h-20 text-[#A9B2C7] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Nenhuma caixa encontrada</h3>
            <p className="text-[#A9B2C7] mb-6">
              Você ainda não possui caixas de insígnias. Adquira na Loja!
            </p>
            <MetalButton onClick={() => window.location.href = '/loja'}>
              Ir para a Loja
            </MetalButton>
          </GlowCard>
        )}
      </div>

      {/* Opening Modals */}
      <AnimatePresence>
        {openingBoxId && (
          <LootBoxOpeningModal
            boxId={openingBoxId}
            onClose={handleCloseModal}
          />
        )}
        {openingMultiple > 0 && (
          <MultiLootBoxOpeningModal
            quantity={openingMultiple}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </div>
    </RequireAuth>
  );
}