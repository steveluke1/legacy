import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CursorLight({ active = true, color = '#19E0FF' }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!active) return;

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [active, isVisible]);

  if (!active || !isVisible) return null;

  return (
    <motion.div
      className="fixed pointer-events-none"
      style={{
        left: mousePosition.x,
        top: mousePosition.y,
        zIndex: 2
      }}
      animate={{
        x: -50,
        y: -50
      }}
    >
      <div 
        className="w-[100px] h-[100px] rounded-full opacity-30 blur-3xl"
        style={{ background: `radial-gradient(circle, ${color}, transparent)` }}
      />
    </motion.div>
  );
}