import React from 'react';
import { Info, Swords, Shield, Activity, Heart, Zap } from 'lucide-react';

export default function TabInformacoes({ data, profile }) {
  if (!data) {
    return (
      <div className="text-center py-12 text-[#A9B2C7]">
        Nenhuma informação disponível
      </div>
    );
  }

  const baseStats = data.base_stats || {};
  const description = data.description || 'Sem descrição';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-[#19E0FF]/10 to-[#1A9FE8]/10 border border-[#19E0FF]/30 rounded-xl p-8">
        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
          <Info className="w-8 h-8 text-[#19E0FF]" />
          Visão Geral
        </h2>
        
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-[#0C121C]/50 rounded-lg">
            <div className="text-[#A9B2C7] text-sm mb-1">Classe</div>
            <div className="text-white font-bold text-lg">{profile?.class_code || 'N/A'}</div>
          </div>
          <div className="p-4 bg-[#0C121C]/50 rounded-lg">
            <div className="text-[#A9B2C7] text-sm mb-1">Level</div>
            <div className="text-white font-bold text-lg">{profile?.level || 'N/A'}</div>
          </div>
          <div className="p-4 bg-[#0C121C]/50 rounded-lg">
            <div className="text-[#A9B2C7] text-sm mb-1">Guilda</div>
            <div className="text-white font-bold text-lg">{profile?.guild_name || 'Nenhuma'}</div>
          </div>
          <div className="p-4 bg-[#0C121C]/50 rounded-lg">
            <div className="text-[#A9B2C7] text-sm mb-1">Nação</div>
            <div className="text-white font-bold text-lg">{profile?.nation || 'N/A'}</div>
          </div>
          <div className="p-4 bg-[#0C121C]/50 rounded-lg">
            <div className="text-[#A9B2C7] text-sm mb-1">Poder de Combate</div>
            <div className="text-[#19E0FF] font-bold text-lg">{profile?.battle_power || 'N/A'}</div>
          </div>
          <div className="p-4 bg-[#0C121C]/50 rounded-lg">
            <div className="text-[#A9B2C7] text-sm mb-1">Rank de Honra</div>
            <div className="text-[#F7CE46] font-bold text-lg">{profile?.honor_level || 'N/A'}</div>
          </div>
        </div>

        <div className="p-4 bg-[#0C121C]/50 rounded-lg">
          <div className="text-[#A9B2C7] text-sm mb-2">Descrição</div>
          <p className="text-white">{description}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-xl p-8">
        <h3 className="text-2xl font-bold text-white mb-6">Estatísticas Base</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-[#19E0FF]/5 rounded-lg flex items-center gap-3">
            <Swords className="w-6 h-6 text-[#19E0FF]" />
            <div>
              <div className="text-[#A9B2C7] text-xs">Poder de Ataque</div>
              <div className="text-white font-bold text-lg">{baseStats.attack_power?.toLocaleString() || '0'}</div>
            </div>
          </div>
          <div className="p-4 bg-[#19E0FF]/5 rounded-lg flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#19E0FF]" />
            <div>
              <div className="text-[#A9B2C7] text-xs">Poder de Defesa</div>
              <div className="text-white font-bold text-lg">{baseStats.defense_power?.toLocaleString() || '0'}</div>
            </div>
          </div>
          <div className="p-4 bg-[#19E0FF]/5 rounded-lg flex items-center gap-3">
            <Activity className="w-6 h-6 text-[#F7CE46]" />
            <div>
              <div className="text-[#A9B2C7] text-xs">Taxa Crítica</div>
              <div className="text-white font-bold text-lg">{baseStats.critical_rate || 0}%</div>
            </div>
          </div>
          <div className="p-4 bg-[#19E0FF]/5 rounded-lg flex items-center gap-3">
            <Zap className="w-6 h-6 text-[#F7CE46]" />
            <div>
              <div className="text-[#A9B2C7] text-xs">Dano Crítico</div>
              <div className="text-white font-bold text-lg">{baseStats.critical_damage || 0}%</div>
            </div>
          </div>
          <div className="p-4 bg-[#19E0FF]/5 rounded-lg flex items-center gap-3">
            <Heart className="w-6 h-6 text-[#FF4B6A]" />
            <div>
              <div className="text-[#A9B2C7] text-xs">HP Máximo</div>
              <div className="text-white font-bold text-lg">{baseStats.hp_max?.toLocaleString() || '0'}</div>
            </div>
          </div>
          <div className="p-4 bg-[#19E0FF]/5 rounded-lg flex items-center gap-3">
            <Zap className="w-6 h-6 text-[#1A9FE8]" />
            <div>
              <div className="text-[#A9B2C7] text-xs">MP Máximo</div>
              <div className="text-white font-bold text-lg">{baseStats.mp_max?.toLocaleString() || '0'}</div>
            </div>
          </div>
          <div className="p-4 bg-[#19E0FF]/5 rounded-lg flex items-center gap-3">
            <Activity className="w-6 h-6 text-[#19E0FF]" />
            <div>
              <div className="text-[#A9B2C7] text-xs">Velocidade de Movimento</div>
              <div className="text-white font-bold text-lg">{baseStats.movement_speed || '0'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}