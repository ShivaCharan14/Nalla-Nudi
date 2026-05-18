// Daily streak tracker (consecutive days of app use). Persisted via AsyncStorage.
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nalla_nudi_streak_v1';

interface StreakState { count: number; lastDate: string }

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function diffDays(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const da = new Date(ay, am - 1, ad).getTime();
  const db = new Date(by, bm - 1, bd).getTime();
  return Math.round((da - db) / 86400000);
}

export function useStreak() {
  const [count, setCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const today = todayKey();
      const raw = await AsyncStorage.getItem(KEY);
      let next: StreakState;
      if (!raw) {
        next = { count: 1, lastDate: today };
      } else {
        const prev: StreakState = JSON.parse(raw);
        const delta = diffDays(today, prev.lastDate);
        if (delta === 0) next = prev;            // same day, no change
        else if (delta === 1) next = { count: prev.count + 1, lastDate: today };
        else next = { count: 1, lastDate: today }; // gap, reset
      }
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
      setCount(next.count);
      setLoaded(true);
    })();
  }, []);

  const reset = useCallback(async () => {
    await AsyncStorage.removeItem(KEY);
    setCount(0);
  }, []);

  return { count, loaded, reset };
}
