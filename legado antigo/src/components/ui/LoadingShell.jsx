import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * LoadingShell - Consistent loading state that prevents white flashes
 * Shows a dark background with centered spinner and message
 */
export default function LoadingShell({ message = 'Carregando...', fullScreen = true }) {
  const containerClass = fullScreen 
    ? 'min-h-screen flex items-center justify-center bg-[#05070B]'
    : 'w-full py-20 flex items-center justify-center bg-[#05070B]';

  return (
    <div className={containerClass}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="text-center"
      >
        <div className="w-16 h-16 rounded-full bg-[#19E0FF]/20 flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-[#19E0FF] animate-spin" />
        </div>
        <p className="text-[#A9B2C7] text-lg">{message}</p>
      </motion.div>
    </div>
  );
}