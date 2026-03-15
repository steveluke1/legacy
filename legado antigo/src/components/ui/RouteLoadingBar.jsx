import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * RouteLoadingBar - Shows a top progress bar during route transitions
 * Prevents the perception of a "frozen" app during navigation
 */
export default function RouteLoadingBar() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Start loading on route change
    setIsLoading(true);
    setProgress(0);
    
    let animationFrameId;
    let startTime = Date.now();
    
    // Smooth progress animation using requestAnimationFrame
    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / 300) * 90, 90);
      setProgress(newProgress);
      
      if (newProgress < 90) {
        animationFrameId = requestAnimationFrame(animateProgress);
      }
    };
    
    animationFrameId = requestAnimationFrame(animateProgress);
    
    // Complete after a short delay
    const completeTimeout = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
      }, 200);
    }, 400);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      clearTimeout(completeTimeout);
    };
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: progress / 100, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] z-50 origin-left"
          style={{ transformOrigin: 'left' }}
        />
      )}
    </AnimatePresence>
  );
}