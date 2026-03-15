import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TabColecao({ data }) {
  if (!data) {
    return (
      <div className="text-center py-12 text-[#A9B2C7]">
        Nenhuma coleção disponível
      </div>
    );
  }

  // Get collections array
  const collections = data.active_collections || [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Coleções Ativas</h2>
      <div className="grid gap-4">
        {collections.map((collection, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-6 hover:border-[#19E0FF]/40 transition-colors"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-2">{collection.name}</h3>
                <p className="text-[#19E0FF] text-sm mb-3">{collection.bonus}</p>
                <div className="flex items-center gap-4">
                  <span className="text-[#A9B2C7] text-sm">
                    Progresso: {collection.progress_current}/{collection.progress_total}
                  </span>
                  <div className="flex-1 max-w-xs">
                    <div className="h-2 bg-[#0C121C] border border-[#19E0FF]/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8]"
                        style={{ width: `${(collection.progress_current / collection.progress_total * 100).toFixed(0)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[#F7CE46] font-bold text-2xl">{(collection.progress_current / collection.progress_total * 100).toFixed(0)}%</div>
                <div className="text-[#A9B2C7] text-xs">Completo</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}