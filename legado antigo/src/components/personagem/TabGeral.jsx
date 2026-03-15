import React from 'react';
import { motion } from 'framer-motion';

export default function TabGeral({ stats }) {
  if (!stats || stats.length === 0) {
    return (
      <div className="text-center py-12 text-[#A9B2C7]">
        Nenhuma estatística disponível
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.02 }}
          className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-4 hover:border-[#19E0FF]/40 transition-colors"
        >
          <div className="text-[#A9B2C7] text-xs mb-1">{stat.label}</div>
          <div className="text-white font-bold text-lg">{stat.value}</div>
          {stat.subtitle && (
            <div className="text-[#19E0FF] text-xs mt-1">{stat.subtitle}</div>
          )}
        </motion.div>
      ))}
    </div>
  );
}