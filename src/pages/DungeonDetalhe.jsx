import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, Map, Users, User, Clock, Star, Trophy, Skull, AlertTriangle
} from 'lucide-react';
import CrystalBorder from '@/components/ui/CrystalBorder';
import SectionTitle from '@/components/ui/SectionTitle';
import { Badge } from '@/components/ui/badge';

const dungeonsFullData = {
  'lakeside': {
    name: 'Ruína de Lakeside',
    recommended_level: 95,
    difficulty: 2,
    type: 'SOLO',
    timeLimit: '20 min',
    description: 'Uma ruína antiga próxima ao lago. Perfeita para jogadores que estão começando a explorar dungeons solo.',
    rewards: 'Equipamentos Azuis +9 a +11, Cristais de Upgrade x10, 500k ALZ, EXP x2',
    bosses: [
      {
        name: 'Guardian Corrompido',
        hp: '2.5M',
        mechanics: [
          'AoE circular vermelho a cada 30 segundos (desvie ou morra)',
          'Spawna 3 adds quando HP chega a 70%, 40% e 10%',
          'Adds curam o boss se não forem mortos em 20s'
        ]
      }
    ],
    guia: [
      'Mate os adds IMEDIATAMENTE quando aparecerem',
      'Sempre desvie do AoE vermelho (tem 2s de telegraph)',
      'Use potions quando HP cair abaixo de 50%',
      'Boss não tem enrage, então pode ir com calma'
    ]
  },
  'forgotten-temple-b1f': {
    name: 'Forgotten Temple B1F',
    recommended_level: 120,
    difficulty: 3,
    type: 'PARTY',
    timeLimit: '35 min',
    partySize: '4-7 jogadores',
    description: 'Primeiro andar do Templo Esquecido. Coordenação de grupo começa a ser essencial.',
    rewards: 'Set Épico +11 a +13, Alz 1.5M, Force Cores Rank 5-6, EXP Party Bonus',
    bosses: [
      {
        name: 'Arquimago das Sombras',
        hp: '12M',
        mechanics: [
          'Fase 1: Spawna 4 pilares elementais. Destrua todos antes de atacar o boss.',
          'Fase 2: Boss se torna atacável. Teleporta a cada 15s. DPS deve trocar alvo rápido.',
          'Fase 3 (30% HP): Enrage. ATK +100%. Party deve usar cooldowns defensivos.'
        ]
      }
    ],
    guia: [
      'Tank segura adds enquanto DPS mata pilares',
      'Healer/FA deve dispellar debuff de poison (purple icon)',
      'Quando boss teleportar, olhe minimap para localizar',
      'Fase 3: Use potion premium, FS usa Shield Wall, foquem burn rápido',
      'Se wipe: revive na entrada, tenta de novo (sem penalty)'
    ]
  },
  'illusion-castle-rh': {
    name: 'Illusion Castle Radiant Hall',
    recommended_level: 170,
    difficulty: 4,
    type: 'PARTY',
    timeLimit: '45 min',
    partySize: '7 jogadores (tank, healer, 5 DPS)',
    description: 'Salão radiante do lendário Castelo da Ilusão. Requer gear +13 mínimo e coordenação vocal.',
    rewards: 'Armas Míticas +14 a +15, Set Lendário partes aleatórias, Alz 4M, Título "Castle Conqueror" (7 dias)',
    bosses: [
      {
        name: 'Cavaleiro Espectral',
        hp: '35M',
        mechanics: [
          'Fase 1 (100-60%): Ataque físico puro. MT tankar normalmente.',
          'Fase 2 (60-30%): Muda para mágico. Party se espalha. Interromper "Void Explosion" ou wipe.',
          'Fase 3 (30-0%): Híbrido. Alterna físico/mágico a cada 30s. Atenção ao telegraph (cor da aura).',
          'ENRAGE em 30 minutos: Boss one-shots todos.'
        ]
      },
      {
        name: 'Rainha Ilusória (Optional Boss)',
        hp: '50M',
        mechanics: [
          'Spawna após derrotar Cavaleiro em <25 min',
          'Cria 5 clones. Apenas 1 é real (aquele que não brilha)',
          'Foco no clone real. Matar clones falsos = +10% HP no boss',
          'Recompensa extra: Legendary Weapon garantido'
        ]
      }
    ],
    guia: [
      'Composição ideal: WA/FS tank, FA heal, BL/WI/FG/FB DPS',
      'Fase 1: Tank segura, DPS queima normalmente',
      'Fase 2: TODOS se espalham (mínimo 10m distância). Wizard interrompe Void Explosion com stun',
      'Fase 3: Call no voice "FÍSICO" ou "MÁGICO" quando aura mudar',
      'Optional Boss: Foca no clone que NÃO tem brilho ao redor',
      'Use food buffs (+30% stats) e scrolls para este fight'
    ]
  },
  'chaos-arena': {
    name: 'Chaos Arena',
    recommended_level: 190,
    difficulty: 5,
    type: 'PARTY',
    timeLimit: 'Infinito (ondas)',
    partySize: '7 jogadores max-geared',
    description: 'A arena do caos eterno. Ondas infinitas de inimigos. Ranking semanal de maior onda alcançada.',
    rewards: 'Loot escala por onda. Onda 50+: Legendary garantido. Top 10 ranking: Títulos permanentes.',
    bosses: [
      {
        name: 'Sistema de Ondas',
        hp: 'Variável',
        mechanics: [
          'Onda 1-20: Mobs normais. Warm-up.',
          'Onda 21-40: Mini-bosses a cada 5 ondas. Mecânicas simples.',
          'Onda 41-60: Boss a cada 5 ondas. Mecânicas complexas obrigatórias.',
          'Onda 61+: EXTREME. Wipe = fim da run. Requer execution perfeita.',
          'Onda 100: Final Boss "Chaos Lord" - nunca foi derrotado em ZIRON.'
        ]
      }
    ],
    guia: [
      'Traga food, scrolls e potions em massa (200+ cada)',
      'Morte de 1 player = run continua mas fica mais difícil',
      'Onda 50: checkpoint. Pode reviver mortos aqui.',
      'Tática: FS tank no centro, DPS ao redor em círculo, healer mobile',
      'Comunicação constante no voice é OBRIGATÓRIA',
      'Current record ZIRON: Onda 73 por guilda "Dominion"'
    ]
  }
};

export default function DungeonDetalhe() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');
  
  const dungeon = dungeonsFullData[slug];

  if (!dungeon) {
    navigate(createPageUrl('Wiki'));
    return null;
  }

  const difficultyStars = dungeon.difficulty;
  const difficultyColor = 
    difficultyStars <= 2 ? '#10B981' :
    difficultyStars === 3 ? '#F7CE46' :
    difficultyStars === 4 ? '#FF6B35' : '#FF4B6A';

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate(createPageUrl('Wiki'))}
          className="inline-flex items-center gap-2 text-[#A9B2C7] hover:text-white transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar para Wiki
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <CrystalBorder tier="Platinum Crystal" showLabel>
            <div className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-black text-white mb-3">{dungeon.name}</h1>
                  <p className="text-[#A9B2C7] text-lg mb-4">{dungeon.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <Badge className="bg-[#19E0FF]/20 text-[#19E0FF] border-[#19E0FF]/30">
                      <Star className="w-3 h-3 mr-1" />
                      Nível {dungeon.recommended_level}+
                    </Badge>
                    <Badge className={`border-${difficultyColor}/30`} style={{ backgroundColor: `${difficultyColor}20`, color: difficultyColor }}>
                      <Skull className="w-3 h-3 mr-1" />
                      Dificuldade: {difficultyStars}/5
                    </Badge>
                    <Badge className="bg-[#9146FF]/20 text-[#9146FF] border-[#9146FF]/30">
                      {dungeon.type === 'SOLO' ? (
                        <><User className="w-3 h-3 mr-1" /> Solo</>
                      ) : (
                        <><Users className="w-3 h-3 mr-1" /> {dungeon.partySize || 'Party'}</>
                      )}
                    </Badge>
                    <Badge className="bg-[#A9B2C7]/20 text-[#A9B2C7] border-[#A9B2C7]/30">
                      <Clock className="w-3 h-3 mr-1" />
                      {dungeon.timeLimit}
                    </Badge>
                  </div>
                </div>

                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-6 h-6"
                      style={{
                        color: i < difficultyStars ? difficultyColor : '#A9B2C7',
                        fill: i < difficultyStars ? difficultyColor : 'transparent'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CrystalBorder>
        </motion.div>

        {/* Rewards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <CrystalBorder tier="Legendary Arch-Crystal">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <Trophy className="w-6 h-6 text-[#FFD700]" />
                Recompensas
              </h2>
              <div className="p-5 bg-gradient-to-r from-[#FFD700]/10 to-transparent rounded-lg border-l-4 border-[#FFD700]">
                <p className="text-white leading-relaxed">{dungeon.rewards}</p>
              </div>
            </div>
          </CrystalBorder>
        </motion.div>

        {/* Bosses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 space-y-6"
        >
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Skull className="w-6 h-6 text-[#FF4B6A]" />
            Bosses e Mecânicas
          </h2>
          
          {dungeon.bosses.map((boss, idx) => (
            <CrystalBorder key={idx} tier="Obsidian Crystal">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{boss.name}</h3>
                  {boss.hp && (
                    <Badge className="bg-[#FF4B6A]/20 text-[#FF4B6A] border-[#FF4B6A]/30">
                      HP: {boss.hp}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-3">
                  {boss.mechanics.map((mechanic, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-[#0C121C] rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-[#F7CE46] flex-shrink-0 mt-0.5" />
                      <p className="text-[#A9B2C7] text-sm">{mechanic}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CrystalBorder>
          ))}
        </motion.div>

        {/* Strategy Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <CrystalBorder tier="Silver Crystal">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <Map className="w-6 h-6 text-[#19E0FF]" />
                Guia de Finalização
              </h2>
              <div className="space-y-3">
                {dungeon.guia.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#19E0FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#19E0FF] text-sm font-bold">{i + 1}</span>
                    </div>
                    <p className="text-[#A9B2C7] pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </CrystalBorder>
        </motion.div>
      </div>
    </div>
  );
}