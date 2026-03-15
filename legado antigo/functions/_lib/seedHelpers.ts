// Seeded PRNG for deterministic data generation
export class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }

  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  choice(array) {
    return array[Math.floor(this.next() * array.length)];
  }
  
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

// Fantasy/MMO guild names
export const GUILD_NAMES = [
  'Legends', 'Warriors', 'Knights', 'Dragons', 'Phoenix', 'Titans',
  'Empire', 'Dynasty', 'Brotherhood', 'Alliance', 'Legion', 'Order',
  'Clan', 'Society', 'Council', 'Syndicate', 'Cartel', 'Elite',
  'Guardians', 'Sentinels', 'Crusaders', 'Templars', 'Immortals', 'Invictus',
  'Shadow', 'Storm', 'Thunder', 'Lightning', 'Inferno', 'Blaze',
  'Frost', 'Ice', 'Crystal', 'Diamond', 'Steel', 'Iron',
  'Gold', 'Silver', 'Platinum', 'Royal', 'Imperial', 'Divine'
];

// Player name components
export const NAME_PREFIXES = [
  'Dark', 'Shadow', 'Light', 'Fire', 'Ice', 'Storm', 'Night', 'Blood', 
  'Soul', 'Death', 'Angel', 'Demon', 'Dragon', 'Wolf', 'Lion', 'Tiger',
  'Phantom', 'Ghost', 'Spirit', 'Chaos', 'Nova', 'Star', 'Moon', 'Sun',
  'Thunder', 'Lightning', 'Blade', 'Steel', 'Iron', 'Stone', 'Crystal',
  'Frost', 'Flame', 'Inferno', 'Blaze', 'Vortex', 'Apex', 'Prime',
  'Alpha', 'Omega', 'Elite', 'Master', 'Grand', 'Supreme', 'Ultimate'
];

export const NAME_SUFFIXES = [
  'Killer', 'Slayer', 'Hunter', 'Warrior', 'Knight', 'Master', 'Lord',
  'King', 'Queen', 'Prince', 'Princess', 'Legend', 'Hero', 'Champion',
  'Destroyer', 'Reaper', 'Blade', 'Shadow', 'Storm', 'Fury', 'Rage',
  'Phoenix', 'Dragon', 'Wolf', 'Tiger', 'Eagle', 'Hawk', 'Viper', 'Cobra',
  'Slasher', 'Striker', 'Crusher', 'Breaker', 'Bringer', 'Walker', 'Runner'
];

export const NATIONS = ['Capella', 'Procyon'];

export function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function generatePlayerName(rng) {
  return rng.choice(NAME_PREFIXES) + rng.choice(NAME_SUFFIXES);
}

export function generateTimestampInLast7Days(rng, now) {
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  const randomTime = sevenDaysAgo + (rng.next() * 7 * 24 * 60 * 60 * 1000);
  return new Date(randomTime).toISOString();
}

export async function batchCreate(base44, entityName, records, batchSize = 100) {
  const results = [];
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(record => base44.asServiceRole.entities[entityName].create(record))
    );
    results.push(...batchResults);
    
    // Small delay to avoid rate limits
    if (i + batchSize < records.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  return results;
}