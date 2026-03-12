import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swords, Trophy, TrendingUp, Activity, Clock, Users, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import RequireAuth from '@/components/auth/RequireAuth';
import SectionTitle from '@/components/ui/SectionTitle';
import GlowCard from '@/components/ui/GlowCard';
import CrystalBorder from '@/components/ui/CrystalBorder';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

export default function TGAoVivo() {
  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadCurrentMatch();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      loadCurrentMatch();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const loadCurrentMatch = async () => {
    try {
      const response = await base44.functions.invoke('tg_getCurrentMatch', {});
      if (response.data && response.data.success) {
        setMatch(response.data.match);
        setEvents(response.data.events || []);
        setTopPlayers(response.data.top_players || []);
        setLastUpdate(new Date());
      } else {
        // Dados fictícios para demonstração
        setMatch({
          id: 'demo_match_001',
          status: 'IN_PROGRESS',
          capella_score: 8750,
          procyon_score: 6420,
          capella_kills: 342,
          procyon_kills: 289,
          total_players_capella: 48,
          total_players_procyon: 52
        });
        setEvents([
          { timestamp: new Date(Date.now() - 120000), faction: 'CAPELLA', description: 'DarkKnight destruiu a Torre Sul de Procyon!' },
          { timestamp: new Date(Date.now() - 180000), faction: 'PROCYON', description: 'MysticRose eliminou 5 inimigos em sequência (RAMPAGE)!' },
          { timestamp: new Date(Date.now() - 240000), faction: 'CAPELLA', description: 'Capella capturou a Base Central!' },
          { timestamp: new Date(Date.now() - 360000), faction: 'PROCYON', description: 'ShadowBlade matou o Guardião de Capella!' },
          { timestamp: new Date(Date.now() - 420000), faction: 'NEUTRAL', description: 'A Guerra de Território começou!' }
        ]);
        setTopPlayers([
          { character_name: 'DarkKnight', guild_name: 'Legends', faction: 'CAPELLA', score: 2850, kills: 47, deaths: 12 },
          { character_name: 'MysticRose', guild_name: 'Phoenix', faction: 'PROCYON', score: 2640, kills: 42, deaths: 15 },
          { character_name: 'ThunderGod', guild_name: 'Legends', faction: 'CAPELLA', score: 2420, kills: 38, deaths: 18 },
          { character_name: 'ShadowBlade', guild_name: 'Vortex', faction: 'PROCYON', score: 2180, kills: 35, deaths: 16 },
          { character_name: 'IceQueen', guild_name: 'Phoenix', faction: 'PROCYON', score: 1950, kills: 31, deaths: 20 },
          { character_name: 'FireStorm', guild_name: 'Inferno', faction: 'CAPELLA', score: 1820, kills: 29, deaths: 14 },
          { character_name: 'HolyPriest', guild_name: 'Legends', faction: 'CAPELLA', score: 1640, kills: 26, deaths: 22 },
          { character_name: 'NightHunter', guild_name: 'Vortex', faction: 'PROCYON', score: 1520, kills: 24, deaths: 19 }
        ]);
        setLastUpdate(new Date());
      }
    } catch (e) {
      console.error('Erro ao carregar dados da TG:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-96 w-full bg-[#19E0FF]/10 rounded-xl mb-8" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64 bg-[#19E0FF]/10 rounded-xl" />
            <Skeleton className="h-64 bg-[#19E0FF]/10 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const isInProgress = match && match.status === 'IN_PROGRESS';
  const totalScore = match ? match.capella_score + match.procyon_score : 1;
  const capellaPercentage = match ? (match.capella_score / totalScore) * 100 : 50;

  return (
    <RequireAuth>
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionTitle 
          title="Guerra de TG ao Vivo"
          subtitle="Acompanhe em tempo real a batalha entre Capella e Procyon"
        />

        {/* Status Badge */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {isInProgress ? (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-lg px-6 py-2">
              <Activity className="w-5 h-5 mr-2 animate-pulse" />
              Em andamento
            </Badge>
          ) : (
            <div className="text-center">
              <Badge className="bg-[#A9B2C7]/20 text-[#A9B2C7] border-[#A9B2C7]/30 text-lg px-6 py-2 mb-3">
                Nenhuma Guerra de TG em andamento agora
              </Badge>
              <p className="text-[#A9B2C7] text-sm">
                Próximos horários: Segunda a Sexta às 20h, Sábado às 15h, Domingo às 21h
              </p>
            </div>
          )}
          {isInProgress && (
            <div className="text-[#A9B2C7] text-sm">
              <Clock className="w-4 h-4 inline mr-1" />
              Atualizado há {Math.floor((new Date() - lastUpdate) / 1000)}s
            </div>
          )}
        </div>

        {match && (
          <>
            {/* Scoreboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <CrystalBorder tier="Legendary Arch-Crystal" showLabel>
                <div className="p-8">
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    {/* Capella */}
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#FF4B6A] to-[#FF6B8A] rounded-full flex items-center justify-center">
                        <Swords className="w-10 h-10 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-[#FF4B6A] mb-2">CAPELLA</h2>
                      <div className="text-4xl font-black text-white mb-2">{match.capella_score.toLocaleString()}</div>
                      <div className="text-[#A9B2C7] text-sm">
                        {match.capella_kills} kills · {match.total_players_capella} jogadores
                      </div>
                    </div>

                    {/* VS */}
                    <div className="flex items-center justify-center">
                      <div className="text-6xl font-black text-[#A9B2C7]/30">VS</div>
                    </div>

                    {/* Procyon */}
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8] rounded-full flex items-center justify-center">
                        <Swords className="w-10 h-10 text-[#05070B]" />
                      </div>
                      <h2 className="text-2xl font-bold text-[#19E0FF] mb-2">PROCYON</h2>
                      <div className="text-4xl font-black text-white mb-2">{match.procyon_score.toLocaleString()}</div>
                      <div className="text-[#A9B2C7] text-sm">
                        {match.procyon_kills} kills · {match.total_players_procyon} jogadores
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-8 bg-[#0C121C] rounded-full overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#FF4B6A] to-[#FF6B8A] transition-all duration-500"
                      style={{ width: `${capellaPercentage}%` }}
                    />
                    <div 
                      className="absolute right-0 top-0 h-full bg-gradient-to-l from-[#19E0FF] to-[#1A9FE8] transition-all duration-500"
                      style={{ width: `${100 - capellaPercentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-sm drop-shadow-lg">
                        {capellaPercentage.toFixed(1)}% - {(100 - capellaPercentage).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {!isInProgress && (
                    <div className="mt-6 text-center">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-lg px-6 py-2">
                        Vitória de {match.capella_score > match.procyon_score ? 'Capella' : 'Procyon'}
                      </Badge>
                    </div>
                  )}
                </div>
              </CrystalBorder>
            </motion.div>

            {/* Top Players and Events */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top Players */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <GlowCard className="p-6 h-full">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-[#F7CE46]" />
                    Destaques da Guerra
                  </h2>
                  {topPlayers.length > 0 ? (
                    <div className="space-y-2">
                      {topPlayers.map((player, idx) => (
                        <div 
                          key={idx}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            idx < 3 
                              ? 'bg-gradient-to-r from-[#F7CE46]/10 to-transparent border-l-4 border-[#F7CE46]'
                              : 'bg-[#0C121C] border border-[#19E0FF]/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              idx === 0 ? 'bg-[#FFD700] text-[#05070B]' :
                              idx === 1 ? 'bg-[#C0C0C0] text-[#05070B]' :
                              idx === 2 ? 'bg-[#CD7F32] text-white' :
                              'bg-[#19E0FF]/20 text-[#19E0FF]'
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <div className="text-white font-bold text-sm">{player.character_name}</div>
                              <div className="text-[#A9B2C7] text-xs">
                                {player.guild_name} · {player.faction}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-bold">{player.score}</div>
                            <div className="text-[#A9B2C7] text-xs">
                              {player.kills}K / {player.deaths}D
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#A9B2C7]">
                      Nenhum dado de jogadores disponível
                    </div>
                  )}
                </GlowCard>
              </motion.div>

              {/* Event Timeline */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <GlowCard className="p-6 h-full">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-[#19E0FF]" />
                    Eventos Recentes
                  </h2>
                  {events.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {events.map((event, idx) => {
                        const factionColor = 
                          event.faction === 'CAPELLA' ? 'text-[#FF4B6A]' :
                          event.faction === 'PROCYON' ? 'text-[#19E0FF]' :
                          'text-[#A9B2C7]';

                        return (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-[#0C121C] rounded-lg border border-[#19E0FF]/10">
                            <div className="text-[#A9B2C7] text-xs whitespace-nowrap mt-1">
                              {new Date(event.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className={`flex-1 text-sm ${factionColor}`}>
                              {event.description}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#A9B2C7]">
                      Nenhum evento registrado ainda
                    </div>
                  )}
                </GlowCard>
              </motion.div>
            </div>
          </>
        )}

        {!match && !loading && (
          <div className="text-center py-16">
            <Swords className="w-20 h-20 text-[#A9B2C7]/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhuma guerra registrada</h3>
            <p className="text-[#A9B2C7]">Aguarde os próximos horários de TG</p>
          </div>
        )}
      </div>
    </div>
    </RequireAuth>
  );
}