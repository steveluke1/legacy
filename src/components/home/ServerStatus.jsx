import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, Users, Swords, Shield, Wifi, WifiOff } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import { base44 } from '@/api/base44Client';

export default function ServerStatus() {
  const [stats, setStats] = useState({
    server_status: 'online',
    available: false,
    online_players: 0,
    active_guilds: 0,
    tg_battles_last_24h: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await base44.functions.invoke('serverGetStats', {});
      if (response.data && response.data.success) {
        setStats(response.data.data);
      }
    } catch (e) {
      // Keep unavailable state on error
    } finally {
      setLoading(false);
    }
  };

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
      label: 'Jogadores Conectados',
      value: stats.available ? (stats.online_players?.toLocaleString() || '0') : '—',
      color: '#19E0FF'
    },
    {
      icon: Shield,
      label: 'Guildas Ativas',
      value: stats.available ? (stats.active_guilds?.toString() || '0') : '—',
      color: '#F7CE46'
    },
    {
      icon: Swords,
      label: 'Batalhas TG (24h)',
      value: stats.available ? (stats.tg_battles_last_24h?.toString() || '0') : '—',
      color: '#FF4B6A'
    }
  ];

  return (
    <section className="py-16 bg-[#05070B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Status do Servidor</h2>
          <div className="h-1 w-20 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] rounded-full mx-auto" />
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statusItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <GlowCard className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <item.icon className="w-6 h-6" style={{ color: item.color }} />
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    {item.status && (
                      <div 
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    <span 
                      className="text-2xl md:text-3xl font-bold"
                      style={{ color: item.color }}
                    >
                      {loading ? (
                        <span className="inline-block w-16 h-8 bg-[#19E0FF]/20 rounded animate-pulse" />
                      ) : (
                        item.value
                      )}
                    </span>
                  </div>
                  
                  <span className="text-[#A9B2C7] text-sm">{item.label}</span>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}