import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Shield, Users, Trophy, Swords, Crown, ChevronLeft, UserPlus, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GlowCard from '@/components/ui/GlowCard';
import GradientButton from '@/components/ui/GradientButton';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import LoadingShell from '@/components/ui/LoadingShell';

const mockGuild = {
  id: '1',
  name: 'Apocalypse',
  slug: 'apocalypse',
  faction: 'Procyon',
  level: 8,
  member_count: 98,
  recruiting: true,
  description: 'A guilda mais temida de Nevareth. Desde 2016, dominamos as guerras e DGs com estratégia e força bruta. Nossa irmandade é forjada no campo de batalha.',
  leader_name: 'DarkSlayer',
  created_at: '2020-01-15'
};

export default function GuildaDetalhe() {
  const [guild, setGuild] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGuild();
  }, []);

  const loadGuild = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const slug = urlParams.get('slug');
      
      if (slug) {
        const data = await base44.entities.Guild.filter({ slug });
        if (data.length > 0) {
          setGuild(data[0]);
        } else {
          setGuild(mockGuild);
        }
      } else {
        setGuild(mockGuild);
      }
    } catch (e) {
      setGuild(mockGuild);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingShell message="Carregando guilda..." fullScreen={false} />;
  }

  if (!guild) {
    return (
      <div className="min-h-screen py-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Guilda não encontrada</h3>
          <Link to={createPageUrl('Guildas')} className="text-[#19E0FF] hover:underline">
            Voltar para lista de guildas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link 
          to={createPageUrl('Guildas')}
          className="inline-flex items-center gap-2 text-[#A9B2C7] hover:text-white transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar para guildas
        </Link>

        {/* Guild Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlowCard className="p-8" glowColor={guild.faction === 'Capella' ? '#4A90D9' : '#D94A4A'}>
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div 
                className={`w-24 h-24 rounded-2xl flex items-center justify-center ${
                  guild.faction === 'Capella' 
                    ? 'bg-blue-500/20' 
                    : 'bg-red-500/20'
                }`}
              >
                <Shield 
                  className="w-12 h-12" 
                  style={{ color: guild.faction === 'Capella' ? '#4A90D9' : '#D94A4A' }}
                />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">{guild.name}</h1>
                  <Badge className="bg-[#F7CE46]/20 text-[#F7CE46] border-[#F7CE46]/30">
                    Lv {guild.level || 1}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`${
                      guild.faction === 'Capella' 
                        ? 'border-blue-500/50 text-blue-400' 
                        : 'border-red-500/50 text-red-400'
                    }`}
                  >
                    {guild.faction}
                  </Badge>
                  {guild.recruiting && (
                    <Badge className="bg-[#19E0FF]/20 text-[#19E0FF] border-[#19E0FF]/30">
                      Recrutando
                    </Badge>
                  )}
                </div>

                <p className="text-[#A9B2C7] mb-4">{guild.description}</p>

                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-[#F7CE46]">
                    <Crown className="w-4 h-4" />
                    <span>Líder: <strong>{guild.leader_name || 'Desconhecido'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-[#A9B2C7]">
                    <Calendar className="w-4 h-4" />
                    <span>Fundada em {guild.created_at ? new Date(guild.created_at).toLocaleDateString('pt-BR') : '---'}</span>
                  </div>
                </div>
              </div>

              {guild.recruiting && (
                <GradientButton>
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Solicitar Entrada
                  </span>
                </GradientButton>
              )}
            </div>
          </GlowCard>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mt-6"
        >
          <GlowCard className="p-5" glowColor="#19E0FF">
            <div className="text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-[#19E0FF]" />
              <p className="text-2xl font-bold text-white">{guild.member_count}</p>
              <p className="text-[#A9B2C7] text-sm">Membros</p>
            </div>
          </GlowCard>
          <GlowCard className="p-5" glowColor="#F7CE46">
            <div className="text-center">
              <Shield className="w-6 h-6 mx-auto mb-2 text-[#F7CE46]" />
              <p className="text-2xl font-bold text-white">Lv {guild.level || 1}</p>
              <p className="text-[#A9B2C7] text-sm">Level</p>
            </div>
          </GlowCard>
        </motion.div>

        {/* Description */}
        {guild.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <GlowCard className="p-6">
              <h2 className="text-xl font-bold text-white mb-3">Sobre a Guilda</h2>
              <p className="text-[#A9B2C7] leading-relaxed">{guild.description}</p>
            </GlowCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}