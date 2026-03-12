import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const guildNames = [
  'Apocalypse', 'Phoenix', 'Legends', 'Elite', 'Warriors', 'Shadow Legion',
  'Royalty', 'Eclipse', 'Dragons of Nevareth', 'NightRaid', 'CrimsonFury',
  'Azure Knights', 'Golden Empire', 'Iron Wolves', 'Storm Chasers', 'Mystic Order',
  'Vanguard', 'Eternal Flame', 'Dark Brotherhood', 'Silver Hawks', 'Titanium',
  'Nova Legion', 'Blood Ravens', 'Crystal Guard', 'Thunder Strike', 'Soul Reapers',
  'Chaos Theory', 'Divine Blades', 'Inferno Squad', 'Phantom Legion', 'Radiant',
  'Steel Dragons', 'Void Walkers', 'Wind Riders', 'Zenith', 'Alpha Prime',
  'Brave Hearts', 'Celestial', 'Demon Slayers', 'Emerald Knights'
];

const descriptions = [
  'Guilda focada em TG competitiva e DGs de alto nível',
  'Uma das guildas mais ativas de Nevareth',
  'Comunidade amigável com foco em PvE',
  'Dominamos Territory Wars desde 2016',
  'Especialistas em farming e progressão rápida',
  'Guilda hardcore para jogadores dedicados',
  'Irmandade forjada nas batalhas mais intensas',
  'Buscamos sempre a excelência em todas atividades',
  'Guilda PvP com estratégias testadas em combate',
  'Veteranos e iniciantes são bem-vindos'
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { count = 40 } = await req.json();

    // Check existing guilds
    const existing = await base44.asServiceRole.entities.Guild.filter({ is_demo: true });
    if (existing.length >= count) {
      return Response.json({
        success: true,
        message: `${existing.length} guildas demo já existem`,
        created: 0
      });
    }

    const guildsToCreate = [];
    const usedNames = new Set(existing.map(g => g.name));

    for (let i = 0; i < count && guildsToCreate.length < count; i++) {
      const name = guildNames[i % guildNames.length];
      if (usedNames.has(name)) continue;
      usedNames.add(name);

      guildsToCreate.push({
        name: name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        leader_name: `Leader${Math.floor(Math.random() * 10000)}`,
        faction: Math.random() > 0.5 ? 'Capella' : 'Procyon',
        level: Math.floor(Math.random() * 12) + 1,
        member_count: Math.floor(Math.random() * 70) + 10,
        recruiting: Math.random() > 0.3,
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        is_demo: true
      });
    }

    await base44.asServiceRole.entities.Guild.bulkCreate(guildsToCreate);

    return Response.json({
      success: true,
      created: guildsToCreate.length,
      message: `Criadas ${guildsToCreate.length} guildas demo`
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});