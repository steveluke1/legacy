import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Crown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import MetalButton from '@/components/ui/MetalButton';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingShell from '@/components/ui/LoadingShell';

// Tab Components
import TabGeral from '@/components/personagem/TabGeral.jsx';
import TabRunas from '@/components/personagem/TabRunas.jsx';
import TabLinkEstelar from '@/components/personagem/TabLinkEstelar.jsx';
import TabColecao from '@/components/personagem/TabColecao.jsx';
import TabMerito from '@/components/personagem/TabMerito.jsx';
import TabMedalhaHonra from '@/components/personagem/TabMedalhaHonra.jsx';
import TabAsaArcana from '@/components/personagem/TabAsaArcana.jsx';
import TabMitico from '@/components/personagem/TabMitico.jsx';
import TabConquistas from '@/components/personagem/TabConquistas.jsx';
import TabMercenarios from '@/components/personagem/TabMercenarios.jsx';
import TabCriacao from '@/components/personagem/TabCriacao.jsx';
import TabInformacoes from '@/components/personagem/TabInformacoes.jsx';
import TabAtividades from '@/components/personagem/TabAtividades.jsx';

const classNames = {
  WA: 'Guerreiro',
  BL: 'Espadachim',
  WI: 'Mago',
  FA: 'Arqueiro Arcano',
  FS: 'Guardião Arcano',
  FB: 'Espadachim Arcano',
  FG: 'Atirador Arcano'
};

export default function PersonagemDetalhe() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('informacoes');
  const [id, setId] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const characterId = urlParams.get('id');
    setId(characterId);
  }, []);

  useEffect(() => {
    if (id) {
      loadProfile();
    }
  }, [id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await base44.functions.invoke('character_getProfile', { character_id: id });
      
      if (response.data && response.data.success && response.data.profile) {
        setProfile(response.data.profile);
      } else {
        setError(response.data?.error || 'Perfil de personagem não encontrado.');
      }
    } catch (e) {
      console.error('Erro ao carregar perfil:', e);
      if (e.response && e.response.status === 404) {
        setError('Este personagem não foi encontrado no sistema.');
      } else {
        setError('Não foi possível carregar o perfil. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingShell message="Carregando personagem..." fullScreen={false} />;
  }

  if (error || (!loading && !profile)) {
    return (
      <div className="min-h-screen py-20 px-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md text-center"
        >
          <Shield className="w-20 h-20 text-[#A9B2C7]/30 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Personagem Não Encontrado</h2>
          <p className="text-[#A9B2C7] mb-6">
            {error || 'Este personagem pode ter sido renomeado, removido ou ainda não foi sincronizado com o ranking.'}
          </p>
          <MetalButton onClick={() => navigate(createPageUrl('Ranking'))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o Ranking
          </MetalButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <MetalButton
            variant="secondary"
            onClick={() => navigate(createPageUrl('Ranking'))}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </MetalButton>

          <div className="bg-gradient-to-r from-[#0C121C] to-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-xl p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8] flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#05070B]">
                    {profile.class_code}
                  </span>
                </div>
                {profile.honor_level && (
                  <div className="w-12 h-12 rounded-full bg-[#F7CE46]/20 border-2 border-[#F7CE46] flex items-center justify-center">
                    <span className="text-[#F7CE46] font-bold">{profile.honor_level}</span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2">{profile.character_name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[#A9B2C7]">Guild:</span>
                    <span className="text-[#F7CE46] font-bold">{profile.guild_name || 'Sem guild'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#A9B2C7]">Level:</span>
                    <span className="text-white font-bold">{profile.level}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#A9B2C7]">Nação:</span>
                    <span className={`font-bold ${profile.nation === 'Capella' ? 'text-blue-400' : 'text-red-400'}`}>
                      {profile.nation}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-6 mt-4">
                  <div>
                    <span className="text-[#A9B2C7] text-xs">Poder de Combate</span>
                    <div className="text-2xl font-bold text-[#19E0FF]">{profile.battle_power}</div>
                  </div>
                  {profile.honor_level && (
                    <div>
                      <span className="text-[#A9B2C7] text-xs">Honra</span>
                      <div className="text-2xl font-bold text-[#F7CE46]">{profile.honor_level}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto mb-6">
              <TabsList className="inline-flex bg-[#0C121C] p-1 rounded-xl min-w-max">
                <TabsTrigger value="informacoes">Informações</TabsTrigger>
                <TabsTrigger value="atividades">Atividades</TabsTrigger>
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="runas">Runas</TabsTrigger>
                <TabsTrigger value="link-estelar">Link Estelar</TabsTrigger>
                <TabsTrigger value="colecao">Coleção</TabsTrigger>
                <TabsTrigger value="merito">Mérito</TabsTrigger>
                <TabsTrigger value="medalha-honra">Medalha de Honra</TabsTrigger>
                <TabsTrigger value="asa-arcana">Asa Arcana</TabsTrigger>
                <TabsTrigger value="mitico">Mítico</TabsTrigger>
                <TabsTrigger value="conquistas">Conquistas</TabsTrigger>
                <TabsTrigger value="mercenarios">Mercenários</TabsTrigger>
                <TabsTrigger value="criacao">Criação</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="informacoes"><TabInformacoes data={profile.info_tab} profile={profile} /></TabsContent>
            <TabsContent value="atividades"><TabAtividades data={profile.activities_tab} /></TabsContent>
            <TabsContent value="geral"><TabGeral stats={profile.general_stats} /></TabsContent>
            <TabsContent value="runas"><TabRunas data={profile.runes} /></TabsContent>
            <TabsContent value="link-estelar"><TabLinkEstelar data={profile.stellar_link} /></TabsContent>
            <TabsContent value="colecao"><TabColecao data={profile.collection} /></TabsContent>
            <TabsContent value="merito"><TabMerito data={profile.merit} /></TabsContent>
            <TabsContent value="medalha-honra"><TabMedalhaHonra data={profile.medal_of_honor} /></TabsContent>
            <TabsContent value="asa-arcana"><TabAsaArcana data={profile.arcane_wing} /></TabsContent>
            <TabsContent value="mitico"><TabMitico data={profile.mythic} /></TabsContent>
            <TabsContent value="conquistas"><TabConquistas data={profile.achievements} /></TabsContent>
            <TabsContent value="mercenarios"><TabMercenarios data={profile.mercenaries} /></TabsContent>
            <TabsContent value="criacao"><TabCriacao data={profile.crafting} /></TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}