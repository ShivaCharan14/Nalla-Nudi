// Lightweight global store - RN equivalent of ViewModel + StateFlow.
import { useEffect, useState, useCallback, useRef } from 'react';
import { Category, GlossaryTerm } from '../data/seed';
import { initDatabase, searchTerms, getBookmarks, toggleBookmark, getWordOfTheDay } from '../data/database';
import { Lang } from '../i18n/strings';

export type SearchUiState =
  | { kind: 'Loading' }
  | { kind: 'Success'; items: GlossaryTerm[] }
  | { kind: 'Empty' }
  | { kind: 'Error'; message: string };

export function useGlossary() {
  const [state, setState] = useState<SearchUiState>({ kind: 'Loading' });
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [wordOfTheDay, setWordOfTheDay] = useState<GlossaryTerm | null>(null);
  const [ready, setReady] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Init DB once
  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        const wod = await getWordOfTheDay();
        setWordOfTheDay(wod);
        setReady(true);
      } catch (e: any) {
        setState({ kind: 'Error', message: e?.message ?? 'DB init failed' });
      }
    })();
  }, []);

  // Debounced search whenever query/category change
  useEffect(() => {
    if (!ready) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setState({ kind: 'Loading' });
    debounceRef.current = setTimeout(async () => {
      try {
        const items = await searchTerms(query, category);
        setState(items.length === 0 ? { kind: 'Empty' } : { kind: 'Success', items });
      } catch (e: any) {
        setState({ kind: 'Error', message: e?.message ?? 'Search failed' });
      }
    }, 120);
  }, [query, category, ready]);

  const bookmark = useCallback(async (id: number, current: boolean) => {
    await toggleBookmark(id, !current);
    if (state.kind === 'Success') {
      setState({
        kind: 'Success',
        items: state.items.map((it) => (it.id === id ? { ...it, is_saved: !current ? 1 : 0 } as any : it)),
      });
    }
  }, [state]);

  return { state, query, setQuery, category, setCategory, wordOfTheDay, bookmark, ready };
}

export function useBookmarks() {
  const [items, setItems] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await initDatabase();
      const rows = await getBookmarks();
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { items, loading, refresh };
}

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>('en');
  return [lang, setLang];
}
