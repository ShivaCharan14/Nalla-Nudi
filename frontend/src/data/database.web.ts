// WEB implementation: in-memory fallback for the Word Details screen too.
import { SEED_GLOSSARY, GlossaryTerm, Category } from './seed';

const mem: { rows: GlossaryTerm[]; seeded: boolean; nextId: number } = {
  rows: [], seeded: false, nextId: 100,
};

function seed() {
  if (!mem.seeded) {
    mem.rows = SEED_GLOSSARY.map((t) => ({ ...t, is_saved: 0 as any }));
    mem.seeded = true;
  }
}

export async function initDatabase(): Promise<void> { seed(); }

export async function searchTerms(query: string, category: Category | 'All'): Promise<GlossaryTerm[]> {
  seed();
  const n = query.trim().toLowerCase();
  return mem.rows
    .filter((t) => t.eng_word.toLowerCase().includes(n))
    .filter((t) => category === 'All' || t.subject_category === category)
    .sort((a, b) => a.eng_word.localeCompare(b.eng_word))
    .slice(0, 100);
}

export async function getAllTerms(): Promise<GlossaryTerm[]> { seed(); return [...mem.rows]; }

export async function getTermById(id: number): Promise<GlossaryTerm | null> {
  seed();
  return mem.rows.find((t) => t.id === id) ?? null;
}

export async function findByWord(word: string): Promise<GlossaryTerm | null> {
  seed();
  const w = word.trim().toLowerCase();
  return mem.rows.find((t) => t.eng_word.toLowerCase() === w) ?? null;
}

export async function insertGenerated(t: Omit<GlossaryTerm, 'id'>): Promise<number> {
  seed();
  const id = ++mem.nextId;
  mem.rows.push({ ...(t as any), id, is_saved: 0 });
  return id;
}

export async function toggleBookmark(id: number, isSaved: boolean): Promise<void> {
  seed();
  mem.rows = mem.rows.map((t) => (t.id === id ? { ...t, is_saved: isSaved ? 1 : 0 } as any : t));
}

export async function getBookmarks(): Promise<GlossaryTerm[]> {
  seed();
  return mem.rows.filter((t) => (t as any).is_saved === 1);
}

export async function getWordOfTheDay(): Promise<GlossaryTerm | null> {
  seed();
  if (mem.rows.length === 0) return null;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return mem.rows[dayOfYear % mem.rows.length];
}
