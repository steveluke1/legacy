import React from 'react';
import { Activity, Swords, Trophy, Target, Calendar } from 'lucide-react';

export default function TabAtividades({ data }) {
  if (!data) {
    return (
      <div className="text-center py-12 text-[#A9B2C7]">
        Nenhuma atividade registrada
      </div>
    );
  }

  const recentDungeons = data.recent_dungeons || [];
  const recentTG = data.recent_tg || [];
  const dailyMissions = data.daily_missions_summary || {};

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Daily Missions Summary */}
      {dailyMissions && (
        <div className="bg-gradient-to-r from-[#19E0FF]/10 to-[#1A9FE8]/10 border border-[#19E0FF]/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#19E0FF]" />
            Missões Diárias
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#0C121C]/50 rounded-lg">
              <div className="text-[#A9B2C7] text-sm mb-1">Concluídas nos últimos 7 dias</div>
              <div className="text-[#19E0FF] font-bold text-2xl">{dailyMissions.missions_completed_last_7_days || 0}</div>
            </div>
            <div className="p-4 bg-[#0C121C]/50 rounded-lg">
              <div className="text-[#A9B2C7] text-sm mb-1">Sequência atual</div>
              <div className="text-[#F7CE46] font-bold text-2xl">{dailyMissions.streak_days || 0} dias</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Dungeons */}
      {recentDungeons.length > 0 && (
        <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Swords className="w-6 h-6 text-[#19E0FF]" />
            Calabouços Recentes
          </h2>
          <div className="space-y-3">
            {recentDungeons.map((dungeon, idx) => (
              <div 
                key={idx}
                className="p-4 bg-[#19E0FF]/5 rounded-lg border-l-4 border-[#19E0FF]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-white font-bold">{dungeon.dungeon_name}</div>
                  <div className="text-[#19E0FF] text-sm">{dungeon.date_str}</div>
                </div>
                <div className="flex items-center gap-4 text-sm text-[#A9B2C7]">
                  <span>Tempo: <span className="text-white font-bold">{dungeon.clear_time}</span></span>
                  <span>Grupo: <span className="text-white font-bold">{dungeon.party_size} jogadores</span></span>
                  <span className="text-[#19E0FF]">✓ {dungeon.result}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent TG */}
      {recentTG.length > 0 && (
        <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Target className="w-6 h-6 text-[#FF4B6A]" />
            Histórico TG Recente
          </h2>
          <div className="space-y-3">
            {recentTG.map((tg, idx) => (
              <div 
                key={idx}
                className="p-4 bg-[#FF4B6A]/5 rounded-lg border-l-4 border-[#FF4B6A]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`font-bold ${tg.result === 'Vitória' ? 'text-[#19E0FF]' : 'text-[#FF4B6A]'}`}>
                    {tg.result}
                  </div>
                  <div className="text-[#A9B2C7] text-sm">{tg.date_str}</div>
                </div>
                <div className="flex items-center gap-4 text-sm text-[#A9B2C7]">
                  <span>Kills: <span className="text-white font-bold">{tg.kills}</span></span>
                  <span>Mortes: <span className="text-white font-bold">{tg.deaths}</span></span>
                  <span>Assistências: <span className="text-white font-bold">{tg.assists}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}