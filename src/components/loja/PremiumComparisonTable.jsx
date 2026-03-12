import React from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import { comparisonTableRows } from './PremiumPlansData';

const PremiumComparisonTable = React.memo(() => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <GlowCard className="p-6 md:p-8">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
          Comparação Detalhada de Benefícios
        </h3>
        
        <div className="overflow-x-auto -mx-6 md:mx-0">
          <div className="min-w-[600px] px-6 md:px-0">
            {comparisonTableRows.map((section, sectionIdx) => (
              <div key={sectionIdx} className="mb-8 last:mb-0">
                {/* Category Header */}
                <div className="bg-gradient-to-r from-[#19E0FF]/20 to-transparent py-3 px-4 mb-3 rounded-lg">
                  <h4 className="text-[#19E0FF] font-bold text-lg">{section.category}</h4>
                </div>
                
                {/* Table */}
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#19E0FF]/20">
                      <th className="text-left py-3 px-4 text-[#A9B2C7] font-medium text-sm">Benefício</th>
                      <th className="text-center py-3 px-4 font-bold text-sm" style={{ color: '#CD7F32' }}>Premium 1</th>
                      <th className="text-center py-3 px-4 font-bold text-sm" style={{ color: '#E5E4E2' }}>Premium 2</th>
                      <th className="text-center py-3 px-4 font-bold text-sm" style={{ color: '#FFD700' }}>Premium 3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b border-[#19E0FF]/10">
                        <td className="py-3 px-4 text-white text-sm">{row.label}</td>
                        <td className="py-3 px-4 text-center text-[#A9B2C7] text-sm">{row.p1}</td>
                        <td className="py-3 px-4 text-center text-[#A9B2C7] text-sm">{row.p2}</td>
                        <td className="py-3 px-4 text-center text-[#A9B2C7] text-sm">
                          {row.p3 === 'crown' ? (
                            <div className="flex items-center justify-center gap-2">
                              <span>Sim</span>
                              <Crown className="w-5 h-5 text-[#FFD700]" />
                            </div>
                          ) : (
                            row.p3
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer Notes */}
        <div className="mt-8 pt-6 border-t border-[#19E0FF]/20">
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-[#CD7F32]/10 rounded-lg border border-[#CD7F32]/30">
              <div className="text-[#CD7F32] font-bold mb-1">Premium 1</div>
              <div className="text-[#A9B2C7] text-xs">Ideal para começar com benefícios essenciais</div>
            </div>
            <div className="p-4 bg-[#19E0FF]/10 rounded-lg border border-[#19E0FF]/30">
              <div className="text-[#19E0FF] font-bold mb-1">Premium 2</div>
              <div className="text-[#A9B2C7] text-xs">Melhor custo-benefício para jogadores dedicados</div>
            </div>
            <div className="p-4 bg-[#FFD700]/10 rounded-lg border border-[#FFD700]/30">
              <div className="text-[#FFD700] font-bold mb-1">Premium 3</div>
              <div className="text-[#A9B2C7] text-xs">Experiência completa sem limitações</div>
            </div>
          </div>
        </div>
      </GlowCard>
    </motion.div>
  );
});

PremiumComparisonTable.displayName = 'PremiumComparisonTable';

export default PremiumComparisonTable;