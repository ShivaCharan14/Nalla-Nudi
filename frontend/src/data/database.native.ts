// NATIVE implementation: offline-first SQLite (Room-equivalent).
import * as SQLite from 'expo-sqlite';
import { SEED_GLOSSARY, GlossaryTerm, Category } from './seed';

let dbInstance: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) dbInstance = await SQLite.openDatabaseAsync('nalla_nudi_v3.db');
  return dbInstance;
}

export async function initDatabase(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS glossary (
      id INTEGER PRIMARY KEY NOT NULL,
      eng_word TEXT NOT NULL,
      kn_meaning TEXT NOT NULL,
      english_meaning TEXT,
      kannada_explanation TEXT,
      phonetic_kn TEXT,
      subject_category TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'Beginner',
      example TEXT,
      is_saved INTEGER NOT NULL DEFAULT 0,
      ai_generated INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_eng_word ON glossary(eng_word);
    CREATE INDEX IF NOT EXISTS idx_category ON glossary(subject_category);
  `);
  const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM glossary');
  if (!row || row.c === 0) {
    for (const t of SEED_GLOSSARY) {
      await db.runAsync(
        'INSERT INTO glossary (id, eng_word, kn_meaning, english_meaning, kannada_explanation, phonetic_kn, subject_category, difficulty, example, is_saved, ai_generated) VALUES (?,?,?,?,?,?,?,?,?,0,0)',
        [t.id, t.eng_word, t.kn_meaning, t.english_meaning, t.kannada_explanation, t.phonetic_kn ?? null, t.subject_category, t.difficulty, t.example ?? null]
      );
    }
  }
}

export async function searchTerms(query: string, category: Category | 'All'): Promise<GlossaryTerm[]> {
  const db = await getDb();
  const q = `%${query.trim()}%`;
  let sql = 'SELECT * FROM glossary WHERE eng_word LIKE ?';
  const args: (string | number)[] = [q];
  if (category !== 'All') { sql += ' AND subject_category = ?'; args.push(category); }
  sql += ' ORDER BY eng_word COLLATE NOCASE LIMIT 100';
  return db.getAllAsync<GlossaryTerm>(sql, args);
}

export async function getAllTerms(): Promise<GlossaryTerm[]> {
  const db = await getDb();
  return db.getAllAsync<GlossaryTerm>('SELECT * FROM glossary ORDER BY eng_word COLLATE NOCASE');
}

export async function getTermById(id: number): Promise<GlossaryTerm | null> {
  const db = await getDb();
  return (await db.getFirstAsync<GlossaryTerm>('SELECT * FROM glossary WHERE id = ?', [id])) ?? null;
}

export async function findByWord(word: string): Promise<GlossaryTerm | null> {
  const db = await getDb();
  return (await db.getFirstAsync<GlossaryTerm>('SELECT * FROM glossary WHERE LOWER(eng_word) = LOWER(?)', [word])) ?? null;
}

export async function insertGenerated(t: Omit<GlossaryTerm, 'id'>): Promise<number> {
  const db = await getDb();
  const r = await db.getFirstAsync<{ m: number }>('SELECT COALESCE(MAX(id), 0) as m FROM glossary');
  const id = (r?.m ?? 0) + 1;
  await db.runAsync(
    'INSERT INTO glossary (id, eng_word, kn_meaning, english_meaning, kannada_explanation, phonetic_kn, subject_category, difficulty, example, is_saved, ai_generated) VALUES (?,?,?,?,?,?,?,?,?,0,1)',
    [id, t.eng_word, t.kn_meaning, t.english_meaning, t.kannada_explanation, t.phonetic_kn ?? null, t.subject_category, t.difficulty ?? 'Intermediate', t.example ?? null]
  );
  return id;
}

export async function toggleBookmark(id: number, isSaved: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE glossary SET is_saved = ? WHERE id = ?', [isSaved ? 1 : 0, id]);
}

export async function getBookmarks(): Promise<GlossaryTerm[]> {
  const db = await getDb();
  return db.getAllAsync<GlossaryTerm>('SELECT * FROM glossary WHERE is_saved = 1 ORDER BY eng_word COLLATE NOCASE');
}

export async function getWordOfTheDay(): Promise<GlossaryTerm | null> {
  const db = await getDb();
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const countRow = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM glossary');
  if (!countRow || countRow.c === 0) return null;
  const offset = dayOfYear % countRow.c;
  return (await db.getFirstAsync<GlossaryTerm>('SELECT * FROM glossary ORDER BY id LIMIT 1 OFFSET ?', [offset])) ?? null;
}
