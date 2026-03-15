import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get current week start/end
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const periodStart = startOfWeek.toISOString().split('T')[0];
    const periodEnd = endOfWeek.toISOString().split('T')[0];

    // Delete previous records
    const existing = await base44.asServiceRole.entities.WeeklyTGKillRanking.filter({});
    for (const record of existing) {
      await base44.asServiceRole.entities.WeeklyTGKillRanking.delete(record.id);
    }

    // Create 10 fictitious players
    const players = [
      { name: "DarkReaper487", guild: "Shadow Legion", kills: 387 },
      { name: "BloodKnight923", guild: "Crimson Empire", kills: 341 },
      { name: "DeathBringer756", guild: "Eternal Darkness", kills: 318 },
      { name: "WarMachine442", guild: "Iron Fist", kills: 292 },
      { name: "NightStalker871", guild: "Void Walkers", kills: 267 },
      { name: "SoulReaper334", guild: "Phantom Knights", kills: 243 },
      { name: "ThunderStrike665", guild: "Storm Riders", kills: 219 },
      { name: "ChaosHunter198", guild: "Dark Alliance", kills: 187 },
      { name: "FrostBlade529", guild: "Ice Warriors", kills: 154 },
      { name: "ShadowAssassin812", guild: "Silent Death", kills: 128 }
    ];

    const nations = ["Capella", "Procyon"];
    const records = [];

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const record = await base44.asServiceRole.entities.WeeklyTGKillRanking.create({
        character_name: player.name,
        guild_name: player.guild,
        nation: nations[Math.floor(Math.random() * nations.length)],
        kills: player.kills,
        position: i + 1,
        reference_period_start: periodStart,
        reference_period_end: periodEnd
      });
      records.push(record);
    }

    return Response.json({
      success: true,
      message: `Created ${records.length} weekly kill ranking records`,
      period: { start: periodStart, end: periodEnd },
      records: records.length
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});