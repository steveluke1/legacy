import React, { useState } from 'react';
import { motion } from 'framer-motion';

const choices = [
  { id: 'poder', label: 'PODER', color: '#19E0FF', description: 'Dominar os rankings' },
  { id: 'conquista', label: 'CONQUISTA', color: '#F7CE46', description: 'Vencer Territory Wars' },
  { id: 'pertencimento', label: 'PERTENCIMENTO', color: '#FF4B6A', description: 'Construir uma comunidade' }
];

export default function IdentityChoice({ onChoice }) {
  const [hoveredChoice, setHoveredChoice] = useState(null);
  const [selectedChoice, setSelectedChoice] = useState(null);

  const handleSelect = (choice) => {
    setSelectedChoice(choice.id);
    setTimeout(() => {
      onChoice(choice.id);
    }, 1000);
  };

  return (
    <div className="relative z-10 pointer-events-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="text-center mb-12"
      >
        <h2 className="text-2xl md:text-3xl font-light text-white/80 mb-2">
          O que você busca?
        </h2>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
        {choices.map((choice, index) => {
          const isHovered = hoveredChoice === choice.id;
          const isSelected = selectedChoice === choice.id;

          return (
            <motion.button
              key={choice.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: index * 0.3 }}
              onHoverStart={() => setHoveredChoice(choice.id)}
              onHoverEnd={() => setHoveredChoice(null)}
              onClick={() => handleSelect(choice)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative group pointer-events-auto"
            >
              <div className="relative">
                {/* Glow effect */}
                <motion.div
                  animate={{
                    opacity: isHovered || isSelected ? 0.4 : 0,
                    scale: isHovered || isSelected ? 1.5 : 1
                  }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 blur-2xl"
                  style={{ backgroundColor: choice.color }}
                />

                {/* Text */}
                <motion.span
                  animate={{
                    color: isHovered || isSelected ? choice.color : '#A9B2C7'
                  }}
                  className="relative text-4xl md:text-5xl font-black tracking-wider"
                >
                  {choice.label}
                </motion.span>
              </div>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                className="text-[#A9B2C7] text-sm mt-2"
              >
                {choice.description}
              </motion.p>

              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8 }}
                  className="h-1 mt-3 rounded-full"
                  style={{ backgroundColor: choice.color }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {selectedChoice && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-12 text-[#19E0FF] text-lg font-light"
        >
          Seu caminho foi marcado.
        </motion.p>
      )}
    </div>
  );
}