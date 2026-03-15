import React from 'react';
import { motion } from 'framer-motion';

export default function TabLinkEstelar({ data }) {
  if (!data) {
    return (
      <div className="text-center py-12 text-[#A9B2C7]">
        Nenhum Link Estelar disponível
      </div>
    );
  }

  const categoryColors = {
    'Fúria': '#FF4B6A',
    'Desejo': '#19E0FF',
    'Dor': '#9B59B6',
    'Oblívio': '#6C757D',
    'Vácuo': '#F7CE46'
  };

  return (
    <div className="space-y-8">
      {/* Description */}
      {data.description && (
        <div className="bg-gradient-to-r from-[#F7CE46]/10 to-[#FFD700]/10 border border-[#F7CE46]/30 rounded-lg p-6">
          <h3 className="text-[#F7CE46] font-bold text-lg mb-2">Configuração de Link Estelar</h3>
          <p className="text-white">{data.description}</p>
        </div>
      )}

      {/* Constellations */}
      {data.constellations && data.constellations.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Constelações Ativas</h3>
          <div className="space-y-6">
            {data.constellations.map((constellation, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[#19E0FF] font-bold text-lg">{constellation.name}</h4>
                  <div className="flex items-center gap-3">
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-bold"
                      style={{ 
                        backgroundColor: `${categoryColors[constellation.category]}20`,
                        color: categoryColors[constellation.category],
                        border: `1px solid ${categoryColors[constellation.category]}40`
                      }}
                    >
                      {constellation.category}
                    </span>
                    <span className="text-[#A9B2C7] text-sm">
                      {constellation.slots_filled} slots preenchidos
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {constellation.attributes.map((attr, attrIdx) => (
                    <div 
                      key={attrIdx}
                      className="bg-[#19E0FF]/5 border border-[#19E0FF]/20 rounded-lg p-3"
                    >
                      <div className="text-white font-bold text-sm">{attr.name}</div>
                      <div className="text-[#19E0FF] text-sm">{attr.value}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}