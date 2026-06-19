import AsyncStorage from '@react-native-async-storage/async-storage';

const RULINGS_KEY = '@tcg_judge/offline_rulings';
const STANDINGS_KEY = '@tcg_judge/offline_standings';
const MAX_RULINGS = 50;

export type CachedRuling = {
  id: string;
  tcg: string;
  question: string;
  answer: string;
  cachedAt: string;
};

export type CachedStandings = {
  tournamentId: string;
  standings: unknown[];
  cachedAt: string;
};

export async function cacheRuling(ruling: Omit<CachedRuling, 'cachedAt'>): Promise<void> {
  const raw = await AsyncStorage.getItem(RULINGS_KEY);
  const list: CachedRuling[] = raw ? (JSON.parse(raw) as CachedRuling[]) : [];
  const next = [{ ...ruling, cachedAt: new Date().toISOString() }, ...list.filter((r) => r.id !== ruling.id)].slice(
    0,
    MAX_RULINGS,
  );
  await AsyncStorage.setItem(RULINGS_KEY, JSON.stringify(next));
}

export async function getCachedRulings(): Promise<CachedRuling[]> {
  const raw = await AsyncStorage.getItem(RULINGS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CachedRuling[];
  } catch {
    return [];
  }
}

export async function cacheStandings(tournamentId: string, standings: unknown[]): Promise<void> {
  const payload: CachedStandings = {
    tournamentId,
    standings,
    cachedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(STANDINGS_KEY, JSON.stringify(payload));
}

export async function getCachedStandings(tournamentId?: string): Promise<CachedStandings | null> {
  const raw = await AsyncStorage.getItem(STANDINGS_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as CachedStandings;
    if (tournamentId && data.tournamentId !== tournamentId) return null;
    return data;
  } catch {
    return null;
  }
}

export async function handleWebViewMessage(data: string): Promise<void> {
  try {
    const msg = JSON.parse(data) as { type?: string; payload?: Record<string, unknown> };
    if (msg.type === 'ruling' && msg.payload) {
      const p = msg.payload;
      if (typeof p.id === 'string' && typeof p.question === 'string' && typeof p.answer === 'string') {
        await cacheRuling({
          id: p.id,
          tcg: String(p.tcg ?? ''),
          question: p.question,
          answer: p.answer,
        });
      }
    }
    if (msg.type === 'standings' && msg.payload) {
      const tid = String(msg.payload.tournamentId ?? '');
      const standings = msg.payload.standings;
      if (tid && Array.isArray(standings)) {
        await cacheStandings(tid, standings);
      }
    }
  } catch {
    // ignore malformed bridge messages
  }
}
