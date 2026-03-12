import React from 'react';
import { motion } from 'framer-motion';

export default function ArcaneSymbols({ visible = false }) {
  const symbols = [
    { char: '◈', x: '15%', y: '20%', delay: 0 },
    { char: '◇', x: '85%', y: '25%', delay: 0.3 },
    { char: '◆', x: '10%', y: '70%', delay: 0.6 },
    { char: '◈', x: '90%', y: '75%', delay: 0.9 },
    { char: '◇', x: '50%', y: '10%', delay: 0.4 },
    { char: '◆', x: '50%', y: '90%', delay: 1.2 }
  ];

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {symbols.map((symbol, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.15, scale: 1 }}
          transition={{
            duration: 2,
            delay: symbol.delay,
            ease: 'easeOut'
          }}
          style={{
            position: 'absolute',
            left: symbol.x,
            top: symbol.y,
            fontSize: '4rem',
            color: '#19E0FF'
          }}
        >
          {symbol.char}
        </motion.div>
      ))}
    </div>
  );
}