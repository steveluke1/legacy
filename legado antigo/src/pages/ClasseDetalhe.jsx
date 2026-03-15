import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, Swords, Shield, Wand2, Target, Zap, Star, TrendingUp, 
  Sparkles, BookOpen, Award
} from 'lucide-react';
import CrystalBorder from '@/components/ui/CrystalBorder';
import MetalButton from '@/components/ui/MetalButton';
import SectionTitle from '@/components/ui/SectionTitle';

const classesFullData = {
  WA: {
    code: 'WA',
    name: 'Guerreiro',
    englishName: 'Warrior',
    icon: Swords,
    color: '#FF6B35',
    description: 'O Guerreiro é a personificação da força bruta em Nevareth. Com espadas massivas e armaduras impenetráveis, lidera a linha de frente destruindo inimigos com poder devastador.',
    battleModes: [
      {
        mode: 1,
        name: 'Modo Normal',
        description: 'Balanço entre ATK e DEF. Ideal para farming e PvE geral. Uso moderado de MP.',
        when: 'Use para farming de mobs, DGs fáceis e missões solo.'
      },
      {
        mode: 2,
        name: 'Modo Berserk',
        description: 'ATK +30%, DEF -15%. Dano massivo com risco calculado. Consome mais MP.',
        when: 'PvP, TG, boss fights quando há suporte de FS. Máximo DPS.'
      },
      {
        mode: 3,
        name: 'Modo Guardião',
        description: 'DEF +40%, HP Regen +20%. Tank supremo. Consome muito MP.',
        when: 'Tankar bosses em DGs hard, segurar torre em TG, proteger healers.'
      }
    ],
    rotation: 'Dash → Cleave → Blade Slash → Ground Smash → (repeat)',
    combos: [
      'Dash + Cleave (stun) → Blade Slash (burst)',
      'Ground Smash (knockdown) → Charged cleave durante animação',
      'PvP: Dash behind → Back Strike → Blade combo'
    ],
    skillTags: ['Dano Físico', 'Tank', 'CC', 'Sustain'],
    metaBuild2025: 'Full STR com 100+ DEX para accuracy. Priorize Critical Rate e Physical Amp. Armadura Shadowsteel +15 com craft de HP% e Physical Defense. Arma: Daikatana +15 com Crit Rate slots.',
    gearInicial: 'Set Mithril +9 (nível 95). Pode ser comprado com Alz ou farmar em Forgotten Temple B1F.',
    transcendencia: 'Foque primeiro em STR até 200, depois DEX até 100. Terceiro slot: HP ou Critical Rate dependendo se PvE ou PvP.',
    guiaUpar: [
      'Nível 1-50: Siga quests principais. Use modo Normal.',
      'Nível 50-95: Farm em Desert Scream. Modo Berserk para clear rápido.',
      'Nível 95-120: Ruína de Lakeside (DG). Grupos de 4-5.',
      'Nível 120-150: Forgotten Temple B1F. Modo Guardião para tankar.',
      'Nível 150-170: Illusion Castle RH. Já precisa de gear +12.',
      'Nível 170+: Chaos Arena ou farm de honor em TG.'
    ]
  },
  BL: {
    code: 'BL',
    name: 'Espadachim',
    englishName: 'Blader',
    icon: Zap,
    color: '#19E0FF',
    description: 'Mestre das lâminas duplas. O Espadachim é pura velocidade e letalidade, executando combos fluidos que destroem inimigos antes mesmo de reagirem.',
    battleModes: [
      {
        mode: 1,
        name: 'Modo Arte',
        description: 'Attack Speed +20%. Combos mais rápidos e fluidos.',
        when: 'PvE geral, farming, DGs. Melhor sustentação de DPS.'
      },
      {
        mode: 2,
        name: 'Modo Aura',
        description: 'Critical Damage +35%. Burst extremo em janelas curtas.',
        when: 'PvP 1v1, ganks em TG. Mate antes de ser morto.'
      },
      {
        mode: 3,
        name: 'Modo Transcendência',
        description: 'Combinação de Speed e Crit. META atual para end-game.',
        when: 'Boss fights, raids, competitivo high-tier.'
      }
    ],
    rotation: 'Rising Shot → Double Slash → Air Slash → Sword Storm → Chain Combo (cancel animation)',
    combos: [
      'Rising Shot (launcher) → Air combo full → finalize com Sword Storm',
      'Double Slash → Dash cancel → Back Slash → Chain',
      'PvP: Stealth → Back Slash (crit garantido) → combo rápido → Dash out'
    ],
    skillTags: ['DPS', 'Burst', 'Mobilidade', 'Combo Master'],
    metaBuild2025: 'Híbrido STR/DEX (2:1). Critical Damage > Attack Rate. Set Mithril +15 com slots de Critical Rate. Espadas: duplas +15 com Sword Skill Amp.',
    gearInicial: 'Set Adamant +9. Farm em Lake in Dusk ou compre no mercado.',
    transcendencia: 'DEX primeiro até 150 (accuracy crítico). Depois STR até 250. Terceiro: Critical Damage.',
    guiaUpar: [
      'Nível 1-50: Quests. Modo Arte para speed.',
      'Nível 50-95: Port Lux mobs. Aprenda combos básicos.',
      'Nível 95-120: Panic Cave party. Pratique combo full.',
      'Nível 120-150: Lake in Dusk. Modo Aura para boss.',
      'Nível 150+: Illusion Castle com party organizada.'
    ]
  },
  WI: {
    code: 'WI',
    name: 'Mago',
    englishName: 'Wizard',
    icon: Wand2,
    color: '#9B59B6',
    description: 'Canalizador supremo das forças arcanas. O Mago desencadeia devastação elemental à distância, varrendo campos de batalha inteiros com magia apocalíptica.',
    battleModes: [
      {
        mode: 1,
        name: 'Modo Elemental',
        description: 'Magic ATK +25%. Dano mágico puro maximizado.',
        when: 'PvE, farming de mobs, DGs. Máximo clear speed.'
      },
      {
        mode: 2,
        name: 'Modo Maestria',
        description: 'Cooldown -20%, Cast Speed +15%. Spam de skills.',
        when: 'TG, PvP, situações que exigem spam de CC e AoE.'
      },
      {
        mode: 3,
        name: 'Modo Arcano',
        description: 'Magic ATK +30%, MP Recovery +50%. Boss destroyer.',
        when: 'Boss fights longos, raids, quando há FS para proteção.'
      }
    ],
    rotation: 'Meteor (opener) → Ice Storm (slow) → Lightning Bolt → Flame Burst → Magic Missile (filler)',
    combos: [
      'Ice Storm (freeze) → Meteor direto no grupo (wipe)',
      'Lightning Bolt (stun) → Flame Burst combo',
      'PvP: Teleport → Meteor instant → Ice Storm → kite'
    ],
    skillTags: ['DPS Mágico', 'AoE', 'CC', 'Glass Cannon'],
    metaBuild2025: 'Full INT com 50 DEX mínimo. Magic Amp > Magic Critical. Set Sage +15 com craft de MP recovery e Magic ATK%. Orb: +15 com INT slots.',
    gearInicial: 'Set Arcane +9. Compre ou farm em Porta Lux.',
    transcendencia: 'INT até 300. DEX até 80. Terceiro: Magic Amp ou Magic Critical Rate.',
    guiaUpar: [
      'Nível 1-50: Quests. AoE mata tudo.',
      'Nível 50-95: Desert Scream AoE farming. Modo Elemental.',
      'Nível 95-120: Forgotten Temple. Fique atrás do FS.',
      'Nível 120+: Illusion Castle. Modo Arcano para bosses.'
    ]
  },
  FA: {
    code: 'FA',
    name: 'Arqueiro Arcano',
    englishName: 'Force Archer',
    icon: Target,
    color: '#27AE60',
    description: 'Híbrido letal de precisão e magia. O Arqueiro Arcano elimina alvos à distância com flechas mágicas enquanto cura aliados em momentos críticos.',
    battleModes: [
      {
        mode: 1,
        name: 'Modo Precisão',
        description: 'Range +30%, Accuracy +20%. Sniper supremo.',
        when: 'PvP, TG, eliminar alvos prioritários (healers, DPS).'
      },
      {
        mode: 2,
        name: 'Modo Rajada',
        description: 'Attack Speed +25%. DPS sustentado alto.',
        when: 'PvE, farming, DGs. Melhor clear speed.'
      },
      {
        mode: 3,
        name: 'Modo Místico',
        description: 'Magic + Physical balanceado. Heal Amp +15%.',
        when: 'Party support, DGs sem healer dedicado.'
      }
    ],
    rotation: 'Astral Arrow → Aqua Trap (slow) → Lightning Arrow → Fire Blast → Auto Attack',
    combos: [
      'Astral Arrow (opener) → Lightning (stun) → Fire Blast finish',
      'Suporte: Aqua Trap → heal party → re-engage DPS',
      'PvP: Max range Astral → kite com traps'
    ],
    skillTags: ['DPS', 'Range', 'Híbrido', 'Suporte'],
    metaBuild2025: 'INT/DEX balanceado (1:1). Penetration + Critical Damage. Set Mystic +15 para range. Arco: +15 com Magic Amp e Arrow Skill Amp.',
    gearInicial: 'Set Mythril +9. Pode farmar em Maquinas Outpost.',
    transcendencia: 'INT e DEX simultaneamente até 150/150. Depois INT até 250.',
    guiaUpar: [
      'Nível 1-50: Quests. Heal yourself.',
      'Nível 50-95: Farm ranged seguro.',
      'Nível 95-120: Panic Cave party support.',
      'Nível 120+: Forgotten Temple. Heal + DPS hybrid.'
    ]
  },
  FS: {
    code: 'FS',
    name: 'Guardião Arcano',
    englishName: 'Force Shielder',
    icon: Shield,
    color: '#3498DB',
    description: 'Tank absoluto de Nevareth. O Guardião Arcano absorve dano infinito com escudos mágicos impenetráveis, tornando-se a muralha entre aliados e a morte.',
    battleModes: [
      {
        mode: 1,
        name: 'Modo Proteção',
        description: 'DEF +50%, HP Regen +30%. Imortalidade.',
        when: 'Tank principal em DGs, segurar torre em TG, proteger base.'
      },
      {
        mode: 2,
        name: 'Modo Retaliação',
        description: 'Damage Reflect +40%. Quanto mais apanha, mais mata.',
        when: 'PvP quando focado, TG siege, 1v1 contra físicos.'
      },
      {
        mode: 3,
        name: 'Modo Guardião Supremo',
        description: 'Shields +50%, Party Buff Amp +25%. Meta DG.',
        when: 'DGs hard/extreme, raids, qualquer conteúdo group end-game.'
      }
    ],
    rotation: 'Shield Bash → Taunt → Reflect Shield → Group Heal → Maintain Aggro',
    combos: [
      'Pull mobs → Taunt → Group Shield → deixa DPS matar',
      'Boss: Shield Wall → Reflect → call DPS cooldowns',
      'TG: Hold position → Shield Bash interrompe cast inimigo'
    ],
    skillTags: ['Tank', 'Buff', 'Suporte', 'Imortal'],
    metaBuild2025: 'STR/INT (1:1) para shields fortes. HP > DEF > Magic DEF. Set Adamant +15 com craft de HP% e All Resist. Cristal de Shield Amp.',
    gearInicial: 'Set Titanium +9. Essencial HP alto desde cedo.',
    transcendencia: 'STR e INT igualmente até 200/200. Depois HP% puro.',
    guiaUpar: [
      'Nível 1-95: Quests. Impossível morrer.',
      'Nível 95-150: DGs como tank. Sempre tem party.',
      'Nível 150+: Indispensável. Entre em qualquer grupo.'
    ]
  },
  FB: {
    code: 'FB',
    name: 'Espadachim Arcano',
    englishName: 'Force Blader',
    icon: Sparkles,
    color: '#E74C3C',
    description: 'A fusão perfeita de espada e magia. O Espadachim Arcano domina o campo de batalha alternando entre combos físicos letais e explosões mágicas devastadoras.',
    battleModes: [
      {
        mode: 1,
        name: 'Modo Assassino',
        description: 'Critical DMG +40%. Burst físico extremo.',
        when: 'Ganks, eliminar targets prioritários, 1v1 PvP.'
      },
      {
        mode: 2,
        name: 'Modo Espectral',
        description: 'Evasion +25%, Move Speed +20%. Impossível de pegar.',
        when: 'TG (hit-and-run), kiting, escape de gangue inimiga.'
      },
      {
        mode: 3,
        name: 'Modo Devastador',
        description: 'Magic + Physical +30%. Híbrido definitivo.',
        when: 'DGs, boss fights, maximizar versatilidade.'
      }
    ],
    rotation: 'Teleport → Back Stab → Blade Aura → Soul Blade → Chain Rush → Magic Missile',
    combos: [
      'Teleport behind → Back Stab (crit) → Soul Blade instant kill',
      'Blade Aura (buff) → Magic burst combo → Dash out',
      'CC chain: Freeze → Blade combo → Teleport → Magic finish'
    ],
    skillTags: ['DPS', 'Burst', 'Híbrido', 'Alto Skill Cap'],
    metaBuild2025: 'INT/DEX para burst mágico rápido + crit físico. Maximize Critical Damage e Penetration (ambos tipos). Set Mystic +15 com Sword Skill Amp + Magic Amp.',
    gearInicial: 'Set Shadowsteel +9. Caro mas essencial para hybrid scaling.',
    transcendencia: 'INT até 200 primeiro (magic burst). Depois DEX até 150. Terceiro: Critical Damage.',
    guiaUpar: [
      'Nível 1-95: Difícil no começo. Precisão nos combos.',
      'Nível 95-150: Party DGs. Pratique timing de teleport.',
      'Nível 150+: Dominante. One-shot combo funciona.'
    ]
  },
  FG: {
    code: 'FG',
    name: 'Atirador Arcano',
    englishName: 'Force Gunner',
    icon: Target,
    color: '#F39C12',
    description: 'Artilharia mágica pesada. O Atirador Arcano combina tecnologia arcana com poder de fogo massivo, eliminando grupos inteiros de inimigos à distância segura.',
    battleModes: [
      {
        mode: 1,
        name: 'Modo Canhão',
        description: 'AoE Range +40%. Artillery sniper.',
        when: 'PvE farming, clear de mobs, siege em TG.'
      },
      {
        mode: 2,
        name: 'Modo Destruição',
        description: 'Single Target DMG +45%. Boss killer.',
        when: 'Boss fights, matar tanks inimigos, high-priority targets.'
      },
      {
        mode: 3,
        name: 'Modo Arsenal',
        description: 'Cooldown -25%, Ammo infinita. DPS sustentado infinito.',
        when: 'Raids longos, DGs hard, qualquer fight >5min.'
      }
    ],
    rotation: 'Launcher → Cannon Ball → Astral Beam → Land Demolisher → Mine Deploy',
    combos: [
      'Land Demolisher (slow field) → Cannon Ball barrage',
      'Mine Deploy → kite inimigos pra minas → Astral finish',
      'Boss: Modo Destruição → Full cooldowns → swap Canhão'
    ],
    skillTags: ['DPS', 'AoE', 'Range', 'Artillery'],
    metaBuild2025: 'Full INT com DEX secundário (3:1). Magic Amp > AoE ATK > Cooldown. Set Mystic +15 com craft de Skill Amp. Arma: Cannon +15 com INT slots.',
    gearInicial: 'Set Arcane +9. Range é sobrevivência.',
    transcendencia: 'INT até 300. DEX até 100. Terceiro: Magic Amp ou Cooldown Reduction.',
    guiaUpar: [
      'Nível 1-50: Fácil. AoE tudo.',
      'Nível 50-120: Artillery god. Sempre tem party pra você.',
      'Nível 120+: Essential em qualquer raid. Máximo DPS.'
    ]
  }
};

export default function ClasseDetalhe() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const classCode = urlParams.get('code');
  
  const classData = classesFullData[classCode];

  if (!classData) {
    navigate(createPageUrl('Wiki'));
    return null;
  }

  const Icon = classData.icon;

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
              <div className="flex items-start gap-6">
                <div 
                  className="w-24 h-24 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${classData.color}20` }}
                >
                  <Icon className="w-12 h-12" style={{ color: classData.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-black text-white">{classData.name}</h1>
                    <span 
                      className="px-4 py-1 rounded-full text-sm font-black"
                      style={{ 
                        backgroundColor: `${classData.color}30`,
                        color: classData.color
                      }}
                    >
                      {classData.code}
                    </span>
                  </div>
                  <p className="text-[#A9B2C7] text-lg mb-4">{classData.englishName}</p>
                  <p className="text-white leading-relaxed">{classData.description}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {classData.skillTags.map(tag => (
                  <span 
                    key={tag}
                    className="px-4 py-2 bg-[#0C121C] border border-[#19E0FF]/30 rounded-lg text-sm text-[#19E0FF] font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </CrystalBorder>
        </motion.div>

        {/* Battle Modes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#19E0FF]" />
            Modos de Batalha
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {classData.battleModes.map(mode => (
              <CrystalBorder key={mode.mode} tier="Bronze Crystal">
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[#19E0FF] font-black text-lg">BM{mode.mode}</span>
                    <span className="text-white font-bold">{mode.name}</span>
                  </div>
                  <p className="text-[#A9B2C7] text-sm mb-3">{mode.description}</p>
                  <div className="pt-3 border-t border-[#19E0FF]/10">
                    <p className="text-xs text-[#A9B2C7]"><strong className="text-white">Quando usar:</strong> {mode.when}</p>
                  </div>
                </div>
              </CrystalBorder>
            ))}
          </div>
        </motion.div>

        {/* Rotation & Combos */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CrystalBorder tier="Silver Crystal">
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#F7CE46]" />
                  Rotação Base
                </h3>
                <div className="p-4 bg-[#0C121C] rounded-lg border border-[#F7CE46]/20">
                  <code className="text-[#F7CE46] text-sm font-mono block">
                    {classData.rotation}
                  </code>
                </div>
              </div>
            </CrystalBorder>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CrystalBorder tier="Silver Crystal">
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Swords className="w-5 h-5 text-[#FF4B6A]" />
                  Combos Avançados
                </h3>
                <ul className="space-y-2">
                  {classData.combos.map((combo, i) => (
                    <li key={i} className="text-[#A9B2C7] text-sm flex items-start gap-2">
                      <span className="text-[#FF4B6A] font-bold mt-0.5">→</span>
                      {combo}
                    </li>
                  ))}
                </ul>
              </div>
            </CrystalBorder>
          </motion.div>
        </div>

        {/* Meta Build 2025 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <CrystalBorder tier="Legendary Arch-Crystal" showLabel>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <Star className="w-6 h-6 text-[#FFD700]" />
                Build Meta 2025
              </h2>
              <div className="p-5 bg-gradient-to-r from-[#FFD700]/10 to-transparent rounded-lg border-l-4 border-[#FFD700]">
                <p className="text-white leading-relaxed">{classData.metaBuild2025}</p>
              </div>
            </div>
          </CrystalBorder>
        </motion.div>

        {/* Gear & Transcendence */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <CrystalBorder tier="Obsidian Crystal">
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#9146FF]" />
                  Gear Inicial Recomendado
                </h3>
                <p className="text-[#A9B2C7]">{classData.gearInicial}</p>
              </div>
            </CrystalBorder>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <CrystalBorder tier="Obsidian Crystal">
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#10B981]" />
                  Transcendência
                </h3>
                <p className="text-[#A9B2C7]">{classData.transcendencia}</p>
              </div>
            </CrystalBorder>
          </motion.div>
        </div>

        {/* Leveling Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <CrystalBorder tier="Bronze Crystal">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-[#19E0FF]" />
                Como Upar Rápido
              </h2>
              <div className="space-y-3">
                {classData.guiaUpar.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#19E0FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#19E0FF] text-xs font-bold">{i + 1}</span>
                    </div>
                    <p className="text-[#A9B2C7]">{step}</p>
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