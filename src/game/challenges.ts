import { DailyChallenge } from '../types';

const STORAGE_KEY = 'beads12_daily_challenges_v1';
const PROFILE_KEY = 'beads12_player_profile_v1';

export interface PlayerProfile {
  name: string;
  rating: number;
  xp: number;
  level: number;
  wins: number;
  losses: number;
  streak: number;
  totalCaptures: number;
  gamesPlayed: number;
  title: string;
}

export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getDefaultChallenges(): DailyChallenge[] {
  return [
    {
      id: 'c1',
      title: 'First Blood',
      description: 'Capture at least 1 bead in any match',
      target: 1,
      current: 0,
      completed: false,
      rewardXP: 100,
      claimed: false,
    },
    {
      id: 'c2',
      title: 'Bead Hunter',
      description: 'Capture 5 opponent beads across all games today',
      target: 5,
      current: 0,
      completed: false,
      rewardXP: 250,
      claimed: false,
    },
    {
      id: 'c3',
      title: 'Chain Reaction',
      description: 'Execute a double jump or chain capture in one turn',
      target: 1,
      current: 0,
      completed: false,
      rewardXP: 300,
      claimed: false,
    },
    {
      id: 'c4',
      title: 'Master Tactician',
      description: 'Win a match against Normal or Hard Computer',
      target: 1,
      current: 0,
      completed: false,
      rewardXP: 400,
      claimed: false,
    },
    {
      id: 'c5',
      title: 'Arena Contender',
      description: 'Play a multiplayer match with a friend or online opponent',
      target: 1,
      current: 0,
      completed: false,
      rewardXP: 350,
      claimed: false,
    },
  ];
}

export function loadDailyChallenges(): { date: string; challenges: DailyChallenge[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const today = getTodayDateString();
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today && Array.isArray(parsed.challenges)) {
        return parsed;
      }
    }
    const fresh = { date: today, challenges: getDefaultChallenges() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  } catch {
    return { date: getTodayDateString(), challenges: getDefaultChallenges() };
  }
}

export function saveDailyChallenges(challenges: DailyChallenge[]): void {
  try {
    const today = getTodayDateString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, challenges }));
  } catch {}
}

export function loadPlayerProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  const defaultProfile: PlayerProfile = {
    name: 'Hasnat Champion',
    rating: 1200,
    xp: 0,
    level: 1,
    wins: 0,
    losses: 0,
    streak: 0,
    totalCaptures: 0,
    gamesPlayed: 0,
    title: 'Goti Novice',
  };
  savePlayerProfile(defaultProfile);
  return defaultProfile;
}

export function savePlayerProfile(profile: PlayerProfile): void {
  try {
    // Calculate level (increases every 1000 XP) and title
    const level = Math.floor(profile.xp / 1000) + 1;
    let title = 'Goti Novice';
    if (level >= 10 || profile.rating >= 1800) title = '12 Beads Grandmaster';
    else if (level >= 7 || profile.rating >= 1600) title = 'Master Tactician';
    else if (level >= 4 || profile.rating >= 1400) title = 'Bead Veteran';
    else if (level >= 2 || profile.rating >= 1250) title = 'Skilled Strategist';

    const updated = { ...profile, level, title };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  } catch {}
}

export function recordGameEvent(event: {
  type: 'capture' | 'chain_jump' | 'win_vs_ai' | 'multiplayer_played' | 'game_finish';
  capturesCount?: number;
  aiDifficulty?: string;
  isWin?: boolean;
}): { updatedChallenges: DailyChallenge[]; xpEarned: number } {
  const data = loadDailyChallenges();
  let changed = false;

  for (const c of data.challenges) {
    if (c.completed) continue;

    if (event.type === 'capture' && c.id === 'c1') {
      c.current = Math.min(c.target, c.current + (event.capturesCount || 1));
      if (c.current >= c.target) c.completed = true;
      changed = true;
    } else if (event.type === 'capture' && c.id === 'c2') {
      c.current = Math.min(c.target, c.current + (event.capturesCount || 1));
      if (c.current >= c.target) c.completed = true;
      changed = true;
    } else if (event.type === 'chain_jump' && c.id === 'c3') {
      c.current = 1;
      c.completed = true;
      changed = true;
    } else if (event.type === 'win_vs_ai' && c.id === 'c4') {
      if (event.aiDifficulty === 'normal' || event.aiDifficulty === 'hard') {
        c.current = 1;
        c.completed = true;
        changed = true;
      }
    } else if (event.type === 'multiplayer_played' && c.id === 'c5') {
      c.current = 1;
      c.completed = true;
      changed = true;
    }
  }

  if (changed) {
    saveDailyChallenges(data.challenges);
  }

  // Update profile
  const profile = loadPlayerProfile();
  let xpEarned = 0;
  if (event.type === 'capture') {
    profile.totalCaptures += event.capturesCount || 1;
  }
  if (event.type === 'game_finish') {
    profile.gamesPlayed += 1;
    if (event.isWin) {
      profile.wins += 1;
      profile.streak += 1;
      profile.rating += 25;
      xpEarned = 500; // 500 XP on win
      profile.xp += 500;
    } else if (event.isWin === false) {
      profile.losses += 1;
      profile.streak = 0;
      profile.rating = Math.max(800, profile.rating - 15);
      xpEarned = 100; // 100 XP on loss
      profile.xp += 100;
    } else {
      // Draw
      xpEarned = 150;
      profile.xp += 150;
    }
  }
  savePlayerProfile(profile);

  return { updatedChallenges: data.challenges, xpEarned };
}
