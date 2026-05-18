// Recent searches & weak-words tracker. Persisted via AsyncStorage. Pure offline.
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_KEY = 'nalla_nudi_recent_v1';
const WRONG_KEY = 'nalla_nudi_wrong_v1';
const MAX_RECENT = 10;

// ---- Recent searches: list of term IDs in MRU order ----
export function useRecentSearches() {
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(RECENT_KEY);
      if (raw) setIds(JSON.parse(raw));
    })();
  }, []);

  const touch = useCallback(async (id: number) => {
    const cur = ids.filter((x) => x !== id);
    cur.unshift(id);
    const next = cur.slice(0, MAX_RECENT);
    setIds(next);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
  }, [ids]);

  const clear = useCallback(async () => {
    setIds([]);
    await AsyncStorage.removeItem(RECENT_KEY);
  }, []);

  return { ids, touch, clear };
}

// ---- Wrong-answer tracker: { id: wrongCount, lastWrongAt } ----
interface WrongMap { [id: number]: { count: number; at: number } }

export async function recordWrong(id: number) {
  const raw = await AsyncStorage.getItem(WRONG_KEY);
  const map: WrongMap = raw ? JSON.parse(raw) : {};
  const existing = map[id] || { count: 0, at: 0 };
  map[id] = { count: existing.count + 1, at: Date.now() };
  await AsyncStorage.setItem(WRONG_KEY, JSON.stringify(map));
}

export async function recordCorrect(id: number) {
  const raw = await AsyncStorage.getItem(WRONG_KEY);
  if (!raw) return;
  const map: WrongMap = JSON.parse(raw);
  if (map[id]) {
    map[id].count = Math.max(0, map[id].count - 1);
    if (map[id].count === 0) delete map[id];
  }
  await AsyncStorage.setItem(WRONG_KEY, JSON.stringify(map));
}

/** Returns IDs of words the user got wrong recently (within last 14 days). */
export async function getWeakWordIds(): Promise<number[]> {
  const raw = await AsyncStorage.getItem(WRONG_KEY);
  if (!raw) return [];
  const map: WrongMap = JSON.parse(raw);
  const cutoff = Date.now() - 14 * 86400000;
  return Object.entries(map)
    .filter(([, v]) => v.count > 0 && v.at >= cutoff)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([k]) => Number(k));
}
