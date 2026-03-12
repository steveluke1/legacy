import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({
        success: false,
        error: 'Apenas administradores podem executar esta função.'
      }, { status: 403 });
    }

    const { count = 500 } = await req.json();

    // Check if already seeded
    const existing = await base44.asServiceRole.entities.CharacterProfile.list(null, 10);
    if (existing.length >= 100) {
      return Response.json({
        success: true,
        message: 'Dados massivos já existem no sistema',
        profiles_count: existing.length
      });
    }

    const classes = ['WA', 'BL', 'WI', 'FA', 'FS', 'FB', 'FG'];
    const nations = ['Capella', 'Procyon'];
    
    const firstNames = ['Dark', 'Shadow', 'Blood', 'Night', 'Storm', 'Fire', 'Ice', 'Thunder', 'Light', 'Death', 'Soul', 'Dragon', 'Phoenix', 'Demon', 'Angel', 'Chaos', 'Nova', 'Star', 'Moon', 'Sun', 'Sky', 'Ocean', 'Flame', 'Frost', 'Wind', 'Earth', 'Steel', 'Silver', 'Gold', 'Crystal'];
    const lastNames = ['Slayer', 'Hunter', 'Killer', 'Master', 'Lord', 'Knight', 'Warrior', 'Mage', 'Blade', 'Arrow', 'Shield', 'Sword', 'Axe', 'Hammer', 'Spear', 'Bow', 'Staff', 'Wand', 'Reaper', 'Walker', 'Rider', 'Guard', 'Keeper', 'Breaker', 'Bringer', 'Seeker', 'Taker', 'Maker', 'Bearer'];

    // Create 120 guilds first
    const guildNames = ['Apocalypse', 'Phoenix', 'Legends', 'Elite', 'Warriors', 'Dragons', 'Titans', 'Champions', 'Knights', 'Guardians', 'Shadow', 'Storm', 'Fire', 'Ice', 'Light', 'Dark', 'Blood', 'Soul', 'Death', 'Chaos', 'Nova', 'Nebula', 'Galaxy', 'Cosmos', 'Astral', 'Celestial', 'Divine', 'Eternal', 'Immortal', 'Supreme'];
    
    const guilds = [];
    for (let i = 0; i < Math.min(30, count / 15); i++) {
      const guildName = i < guildNames.length ? guildNames[i] : `Guild ${i + 1}`;
      const faction = nations[Math.floor(Math.random() * nations.length)];
      
      const guild = await base44.asServiceRole.entities.Guild.create({
        name: guildName,
        slug: guildName.toLowerCase().replace(/\s+/g, '-'),
        faction: faction,
        member_count: Math.floor(Math.random() * 50) + 10,
        season_points: Math.floor(Math.random() * 50000) + 10000,
        total_points: Math.floor(Math.random() * 100000) + 50000,
        recruiting: Math.random() > 0.5,
        description: `Uma das guildas mais poderosas de ${faction}`,
        wins: Math.floor(Math.random() * 100) + 20,
        losses: Math.floor(Math.random() * 50) + 5
      });
      
      guilds.push(guild);
    }

    // Create character profiles in batches to avoid rate limits
    const profiles = [];
    const batchSize = 10;
    
    for (let batch = 0; batch < Math.ceil(count / batchSize); batch++) {
      const batchProfiles = [];
      const batchRankings = [];
      
      for (let i = batch * batchSize; i < Math.min((batch + 1) * batchSize, count); i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const characterName = `${firstName}${lastName}${Math.random() > 0.7 ? Math.floor(Math.random() * 999) : ''}`;
        
        const classCode = classes[i % classes.length];
        const level = Math.floor(Math.random() * 80) + 120;
        const nation = nations[Math.floor(Math.random() * nations.length)];
        const guildName = guilds.length > 0 ? guilds[Math.floor(Math.random() * guilds.length)].name : null;
        
        const basePower = level * 10000;
        const powerScore = Math.floor(basePower + Math.random() * basePower * 2);
        const honorLevel = Math.floor(Math.random() * 20) + 1;
        
        batchProfiles.push({
          character_id: `char_${i}_${Date.now()}_${Math.random()}`,
          character_name: characterName,
          class_code: classCode,
          level: level,
          guild_name: guildName,
          nation: nation,
          battle_power: `${(powerScore / 1000000).toFixed(2)}M`,
          honor_level: honorLevel,
          general_stats: [],
          runes: {},
          stellar_link: {},
          collection: {},
          merit: {},
          medal_of_honor: {},
          arcane_wing: {},
          mythic: {},
          achievements: {},
          mercenaries: {},
          crafting: {},
          info_tab: {
            character_name: characterName,
            class: classCode,
            level: level,
            guild: guildName,
            nation: nation
          },
          activities_tab: {
            last_login: new Date().toISOString(),
            total_playtime: Math.floor(Math.random() * 1000) + 100
          }
        });

        batchRankings.push({
          user_id: `char_${i}_${Date.now()}_${Math.random()}`,
          username: characterName,
          class_code: classCode,
          guild_name: guildName,
          type: 'POWER',
          position: i + 1,
          value: powerScore
        });
      }

      // Bulk create profiles and rankings
      const createdProfiles = await base44.asServiceRole.entities.CharacterProfile.bulkCreate(batchProfiles);
      profiles.push(...createdProfiles);

      const createdRankings = await base44.asServiceRole.entities.RankingEntry.bulkCreate(batchRankings);

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return Response.json({
      success: true,
      message: `${profiles.length} perfis de personagem criados com sucesso`,
      guilds_created: guilds.length,
      profiles_created: profiles.length
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});