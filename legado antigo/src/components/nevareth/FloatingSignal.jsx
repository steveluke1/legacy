import React from 'react';
import { motion } from 'framer-motion';

export default function FloatingSignal({ text, delay = 0, position = 'center' }) {
  const positions = {
    center: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
    topLeft: 'left-[10%] top-[20%]',
    topRight: 'right-[10%] top-[20%]',
    bottomLeft: 'left-[10%] bottom-[20%]',
    bottomRight: 'right-[10%] bottom-[20%]'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 2, 
        delay,
        ease: 'easeOut'
      }}
      className={`absolute ${positions[position]} pointer-events-none`}
    >
      <motion.div
        animate={{ 
          y: [0, -10, 0],
          opacity: [0.6, 1, 0.6]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="px-4 py-2 bg-[#0C121C]/40 backdrop-blur-sm border border-[#19E0FF]/30 rounded-lg"
      >
        <span className="text-[#19E0FF] text-sm font-medium">{text}</span>
      </motion.div>
    </motion.div>
  );
}