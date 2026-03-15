import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, useAnimation } from 'framer-motion';
import { ChevronRight, Trophy, Server, Users, Swords, Shield, Activity } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';
import GlowCard from '@/components/ui/GlowCard';
import { base44 } from '@/api/base44Client';

// Counter animation hook
function useCountUp(end, duration = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

export default function HeroRightSection() {
  const [stats, setStats] = useState({
    server_status: 'online',
    available: false,
    online_players: 0,
    active_guilds: 0,
    tg_battles_last_24h: 0
  });

  useEffect(() => {
    let mounted = true;
    
    const loadStats = async () => {
      try {
        const response = await base44.functions.invoke('serverGetStats', {});
        if (mounted && response.data?.success) {
          setStats(response.data.data);
        }
      } catch (e) {
        // Keep unavailable state on error
      }
    };
    
    loadStats();
    
    return () => { mounted = false; };
  }, []);

  const statusItems = [
    {
      icon: Server,
      label: 'Canal Principal',
      value: stats.server_status === 'online' ? 'Online' : 'Offline',
      status: stats.server_status === 'online' ? 'online' : 'offline',
      color: stats.server_status === 'online' ? '#19E0FF' : '#FF4B6A'
    },
    {
      icon: Users,
      label: 'Players Online',
      value: stats.available ? (stats.online_players?.toLocaleString() || '0') : '—',
      color: '#19E0FF'
    },
    {
      icon: Shield,
      label: 'Active Guilds',
      value: stats.available ? (stats.active_guilds?.toString() || '0') : '—',
      color: '#F7CE46'
    },
    {
      icon: Swords,
      label: 'TG Battles (24h)',
      value: stats.available ? (stats.tg_battles_last_24h?.toString() || '0') : '—',
      color: '#FF4B6A'
    }
  ];

  return (
    <div className="flex flex-col justify-center h-full">
      {/* Premium Status Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#19E0FF]/20 to-[#1A9FE8]/10 border border-[#19E0FF]/40 rounded-full backdrop-blur-sm">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2.5 h-2.5 bg-[#19E0FF] rounded-full shadow-lg shadow-[#19E0FF]/50"
          />
          <span className="text-[#19E0FF] text-sm font-bold tracking-wide">SERVIDOR ONLINE</span>
        </div>
      </motion.div>

      {/* Premium Title */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-2 leading-none">
          <span className="block text-white tracking-tight">Legacy of</span>
          <span className="block bg-gradient-to-r from-[#19E0FF] via-[#1A9FE8] to-[#19E0FF] bg-clip-text text-transparent">
            Nevareth
          </span>
        </h1>
        <div className="h-1 w-20 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] rounded-full mt-3" />
      </motion.div>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-lg text-[#A9B2C7] mb-8 leading-relaxed"
      >
        Private CABAL Online Server
      </motion.p>

      {/* Value Proposition */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8 p-4 bg-[#0C121C]/60 border border-[#19E0FF]/10 rounded-xl backdrop-blur-sm"
      >
        <p className="text-[#A9B2C7] text-sm leading-relaxed">
          Challenging dungeons, competitive PvP, and ranked TG in a 2025-optimized meta.
        </p>
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-3 mb-8"
      >
        <Link to={createPageUrl('Registrar')} className="flex-1">
          <motion.button
            whileHover={{ y: -2, boxShadow: '0 10px 30px rgba(25, 224, 255, 0.3)' }}
            whileTap={{ y: 0 }}
            className="w-full px-6 py-3.5 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-black rounded-lg transition-all flex items-center justify-center gap-2 text-sm tracking-wide"
          >
            Start Now
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </Link>
        <Link to={createPageUrl('Ranking')} className="flex-1">
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            className="w-full px-6 py-3.5 bg-[#0C121C] border-2 border-[#19E0FF]/30 text-white font-bold rounded-lg hover:border-[#19E0FF]/60 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Trophy className="w-4 h-4" />
            View Rankings
          </motion.button>
        </Link>
      </motion.div>

      {/* Live Server Status Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mb-6"
      >
        <GlowCard className="overflow-hidden" glowColor="#19E0FF">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0C121C] to-[#0C121C]/80 px-6 py-4 border-b border-[#19E0FF]/10">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#19E0FF]" />
              Server Status
              </h3>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 bg-[#19E0FF] rounded-full shadow-lg shadow-[#19E0FF]/50"
                />
                <span className="text-[#19E0FF] text-xs font-bold">Main Channel</span>
              </div>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <KPICard
                icon={Users}
                label="Players Online"
                value={stats.available ? (stats.online_players || 0) : 0}
                unavailable={!stats.available}
                color="#19E0FF"
                delay={0}
              />
              <KPICard
                icon={Shield}
                label="Active Guilds"
                value={stats.available ? (stats.active_guilds || 0) : 0}
                unavailable={!stats.available}
                color="#F7CE46"
                delay={0.1}
              />
              <KPICard
                icon={Swords}
                label="TG Battles (24h)"
                value={stats.available ? (stats.tg_battles_last_24h || 0) : 0}
                unavailable={!stats.available}
                color="#FF4B6A"
                delay={0.2}
              />
            </div>

            {/* Update indicator */}
            <div className="mt-4 pt-4 border-t border-[#19E0FF]/10 text-center">
              <p className="text-[#A9B2C7] text-xs flex items-center justify-center gap-1.5">
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1 h-1 bg-[#19E0FF] rounded-full"
                />
                Automatically updated data
              </p>
            </div>
          </div>
        </GlowCard>
      </motion.div>
    </div>
  );
}

// KPI Card Component
function KPICard({ icon: Icon, label, value, suffix = '', color, delay, unavailable = false }) {
  const animatedValue = useCountUp(value, 1500);
  const displayValue = unavailable 
    ? '—' 
    : (value > 999 
        ? `${(value / 1000).toFixed(1)}K` 
        : animatedValue.toLocaleString('pt-BR'));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8 + delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-[#05070B]/80 border border-[#19E0FF]/10 rounded-xl p-4 hover:border-[#19E0FF]/30 transition-all cursor-default"
    >
      <div className="flex items-start justify-between mb-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      
      <div className="mb-1">
        <span 
          className="text-2xl font-black tracking-tight"
          style={{ color: unavailable ? '#A9B2C7' : color }}
        >
          {displayValue}{!unavailable && suffix}
        </span>
      </div>
      
      <div className="text-[#A9B2C7] text-xs font-medium leading-tight">
        {label}
      </div>
    </motion.div>
  );
}