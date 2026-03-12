// UI-ONLY EXPORT - Guildas Page
// Base44 dependencies removed - ready for Next.js migration

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import SectionTitle from '@/components/ui/SectionTitle';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import LoadingShell from '@/components/ui/LoadingShell';
import { STUB_GUILDS } from '@/components/ui_export_stubs/data';

export default function GuildasExport() {
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [factionFilter, setFactionFilter] = useState('all');
  const [recruitingFilter, setRecruitingFilter] = useState('all');

  useEffect(() => {
    loadGuilds();
  }, []);

  const loadGuilds = async () => {
    setLoading(true);
    try {
      // STUB: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setGuilds(STUB_GUILDS);
    } catch (e) {
      setGuilds(STUB_GUILDS);
    } finally {
      setLoading(false);
    }
  };

  const filteredGuilds = guilds.filter(guild => {
    const matchesSearch = guild.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFaction = factionFilter === 'all' || guild.faction === factionFilter;
    const matchesRecruiting = recruitingFilter === 'all' || 
      (recruitingFilter === 'recruiting' && guild.recruiting) ||
      (recruitingFilter === 'not-recruiting' && !guild.recruiting);
    
    return matchesSearch && matchesFaction && matchesRecruiting;
  });

  if (loading) {
    return <LoadingShell message="Carregando guildas..." fullScreen={false} />;
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionTitle 
          title="Guildas"
          subtitle="Encontre sua irmandade e conquiste Nevareth"
        />

        {/* Filters */}
        <div className="mt-12 mb-8">
          <GlowCard className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B2C7]" />
                <Input
                  placeholder="Buscar guilda..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#05070B] border-[#19E0FF]/20 text-white placeholder:text-[#A9B2C7]/50"
                />
              </div>
              <div className="flex gap-4">
                <Select value={factionFilter} onValueChange={setFactionFilter}>
                  <SelectTrigger className="w-[150px] bg-[#05070B] border-[#19E0FF]/20 text-white">
                    <SelectValue placeholder="Facção" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0C121C] border-[#19E0FF]/20">
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="Capella">Capella</SelectItem>
                    <SelectItem value="Procyon">Procyon</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={recruitingFilter} onValueChange={setRecruitingFilter}>
                  <SelectTrigger className="w-[150px] bg-[#05070B] border-[#19E0FF]/20 text-white">
                    <SelectValue placeholder="Recrutamento" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0C121C] border-[#19E0FF]/20">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="recruiting">Recrutando</SelectItem>
                    <SelectItem value="not-recruiting">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </GlowCard>
        </div>

        {/* Guild Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuilds.map((guild, index) => (
            <motion.div
              key={guild.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlowCard className="p-6 h-full group cursor-pointer" glowColor={guild.faction === 'Capella' ? '#4A90D9' : '#D94A4A'}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        guild.faction === 'Capella' 
                          ? 'bg-blue-500/20' 
                          : 'bg-red-500/20'
                      }`}
                    >
                      <Shield 
                        className="w-7 h-7" 
                        style={{ color: guild.faction === 'Capella' ? '#4A90D9' : '#D94A4A' }}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-[#19E0FF] transition-colors">
                        {guild.name}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          guild.faction === 'Capella' 
                            ? 'border-blue-500/50 text-blue-400' 
                            : 'border-red-500/50 text-red-400'
                        }`}
                      >
                        {guild.faction}
                      </Badge>
                    </div>
                  </div>
                  {guild.recruiting && (
                    <Badge className="bg-[#19E0FF]/20 text-[#19E0FF] border-[#19E0FF]/30">
                      Recrutando
                    </Badge>
                  )}
                </div>

                <p className="text-[#A9B2C7] text-sm mb-4 line-clamp-2">
                  {guild.description || 'Uma guilda poderosa de Nevareth'}
                </p>

                <div className="flex justify-center pt-4 border-t border-[#19E0FF]/10">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-[#F7CE46] mb-1">
                      <Shield className="w-5 h-5" />
                    </div>
                    <span className="text-white font-bold text-2xl">Lv {guild.level || 1}</span>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>

        {filteredGuilds.length === 0 && (
          <div className="text-center py-16">
            <Shield className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhuma guilda encontrada</h3>
            <p className="text-[#A9B2C7]">Tente ajustar os filtros de busca</p>
          </div>
        )}
      </div>
    </div>
  );
}