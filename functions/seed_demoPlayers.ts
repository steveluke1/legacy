import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const prefixes = ['Dark', 'Shadow', 'Iron', 'Storm', 'Blade', 'Mystic', 'Fire', 'Ice', 'Thunder', 'Luna', 'Solar', 'Nova', 'Phantom', 'Dragon', 'Wolf', 'Hawk', 'Knight', 'Demon', 'Angel', 'Crystal'];
const suffixes = ['Slayer', 'Mage', 'Guard', 'Archer', 'Runner', 'Master', 'Lord', 'King', 'Queen', 'Blade', 'Force', 'Hunter', 'Warrior', 'Champion', 'Hero', 'Legend', 'Killer', 'Pro', 'Elite', 'Prime'];
const classes = ['WA', 'BL', 'WI', 'FA', 'FS', 'FB', 'FG'];

function generateName() {
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const num = Math.random() > 0.7 ? Math.floor(Math.random() * 999) : '';
  return `${prefix}${suffix}${num}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { count = 1000, batchSize = 100 } = await req.json();

    // Get guilds for assignment
    const guilds = await base44.asServiceRole.entities.Guild.filter({ is_demo: true });
    const guildNames = guilds.map(g => g.name);

    // Check existing
    const existing = await base44.asServiceRole.entities.CharacterProfile.filter({ is_demo: true });
    if (existing.length >= count) {
      return Response.json({
        success: true,
        message: `${existing.length} personagens demo já existem`,
        created: 0
      });
    }

    const usedNames = new Set(existing.map(p => p.character_name));
    let totalCreated = 0;
    const batches = Math.ceil(count / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const charactersToCreate = [];
      
      for (let i = 0; i < batchSize && totalCreated < count; i++) {
        let name;
        let attempts = 0;
        do {
          name = generateName();
          attempts++;
        } while (usedNames.has(name) && attempts < 50);
        
        if (usedNames.has(name)) continue;
        usedNames.add(name);

        const classCode = classes[Math.floor(Math.random() * classes.length)];
        const level = Math.floor(Math.random() * 81) + 120; // 120-200
        const basepower = Math.floor(Math.random() * 2500000) + 500000; // 500k-3M
        const attack = Math.floor(basepower * (0.55 + Math.random() * 0.05));
        const defense = Math.floor(basepower * (0.43 + Math.random() * 0.05));
        const guildName = Math.random() > 0.2 && guildNames.length > 0 
          ? guildNames[Math.floor(Math.random() * guildNames.length)]
          : '';

        charactersToCreate.push({
          character_id: `demo_${name.toLowerCase()}`,
          character_name: name,
          class_code: classCode,
          level: level,
          guild_name: guildName,
          nation: Math.random() > 0.5 ? 'Capella' : 'Procyon',
          battle_power: basepower.toString(),
          honor_level: Math.floor(Math.random() * 20) + 1,
          general_stats: [],
          is_demo: true
        });

        totalCreated++;
      }

      if (charactersToCreate.length > 0) {
        await base44.asServiceRole.entities.CharacterProfile.bulkCreate(charactersToCreate);
      }
    }

    return Response.json({
      success: true,
      created: totalCreated,
      message: `Criados ${totalCreated} personagens demo`
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});