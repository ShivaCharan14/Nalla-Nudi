// SM-2 Spaced Repetition Algorithm — adapted for AsyncStorage.
// Each term gets: ease_factor, interval_days, next_due timestamp, streak.
// "Mastered" = streak >= 3.
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nalla_nudi_review_v1';

export type Rating = 'hard' | 'okay' | 'easy';

export interface ReviewState {
  ease: number;        // ease factor (default 2.5)
  interval: number;    // days
  nextDue: number;     // epoch ms
  streak: number;      // consecutive non-hard ratings
  lastRated: number;   // epoch ms
}

export interface ReviewMap { [termId: number]: ReviewState }

const ONE_DAY = 86400000;

function defaultState(): ReviewState {
  return { ease: 2.5, interval: 0, nextDue: Date.now(), streak: 0, lastRated: 0 };
}

/** SM-2 update: returns the new state for a term given a rating. */
export function applyRating(prev: ReviewState | undefined, rating: Rating): ReviewState {
  const s = prev ?? defaultState();
  // Quality: hard=2, okay=4, easy=5 (SM-2 0-5 scale; <3 is failure)
  const q = rating === 'hard' ? 2 : rating === 'okay' ? 4 : 5;
  let ease = s.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ease < 1.3) ease = 1.3;

  let interval: number;
  let streak = s.streak;
  if (q < 3) {
    interval = 1;       // failure: review again tomorrow
    streak = 0;
  } else {
    streak += 1;
    if (s.interval === 0) interval = 1;
    else if (s.interval === 1) interval = rating === 'easy' ? 4 : 3;
    else interval = Math.round(s.interval * ease);
  }

  return {
    ease,
    interval,
    nextDue: Date.now() + interval * ONE_DAY,
    streak,
    lastRated: Date.now(),
  };
}

export async function loadReviews(): Promise<ReviewMap> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : {};
}

async function saveReviews(map: ReviewMap) {
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}

export async function rateTerm(termId: number, rating: Rating): Promise<ReviewMap> {
  const map = await loadReviews();
  map[termId] = applyRating(map[termId], rating);
  await saveReviews(map);
  return map;
}

export async function dueTermIds(): Promise<number[]> {
  const map = await loadReviews();
  const now = Date.now();
  return Object.entries(map)
    .filter(([, v]) => v.nextDue <= now)
    .sort((a, b) => a[1].nextDue - b[1].nextDue)
    .map(([k]) => Number(k));
}

export interface ProgressSnapshot {
  total: number;
  mastered: number;       // streak >= 3
  learning: number;       // 0 < streak < 3
  due: number;            // nextDue <= now
  byCategory: Record<string, { total: number; mastered: number }>;
}

/** Build a progress snapshot. Caller passes total counts per category. */
export async function buildProgress(
  total: number,
  perCategory: Record<string, number>,
  termCategoryById: Record<number, string>
): Promise<ProgressSnapshot> {
  const map = await loadReviews();
  const now = Date.now();
  let mastered = 0, learning = 0, due = 0;
  const byCategory: Record<string, { total: number; mastered: number }> = {};
  for (const [cat, t] of Object.entries(perCategory)) {
    byCategory[cat] = { total: t, mastered: 0 };
  }
  for (const [idStr, v] of Object.entries(map)) {
    const id = Number(idStr);
    if (v.streak >= 3) {
      mastered++;
      const cat = termCategoryById[id];
      if (cat && byCategory[cat]) byCategory[cat].mastered++;
    } else if (v.streak > 0) {
      learning++;
    }
    if (v.nextDue <= now) due++;
  }
  return { total, mastered, learning, due, byCategory };
}

export function useDueCount() {
  const [count, setCount] = useState(0);
  const refresh = useCallback(async () => {
    const ids = await dueTermIds();
    setCount(ids.length);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { count, refresh };
}
