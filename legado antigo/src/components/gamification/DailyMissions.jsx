import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Sparkles, ShoppingBag, Check, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import CrystalBorder from '@/components/ui/CrystalBorder';
import MetalButton from '@/components/ui/MetalButton';

const missionConfig = {
  visit_ranking: {
    icon: Trophy,
    label: 'Visitar Rankings',
    description: 'Confira os melhores jogadores de ZIRON',
    route: '/ranking',
    color: '#F7CE46'
  },
  check_builds: {
    icon: Sparkles,
    label: 'Consultar Builds',
    description: 'Explore builds com IA',
    route: '/builds',
    color: '#19E0FF'
  },
  check_guilds: {
    icon: Users,
    label: 'Ver Guildas Recrutando',
    description: 'Encontre sua guilda ideal',
    route: '/guildas',
    color: '#9146FF'
  },
  visit_marketplace: {
    icon: ShoppingBag,
    label: 'Visitar Mercado ZIRON',
    description: 'Confira os anúncios ativos',
    route: '/mercado',
    color: '#0097d8'
  }
};

export default function DailyMissions({ compact = false }) {
  const navigate = useNavigate();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAccount, setUserAccount] = useState(null);

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      const response = await base44.functions.invoke('gamification_getDailyMissions', {});
      if (response.data && response.data.success) {
        setMissions(response.data.missions || []);
        setUserAccount(response.data.user_account);
      }
    } catch (e) {
      console.error('Erro ao carregar missões:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-[#0C121C] rounded-lg mb-2" />
        <div className="h-20 bg-[#0C121C] rounded-lg mb-2" />
      </div>
    );
  }

  if (compact) {
    const completedCount = missions.filter(m => m.completed).length;
    const totalCount = missions.length;
    
    return (
      <div className="p-4 bg-gradient-to-br from-[#0C121C] to-[#05070B] rounded-lg border border-[#19E0FF]/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#19E0FF]" />
            Missões Diárias
          </h3>
          <span className="text-[#19E0FF] text-sm font-bold">
            {completedCount}/{totalCount}
          </span>
        </div>
        
        <div className="space-y-2">
          {missions.map((mission) => {
            const config = missionConfig[mission.mission_type];
            if (!config) return null;
            
            return (
              <div 
                key={mission.id}
                className={`
                  flex items-center gap-3 p-2 rounded-lg transition-colors
                  ${mission.completed ? 'bg-[#19E0FF]/10 opacity-60' : 'bg-[#0C121C] hover:bg-[#19E0FF]/5'}
                `}
              >
                <config.icon 
                  className="w-5 h-5 flex-shrink-0" 
                  style={{ color: mission.completed ? '#19E0FF' : config.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {config.label}
                  </p>
                </div>
                {mission.completed && (
                  <Check className="w-5 h-5 text-[#19E0FF] flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Clock className="w-7 h-7 text-[#19E0FF]" />
          Missões Diárias
        </h2>
        {userAccount && (
          <div className="text-right">
            <p className="text-[#A9B2C7] text-sm">Nível da Conta</p>
            <p className="text-[#19E0FF] text-2xl font-black">{userAccount.level}</p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {missions.map((mission, index) => {
          const config = missionConfig[mission.mission_type];
          if (!config) return null;

          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <CrystalBorder tier="Bronze Crystal">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      <config.icon className="w-7 h-7" style={{ color: config.color }} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold mb-1">{config.label}</h3>
                      <p className="text-[#A9B2C7] text-sm mb-3">{config.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-[#F7CE46]">+{mission.exp_reward} XP</span>
                        <span className="text-[#19E0FF]">+{mission.crystal_reward} ⬥</span>
                      </div>
                    </div>
                    
                    {mission.completed ? (
                      <div className="flex items-center justify-center w-10 h-10 bg-[#19E0FF]/20 rounded-lg flex-shrink-0">
                        <Check className="w-6 h-6 text-[#19E0FF]" />
                      </div>
                    ) : (
                      <MetalButton
                        size="sm"
                        onClick={() => navigate(config.route)}
                      >
                        Ir
                      </MetalButton>
                    )}
                  </div>
                </div>
              </CrystalBorder>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}