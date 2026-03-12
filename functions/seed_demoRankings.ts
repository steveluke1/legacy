import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get demo characters
    const characters = await base44.asServiceRole.entities.CharacterProfile.filter(
      {},
      undefined,
      1000
    );

    if (characters.length === 0) {
      return Response.json({
        success: false,
        error: 'Nenhum personagem demo encontrado. Execute seed_demoPlayers primeiro.'
      });
    }

    // POWER Ranking (limit to 300 for performance)
    const powerRanking = characters
      .slice(0, 300)
      .map(char => ({
        ...char,
        powerValue: parseInt(char.battle_power) || 500000
      }))
      .sort((a, b) => b.powerValue - a.powerValue)
      .map((char, idx) => ({
        user_id: char.character_id,
        username: char.character_name,
        guild_name: char.guild_name || '',
        class_code: char.class_code,
        type: 'POWER',
        position: idx + 1,
        value: char.powerValue,
        attack: Math.floor(char.powerValue * (0.55 + Math.random() * 0.05)),
        defense: Math.floor(char.powerValue * (0.43 + Math.random() * 0.05)),
        is_demo: true
      }));

    // TG Ranking (limit to 150 for performance)
    const tgRanking = characters
      .sort(() => Math.random() - 0.5)
      .slice(0, 150)
      .map((char, idx) => ({
        user_id: char.character_id,
        username: char.character_name,
        guild_name: char.guild_name || '',
        class_code: char.class_code,
        type: 'TG',
        position: idx + 1,
        value: Math.floor(Math.random() * 800) + 100,
        is_demo: true
      }))
      .sort((a, b) => b.value - a.value)
      .map((entry, idx) => ({ ...entry, position: idx + 1 }));

    // Batch insert with smaller batches to avoid timeout
    const batchSize = 50;
    let createdPower = 0;
    let createdTG = 0;
    
    for (let i = 0; i < powerRanking.length; i += batchSize) {
      const batch = powerRanking.slice(i, i + batchSize);
      await base44.asServiceRole.entities.RankingEntry.bulkCreate(batch);
      createdPower += batch.length;
    }
    
    for (let i = 0; i < tgRanking.length; i += batchSize) {
      const batch = tgRanking.slice(i, i + batchSize);
      await base44.asServiceRole.entities.RankingEntry.bulkCreate(batch);
      createdTG += batch.length;
    }

    return Response.json({
      success: true,
      created: {
        power: createdPower,
        tg: createdTG
      },
      message: 'Rankings demo criados com sucesso'
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});