import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Zap, Swords, Shield, Medal } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import SectionTitle from '@/components/ui/SectionTitle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import Pagination from '@/components/ui/Pagination';
import { useRankings } from '@/components/hooks/useAppData';
import LoadingShell from '@/components/ui/LoadingShell';

const classNames = {
  WA: 'Guerreiro',
  BL: 'Espadachim',
  WI: 'Mago',
  FA: 'Arqueiro Arcano',
  FS: 'Guardião Arcano',
  FB: 'Espadachim Arcano',
  FG: 'Atirador Arcano'
};

const mockRankingData = {
  POWER: [
    { position: 1, username: 'DarkSlayer', class_code: 'BL', guild_name: 'Apocalypse', value: 985420, attack: 552000, defense: 441200 },
    { position: 2, username: 'ShadowMage', class_code: 'WI', guild_name: 'Phoenix', value: 942180, attack: 528100, defense: 420180 },
    { position: 3, username: 'IronGuard', class_code: 'FS', guild_name: 'Apocalypse', value: 891340, attack: 498780, defense: 401340 },
    { position: 4, username: 'StormArcher', class_code: 'FA', guild_name: 'Legends', value: 856720, attack: 479520, defense: 385720 },
    { position: 5, username: 'BladeRunner', class_code: 'FB', guild_name: 'Phoenix', value: 823150, attack: 461150, defense: 370150 },
    { position: 6, username: 'WarriorX', class_code: 'WA', guild_name: 'Elite', value: 798430, attack: 447430, defense: 358430 },
    { position: 7, username: 'GunnerPro', class_code: 'FG', guild_name: 'Legends', value: 765890, attack: 428890, defense: 343890 },
    { position: 8, username: 'MysticForce', class_code: 'WI', guild_name: 'Phoenix', value: 742310, attack: 416310, defense: 333310 },
    { position: 9, username: 'SwordMaster', class_code: 'BL', guild_name: 'Elite', value: 718650, attack: 402650, defense: 322650 },
    { position: 10, username: 'ShieldKnight', class_code: 'FS', guild_name: 'Apocalypse', value: 694520, attack: 389520, defense: 311520 },
  ],
  TG: [
    { position: 1, username: 'TGMaster', class_code: 'BL', guild_name: 'Apocalypse', value: 892 },
    { position: 2, username: 'WarGeneral', class_code: 'WA', guild_name: 'Phoenix', value: 845 },
    { position: 3, username: 'BattleCommander', class_code: 'FB', guild_name: 'Legends', value: 798 },
    { position: 4, username: 'SiegeKing', class_code: 'FS', guild_name: 'Elite', value: 752 },
    { position: 5, username: 'GuildLeader', class_code: 'WI', guild_name: 'Apocalypse', value: 706 },
    { position: 6, username: 'WarriorPrime', class_code: 'FG', guild_name: 'Phoenix', value: 658 },
    { position: 7, username: 'TierraHero', class_code: 'FA', guild_name: 'Legends', value: 612 },
    { position: 8, username: 'ConquestLord', class_code: 'BL', guild_name: 'Elite', value: 567 },
    { position: 9, username: 'FortressMaster', class_code: 'WA', guild_name: 'Phoenix', value: 523 },
    { position: 10, username: 'TGChampion', class_code: 'FS', guild_name: 'Apocalypse', value: 481 },
  ],
  GUILDS: [
    { position: 1, name: 'Apocalypse', faction: 'Procyon', level: 12 },
    { position: 2, name: 'Phoenix', faction: 'Capella', level: 11 },
    { position: 3, name: 'Legends', faction: 'Procyon', level: 10 },
    { position: 4, name: 'Elite', faction: 'Capella', level: 9 },
    { position: 5, name: 'Warriors', faction: 'Procyon', level: 8 },
  ]
};

export default function Ranking() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('POWER');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Use cached rankings hook (reduces API calls significantly)
  const { data: rankings = { POWER: [], TG: [], GUILDS: [] }, isLoading: loading } = useRankings();

  if (loading) {
    return <LoadingShell message="Carregando rankings..." fullScreen={false} />;
  }



  const getMedalColor = (position) => {
    switch (position) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return '#A9B2C7';
    }
  };

  const formatValue = (type, value) => {
    if (type === 'POWER') return value.toLocaleString();
    if (type === 'TG') return value + ' vitórias';
    return value.toLocaleString();
  };

  // Reset page when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const renderPlayerRanking = (type) => {
    const data = rankings[type] || [];
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);

    return (
      <>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
          <tr className="border-b border-[#19E0FF]/10">
            <th className="text-left py-4 px-4 text-[#A9B2C7] font-medium text-sm">#</th>
            <th className="text-left py-4 px-4 text-[#A9B2C7] font-medium text-sm">Jogador</th>
            <th className="text-left py-4 px-4 text-[#A9B2C7] font-medium text-sm hidden md:table-cell">Classe</th>
            <th className="text-left py-4 px-4 text-[#A9B2C7] font-medium text-sm hidden sm:table-cell">Guilda</th>
            {type === 'POWER' && (
              <th className="text-right py-4 px-4 text-[#A9B2C7] font-medium text-sm hidden lg:table-cell">PA / PD</th>
            )}
            <th className="text-right py-4 px-4 text-[#A9B2C7] font-medium text-sm">
              {type === 'POWER' ? 'Poder' : 'Vitórias'}
            </th>
          </tr>
            </thead>
            <tbody>
              {paginatedData.map((entry, index) => (
            <motion.tr
              key={entry.position || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-b border-[#19E0FF]/5 hover:bg-[#19E0FF]/5 transition-colors cursor-pointer"
              onClick={() => navigate(createPageUrl('PersonagemDetalhe') + `?id=${entry.character_id || entry.user_id || entry.username}`)}
            >
              <td className="py-4 px-4">
                <div className="flex items-center justify-center w-8 h-8">
                  {(entry.position || index + 1) <= 3 ? (
                    <Medal 
                      className="w-6 h-6" 
                      style={{ color: getMedalColor(entry.position || index + 1) }} 
                    />
                  ) : (
                    <span className="text-[#A9B2C7] font-medium">{entry.position || index + 1}</span>
                  )}
                </div>
              </td>
              <td className="py-4 px-4">
                <span className="text-white font-medium">{entry.username}</span>
              </td>
              <td className="py-4 px-4 hidden md:table-cell">
                <span className="text-[#19E0FF] text-sm">{classNames[entry.class_code] || entry.class_code}</span>
              </td>
              <td className="py-4 px-4 hidden sm:table-cell">
                <span className="text-[#F7CE46] text-sm">{entry.guild_name || '-'}</span>
              </td>
              {type === 'POWER' && entry.attack && entry.defense && (
                <td className="py-4 px-4 text-right hidden lg:table-cell">
                  <span className="font-bold">
                    <span style={{ color: '#d60000' }}>{entry.attack.toLocaleString()}</span>
                    <span className="text-[#A9B2C7]"> / </span>
                    <span style={{ color: '#0072ff' }}>{entry.defense.toLocaleString()}</span>
                  </span>
                </td>
              )}
              <td className="py-4 px-4 text-right">
                <span className="text-white font-bold">{formatValue(type, entry.value)}</span>
              </td>
            </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </>
    );
  };

  const renderGuildRanking = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#19E0FF]/10">
            <th className="text-left py-4 px-4 text-[#A9B2C7] font-medium text-sm">#</th>
            <th className="text-left py-4 px-4 text-[#A9B2C7] font-medium text-sm">Guilda</th>
            <th className="text-left py-4 px-4 text-[#A9B2C7] font-medium text-sm hidden md:table-cell">Facção</th>
            <th className="text-right py-4 px-4 text-[#A9B2C7] font-medium text-sm">Level</th>
          </tr>
        </thead>
        <tbody>
          {rankings.GUILDS?.map((guild, index) => (
            <motion.tr
              key={guild.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-b border-[#19E0FF]/5 hover:bg-[#19E0FF]/5 transition-colors"
            >
              <td className="py-4 px-4">
                <div className="flex items-center justify-center w-8 h-8">
                  {(guild.position || index + 1) <= 3 ? (
                    <Medal 
                      className="w-6 h-6" 
                      style={{ color: getMedalColor(guild.position || index + 1) }} 
                    />
                  ) : (
                    <span className="text-[#A9B2C7] font-medium">{guild.position || index + 1}</span>
                  )}
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8] rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[#05070B]" />
                  </div>
                  <span className="text-white font-medium">{guild.name}</span>
                </div>
              </td>
              <td className="py-4 px-4 hidden md:table-cell">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  guild.faction === 'Capella' 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {guild.faction}
                </span>
              </td>
              <td className="py-4 px-4 text-right">
                <span className="text-[#F7CE46] font-bold text-lg">Lv {guild.level || 1}</span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );



  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionTitle 
          title="Rankings"
          subtitle="Os melhores guerreiros de Nevareth"
        />

        <div className="mt-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-[#0C121C] p-1 rounded-xl mb-8">
              <TabsTrigger 
                value="POWER"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#19E0FF] data-[state=active]:to-[#1A9FE8] data-[state=active]:text-[#05070B] rounded-lg"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Poder</span>
                <span className="sm:hidden">Poder</span>
              </TabsTrigger>
              <TabsTrigger 
                value="TG"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF4B6A] data-[state=active]:to-[#FF6B8A] data-[state=active]:text-white rounded-lg"
              >
                <Swords className="w-4 h-4" />
                <span className="hidden sm:inline">TG</span>
                <span className="sm:hidden">TG</span>
              </TabsTrigger>
              <TabsTrigger 
                value="GUILDS"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1A9FE8] data-[state=active]:to-[#19E0FF] data-[state=active]:text-[#05070B] rounded-lg"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Guildas</span>
                <span className="sm:hidden">Guildas</span>
              </TabsTrigger>
            </TabsList>

            <GlowCard className="p-6">
                  <TabsContent value="POWER" className="mt-0">
                    {renderPlayerRanking('POWER')}
                  </TabsContent>
                  <TabsContent value="TG" className="mt-0">
                    {renderPlayerRanking('TG')}
                  </TabsContent>
              <TabsContent value="GUILDS" className="mt-0">
                {renderGuildRanking()}
              </TabsContent>
            </GlowCard>
          </Tabs>
        </div>
      </div>
    </div>
  );
}