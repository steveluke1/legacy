import React from 'react';
import { motion } from 'framer-motion';

export default function SectionTitle({ 
  title, 
  subtitle, 
  centered = true,
  className = '' 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`${centered ? 'text-center' : ''} ${className}`}
    >
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[#A9B2C7] text-lg max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
      <div className={`mt-4 h-1 w-20 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] rounded-full ${centered ? 'mx-auto' : ''}`} />
    </motion.div>
  );
}