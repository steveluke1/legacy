import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get top ranking entries
    const powerRanking = await base44.asServiceRole.entities.RankingEntry.filter(
      { type: 'POWER' },
      '-value',
      5
    );

    if (powerRanking.length === 0) {
      return Response.json({
        success: false,
        error: 'Nenhuma entrada de ranking encontrada'
      }, { status: 404 });
    }

    const profiles = [];

    for (const entry of powerRanking) {
      // Check if profile already exists
      const existing = await base44.asServiceRole.entities.CharacterProfile.filter({
        character_id: entry.id
      });

      if (existing.length > 0) continue;

      // Create comprehensive profile
      const profile = await base44.asServiceRole.entities.CharacterProfile.create({
        character_id: entry.id,
        character_name: entry.username,
        class_code: entry.class_code,
        level: 200,
        guild_name: entry.guild_name,
        nation: Math.random() > 0.5 ? 'Capella' : 'Procyon',
        battle_power: '2.021M',
        honor_level: 28,
        
        // 40+ General Stats
        general_stats: [
          { label: 'Ataque PvE', value: '1.246M' },
          { label: 'Defesa PvE', value: '890k' },
          { label: 'Ataque PvP', value: '775k' },
          { label: 'Defesa PvP', value: '650k' },
          { label: 'Grau Mítico', value: '25.947', subtitle: '(+5.000)' },
          { label: 'Asa', value: 'Épico Nv. 400' },
          { label: 'Mérito', value: '800.568 / 800.568' },
          { label: 'Medalha', value: 'Lenda Nv. 10' },
          { label: 'Conquista', value: '17.109' },
          { label: 'HP', value: '45.890' },
          { label: 'MP', value: '12.340' },
          { label: 'Dano Crítico', value: '78%' },
          { label: 'Taxa Crítica', value: '45%' },
          { label: 'Perfuração', value: '+340' },
          { label: 'Evasão', value: '+180' },
          { label: 'Bloqueio', value: '+220' },
          { label: 'Resistência', value: '35%' },
          { label: 'FOR', value: '250' },
          { label: 'DES', value: '280' },
          { label: 'INT', value: '150' },
          { label: 'Ataque', value: '12.500' },
          { label: 'Magia', value: '8.900' },
          { label: 'Defesa', value: '7.800' },
          { label: 'Sword Skill', value: '820' },
          { label: 'Magic Skill', value: '650' },
          { label: 'AXP', value: '45.890' },
          { label: 'WEXP', value: '89.234' },
          { label: 'Resistência PvE', value: '28%' },
          { label: 'Resistência PvP', value: '32%' },
          { label: 'Amplificação', value: '18%' },
          { label: 'Redução de Dano', value: '22%' },
          { label: 'Ignore Defesa', value: '+145' },
          { label: 'HP Recuperação', value: '+340/s' },
          { label: 'MP Recuperação', value: '+180/s' },
          { label: 'Velocidade Ataque', value: '+25%' },
          { label: 'Velocidade Movimento', value: '+15%' },
          { label: 'Resist. Stun', value: '12%' },
          { label: 'Resist. Down', value: '10%' },
          { label: 'Acurácia', value: '+180' },
          { label: 'Pet EXP Bonus', value: '+500%' },
          { label: 'Drop Rate', value: '+70%' }
        ],

        // Runes
        runes: {
          essencia: [
            { name: 'DES', level: 10, effect: 'DES +10' },
            { name: 'FOR', level: 10, effect: 'FOR +10' },
            { name: 'INT', level: 10, effect: 'INT +10' },
            { name: 'HP', level: 20, effect: 'HP +200' }
          ],
          ataque: [
            { name: 'Ataque', level: 30, effect: 'Ataque +30' },
            { name: 'Danos Críticos II', level: 7, effect: 'Danos Críticos 7%' },
            { name: 'Perfuração II', level: 9, effect: 'Perfuração +45' },
            { name: 'Ignorar Perfuração', level: 10, effect: 'Ignorar Perfuração +80' }
          ],
          defesa: [
            { name: 'Defesa II', level: 8, effect: 'Defesa +40' },
            { name: 'Evasão', level: 15, effect: 'Evasão +30' },
            { name: 'HP III', level: 30, effect: 'HP +500' }
          ],
          supremo: [
            { name: 'Dança da Espada I', level: 1, effect: 'Técnica de Espada Amp. 10%' },
            { name: 'Aumento de Max Taxa Crítica', level: 10, effect: 'Max Taxa Crítica 3%' }
          ],
          karma: [
            { name: 'PVE Todos os Ataques', level: 2, effect: 'PVE Todos os Ataques +6' },
            { name: 'PVP Defesa', level: 3, effect: 'PVP Defesa +9' }
          ]
        },

        // Stellar Link
        stellar_link: {
          print_effect: [
            'Danos Críticos 60%',
            'Perfuração +122',
            'Aumentou todos os ataques +320',
            'PVE Dano Crítico 42%',
            'PVE Perfuração +60'
          ],
          lines: [
            { line_index: 1, slots: ['PVE Perfuração +15', 'PVE Perfuração +15', 'PVE Perfuração +15'] },
            { line_index: 2, slots: ['PVE Dano Crítico 7%', 'PVE Dano Crítico 7%'] },
            { line_index: 3, slots: ['Aumentou todos os ataques +40', 'Aumentou todos os ataques +40'] },
            { line_index: 4, slots: ['Perfuração +15', 'Perfuração +8'] },
            { line_index: 5, slots: ['Danos Críticos 4%', 'Danos Críticos 7%'] }
          ]
        },

        // Collection
        collection: {
          tabs: ['Calabouço', 'Mundo', 'Especial', 'Extra'],
          items: [
            { category: 'Calabouço', name: 'Lago do Crepúsculo I', completion: '100%', bonus: 'HP +60' },
            { category: 'Calabouço', name: 'Lago do Crepúsculo II', completion: '100%', bonus: 'MP +40' },
            { category: 'Calabouço', name: 'Estação Ruína I', completion: '100%', bonus: 'Ataque +20' },
            { category: 'Calabouço', name: 'Estação Ruína II', completion: '100%', bonus: 'Defesa +25' },
            { category: 'Calabouço', name: 'Torre Gélida dos Mortos 1SS I', completion: '100%', bonus: 'INT +15' },
            { category: 'Mundo', name: 'Deserto do Esquecimento', completion: '85%', bonus: 'FOR +10' },
            { category: 'Mundo', name: 'Ruínas Antigas', completion: '92%', bonus: 'DES +12' },
            { category: 'Especial', name: 'Evento de Verão 2024', completion: '100%', bonus: 'EXP +5%' },
            { category: 'Extra', name: 'Coleção Secreta Alpha', completion: '60%', bonus: 'Todos Atributos +5' }
          ]
        },

        // Merit
        merit: {
          insignias: ['Insígnia Dourada', 'Insígnia Platina', 'Insígnia Diamante'],
          status_labels: ['Resolução Inabalável', 'Ataque Fatal', 'Espírito Indomável', 'Julgamento Poderoso'],
          merit_points: '800.568 / 800.568',
          domains: {
            slots: [
              { label: 'Dano Adicional PvE Expandido I', duration: '52D 03H 39M 24S', progress_label: 'slot3/5' },
              { label: 'Resistência PvP Expandido', duration: '28D 12H 15M 08S', progress_label: 'slot7/10' }
            ]
          }
        },

        // Medal of Honor
        medal_of_honor: {
          title: 'Lenda da Medalha da Tempestade (100%)',
          level_label: 'Lv. 10',
          sections: [
            { name: 'Capitão', slots: [{ label: 'slot 10/10' }] },
            { name: 'General', slots: [{ label: 'slot 3/3' }] },
            { name: 'Comandante', slots: [{ label: 'slot 4/4' }] },
            { name: 'Herói', slots: [{ label: 'slot 5/5' }] },
            { name: 'Lenda', slots: [{ label: 'slot 2/2' }] }
          ],
          effects: [
            'Danos Críticos 40%',
            'FOR +40',
            'DES +50',
            'Perfuração +150',
            'Aumentou todos os ataques +100',
            'Aumentou todas as técnicas Amp. 30%',
            'Ignorar Resistência a Danos Críticos 15%'
          ]
        },

        // Arcane Wing
        arcane_wing: {
          grade_label: 'Épico',
          level_label: '400',
          stats: [
            'HP +400',
            'Aumentou todos os ataques +400',
            'Defesa +400'
          ],
          force_wing_info: ['Force Wing Character', 'Force Wing Buff']
        },

        // Mythic
        mythic: {
          myth_level: '91 / 100',
          resurrection_points: '324',
          myth_points: '7.853 / 10.000',
          grade_score: '20.947 (+0)',
          short_name: 'Rafael',
          entries: [
            'PVP Cancelar Ignorar Redução de Dano +8',
            'PVE Canc. Ig. Red Dano +12',
            'Resistência ao Dano Crítico 3%',
            'Aum. Dano Ataque Norm. 5%',
            'PVE Ignorar Redução de Dano +8',
            'PVE Evasão +35',
            'Aum. Dano Ataque Norm. 8%',
            'PVP Ignorar Bloqueio +18',
            'HP +50',
            'PVE Bloqueio +84',
            'PVE Dano Crítico 3%',
            'PVP Dano de Ataque Normal UP 5%',
            'Resistência ao Dano Crítico 2%',
            'PVE Perfuração +25',
            'PVP Redução de Dano 2%',
            'PVE Dano de Ataque Normal UP 4%',
            'MP +30',
            'PVE Resistência ao Dano Crítico 2%',
            'PVP Perfuração +15',
            'Defesa +40'
          ]
        },

        // Achievements
        achievements: {
          summary: 'Tudo (318/696)',
          total_points: '17.109',
          categories: [
            { name: 'Normal', progress: '(89/105)' },
            { name: 'Missões', progress: '(20/28)' },
            { name: 'Calabouço', progress: '(70/170)' },
            { name: 'Itens', progress: '(66/109)' },
            { name: 'PVP', progress: '(1/32)' },
            { name: 'Batalha', progress: '(23/55)' },
            { name: 'Caçando', progress: '(10/104)' },
            { name: 'Criação', progress: '(20/22)' },
            { name: 'Conquistas Compartilhadas', progress: '(19/43)' },
            { name: 'Especial', progress: '(0/2)' }
          ],
          achievements_list: [
            { title: 'Level 50', description: 'Alcançar o Lv.50', completed: true, reward_points: 5, reward_type: 'Título' },
            { title: 'Level 100', description: 'Alcançar o Lv.100', completed: true, reward_points: 10, reward_type: 'Título' },
            { title: 'Level 150', description: 'Alcançar o Lv.150', completed: true, reward_points: 15, reward_type: 'Título' },
            { title: 'Level 200', description: 'Alcançar o Lv.200', completed: true, reward_points: 25, reward_type: 'Título' },
            { title: 'Primeira DG Solo', description: 'Complete uma dungeon sozinho', completed: true, reward_points: 8, reward_type: 'Pontos' },
            { title: 'Mestre da TG', description: 'Vença 100 Territory Wars', completed: false, reward_points: 50, reward_type: 'Título' },
            { title: 'Colecionador', description: 'Complete 50 coleções', completed: true, reward_points: 30, reward_type: 'Pontos' },
            { title: 'Mercenário Veterano', description: 'Recrute 20 mercenários', completed: true, reward_points: 12, reward_type: 'Pontos' }
          ]
        },

        // Mercenaries
        mercenaries: {
          subtabs: ['Contrato', 'Confiança', 'Deslumbramento', 'Transcendente'],
          contrato: [
            { name: 'Guerreiro Corrompido' },
            { name: 'Duelista Corrompido' },
            { name: 'Mago Corrompido' },
            { name: 'Arqueiro Arcano Corrompido' }
          ],
          confianca: [
            { name: 'Guardião Arcano Corrompido' },
            { name: 'Espadachim Arcano Corrompido' }
          ],
          deslumbramento: [
            { name: 'Cavaleiro das Sombras' },
            { name: 'Mago Ancestral' }
          ],
          transcendente: [
            { name: 'Dragão Ancião' },
            { name: 'Fênix de Cristal' }
          ]
        },

        // Crafting
        crafting: {
          craft_master: 'Chloe',
          energy: '3600/3600',
          lines: [
            { name: 'Espada do Artesão', exp: '10000 / 10000' },
            { name: 'Amuleto', exp: '8500 / 10000' },
            { name: 'Anel', exp: '7200 / 10000' },
            { name: 'Sapatilha do Artesão (DU)', exp: '10000 / 10000' },
            { name: 'Sapatilha do Mestre (DU)', exp: '5400 / 10000' },
            { name: 'Máscara do Artesão (DU)', exp: '0 / 10000' },
            { name: 'Máscara do Mestre (DU)', exp: '0 / 10000' }
          ]
        },

        // Info Tab
        info_tab: {
          created_date: '15 de Janeiro de 2023',
          last_login: 'Há 2 horas',
          main_server: 'CABAL ZIRON - Canal Principal',
          description: 'Espadachim veterano focado em PvE e Territory Wars. Membro ativo da guild Royalty.'
        },

        // Activities Tab
        activities_tab: {
          recent_activities: [
            { type: 'dungeon', title: 'Completou Torre Gélida 2SS', description: 'Tempo recorde: 12m 34s', date: 'Há 3 horas' },
            { type: 'achievement', title: 'Nova conquista desbloqueada', description: 'Mestre das Dungeons', date: 'Há 5 horas' },
            { type: 'dungeon', title: 'Completou Lago do Crepúsculo II', description: 'Em party com 6 jogadores', date: 'Ontem' }
          ]
        }
      });

      profiles.push(profile);
    }

    return Response.json({
      success: true,
      message: `${profiles.length} perfis de personagem criados com sucesso`,
      profiles
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});