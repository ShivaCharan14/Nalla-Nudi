// Search utilities — prefix match + Levenshtein fuzzy fallback. Pure, no DB.
import { GlossaryTerm } from '../data/seed';

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

/** Returns ranked suggestions for autocomplete: prefix matches first, then fuzzy. */
export function suggest(query: string, all: GlossaryTerm[], limit = 6): GlossaryTerm[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const prefix = all.filter((t) => t.eng_word.toLowerCase().startsWith(q));
  const contains = all.filter((t) => !prefix.includes(t) && t.eng_word.toLowerCase().includes(q));
  let results = [...prefix, ...contains];
  if (results.length === 0) {
    // fuzzy fallback
    results = all
      .map((t) => ({ t, d: levenshtein(q, t.eng_word.toLowerCase()) }))
      .filter((x) => x.d <= 3)
      .sort((a, b) => a.d - b.d)
      .map((x) => x.t);
  }
  return results.slice(0, limit);
}
