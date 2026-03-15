import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get demo characters
    const characters = await base44.asServiceRole.entities.CharacterProfile.filter(
      {},
      undefined,
      300
    );

    if (characters.length === 0) {
      return Response.json({
        success: false,
        error: 'Nenhum personagem demo. Execute seed_demoPlayers primeiro.'
      });
    }

    // Check existing
    const existing = await base44.asServiceRole.entities.DGCompletion.filter({ is_demo: true });
    if (existing.length > 1000) {
      return Response.json({
        success: true,
        message: `${existing.length} DG completions demo já existem`,
        created: existing.length
      });
    }

    // Generate DG completions for this week
    const dungeonCodes = ['FT_B2F', 'AOS_B1F', 'LC_B3F', 'POD_B1F', 'ICRH_HARD'];
    const dgCompletions = [];
    
    // Top player: 300-400 DGs this week
    const topRunner = characters[0];
    for (let i = 0; i < 350; i++) {
      const hoursAgo = Math.floor(Math.random() * 168); // Last 7 days
      dgCompletions.push({
        player_name: topRunner.character_name,
        guild_name: topRunner.guild_name || '',
        dungeon_code: dungeonCodes[Math.floor(Math.random() * dungeonCodes.length)],
        completed_at: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
        is_demo: true
      });
    }

    // Other top players: 50-200 DGs
    for (let p = 1; p < 50; p++) {
      const player = characters[p];
      const dgCount = Math.floor(Math.random() * 150) + 50;
      
      for (let i = 0; i < dgCount; i++) {
        const hoursAgo = Math.floor(Math.random() * 168);
        dgCompletions.push({
          player_name: player.character_name,
          guild_name: player.guild_name || '',
          dungeon_code: dungeonCodes[Math.floor(Math.random() * dungeonCodes.length)],
          completed_at: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
          is_demo: true
        });
      }
    }

    // Random players: 1-50 DGs
    for (let p = 50; p < 200; p++) {
      const player = characters[p];
      const dgCount = Math.floor(Math.random() * 50) + 1;
      
      for (let i = 0; i < dgCount; i++) {
        const hoursAgo = Math.floor(Math.random() * 168);
        dgCompletions.push({
          player_name: player.character_name,
          guild_name: player.guild_name || '',
          dungeon_code: dungeonCodes[Math.floor(Math.random() * dungeonCodes.length)],
          completed_at: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
          is_demo: true
        });
      }
    }

    // Batch create with smaller batches and delays
    const batchSize = 100;
    let created = 0;
    for (let i = 0; i < dgCompletions.length && i < 2000; i += batchSize) {
      const batch = dgCompletions.slice(i, i + batchSize);
      await base44.asServiceRole.entities.DGCompletion.bulkCreate(batch);
      created += batch.length;
      // Small delay between batches
      if (i + batchSize < dgCompletions.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return Response.json({
      success: true,
      created: created,
      message: `Criadas ${created} conclusões de DG demo`
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});