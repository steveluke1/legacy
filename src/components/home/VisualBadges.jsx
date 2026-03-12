import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VisualBadges() {
  const badges = [
    'Economia justa',
    'PvP e GvG premiado',
    'Ranks com premiação'
  ];

  return (
    <section className="py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12"
        >
          {badges.map((badge, index) => (
            <div
              key={index}
              className="flex items-center gap-3"
            >
              <CheckCircle2 className="w-6 h-6 text-[#19E0FF] flex-shrink-0" />
              <span className="text-white font-semibold text-lg">
                {badge}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}