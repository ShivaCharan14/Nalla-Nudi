// Dashboard: Streak + Word of the Day + Quick Actions + Search + Filters + List
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Bookmark, Layers, Volume2, Flame, GraduationCap, Clock, X, TrendingUp, AlarmClock, Sparkles } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

import { colors, radius, spacing, shadow } from '../src/theme';
import { useGlossary, useLang } from '../src/store/useGlossary';
import { useStreak } from '../src/store/useStreak';
import { useRecentSearches } from '../src/store/useRecent';
import { useDueCount } from '../src/store/useReview';
import { suggest } from '../src/utils/search';
import { findByWord, insertGenerated } from '../src/data/database';
import FilterChips from '../src/components/FilterChips';
import TermCard from '../src/components/TermCard';
import { t } from '../src/i18n/strings';
import { GlossaryTerm } from '../src/data/seed';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

export default function Dashboard() {
  const router = useRouter();
  const [lang, setLang] = useLang();
  const { state, query, setQuery, category, setCategory, wordOfTheDay, bookmark } = useGlossary();
  const { count: streak } = useStreak();
  const { count: dueCount } = useDueCount();
  const { ids: recentIds, touch, clear } = useRecentSearches();
  const [focused, setFocused] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Pool of all known terms — derived from current state when Success, else just WoD as fallback
  const allTerms: GlossaryTerm[] = state.kind === 'Success' ? state.items : (wordOfTheDay ? [wordOfTheDay] : []);
  const suggestions = useMemo(
    () => (query.trim().length >= 2 ? suggest(query, allTerms, 5) : []),
    [query, allTerms]
  );
  const recentTerms: GlossaryTerm[] = useMemo(
    () => recentIds.map((id) => allTerms.find((x) => x.id === id)).filter(Boolean) as GlossaryTerm[],
    [recentIds, allTerms]
  );

  // Show "Generate with AI" row when query has 3+ chars and no DB matches
  const showAiGenerate = query.trim().length >= 3 && state.kind === 'Empty' && !generating;

  const generateWithAi = async () => {
    const word = query.trim();
    if (!word || generating) return;
    setGenerating(true);
    Keyboard.dismiss();
    try {
      const existing = await findByWord(word);
      if (existing) {
        touch(existing.id);
        router.push({ pathname: '/word/[id]', params: { id: String(existing.id) } });
        return;
      }
      const res = await fetch(`${BACKEND_URL}/api/generate_word`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, subject_category: category !== 'All' ? category : undefined }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const newId = await insertGenerated({
        eng_word: data.eng_word,
        kn_meaning: data.kn_meaning,
        english_meaning: data.english_explanation,
        kannada_explanation: data.kannada_explanation,
        phonetic_kn: data.phonetic_kn,
        subject_category: data.subject_category,
        difficulty: 'Intermediate',
      });
      touch(newId);
      setQuery('');
      router.push({ pathname: '/word/[id]', params: { id: String(newId) } });
    } catch (e: any) {
      Alert.alert('AI generation failed', e?.message ?? 'Please try again with internet connection.');
    } finally {
      setGenerating(false);
    }
  };

  const openTerm = (term: GlossaryTerm) => {
    touch(term.id);
    router.push({ pathname: '/word/[id]', params: { id: String(term.id) } });
  };

  const speakWod = () => {
    if (!wordOfTheDay) return;
    Speech.stop();
    Speech.speak(wordOfTheDay.eng_word, { language: 'en-IN', rate: 0.95 });
    setTimeout(() => Speech.speak(wordOfTheDay.kn_meaning, { language: 'kn-IN', rate: 0.85 }), 900);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']} testID="dashboard-screen">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flex: 1 }}>
            <FlatList
              data={state.kind === 'Success' ? state.items : []}
              keyExtractor={(it) => String(it.id)}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                <View>
                  {/* Header row */}
                  <View style={styles.header}>
                    <View style={styles.brandRow}>
                      <View style={styles.brandIcon}>
                        <GraduationCap size={20} color={colors.textInverse} strokeWidth={2.4} />
                      </View>
                      <View>
                        <Text style={styles.greeting}>{t(lang, 'dashboard_greeting')}</Text>
                        <Text style={styles.appTitle}>
                          {lang === 'kn' ? 'ನಲ್ಲ-ನುಡಿ' : 'Nalla-Nudi'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.headerRight}>
                      {streak > 0 && (
                        <View style={styles.streakChip} testID="streak-chip">
                          <Flame size={14} color={colors.error} strokeWidth={2.4} fill={colors.error} />
                          <Text style={styles.streakText}>{streak}</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        testID="lang-toggle-btn"
                        style={styles.langBtn}
                        onPress={() => setLang(lang === 'en' ? 'kn' : 'en')}
                      >
                        <Text style={styles.langText}>{lang === 'en' ? 'ಕ' : 'EN'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID="bookmarks-nav-btn"
                        style={styles.langBtn}
                        onPress={() => router.push('/bookmarks')}
                      >
                        <Bookmark size={18} color={colors.primary} strokeWidth={2.2} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Word of the Day — solid blue, no warm image */}
                  {wordOfTheDay && (
                    <Animated.View entering={FadeIn.duration(500)} style={styles.wod}>
                      <View style={[styles.wodBlob, { top: -40, right: -30 }]} />
                      <View style={[styles.wodBlob, { bottom: -50, left: -20, width: 140, height: 140, opacity: 0.18 }]} />
                      <View style={styles.wodContent}>
                        <Text style={styles.wodLabel}>{t(lang, 'word_of_the_day')}</Text>
                        <Text style={styles.wodEng} testID="wod-eng">{wordOfTheDay.eng_word}</Text>
                        <Text style={styles.wodKn} testID="wod-kn">{wordOfTheDay.kn_meaning}</Text>
                        {wordOfTheDay.example ? (
                          <Text style={styles.wodExample} numberOfLines={2}>“{wordOfTheDay.example}”</Text>
                        ) : null}
                        <View style={styles.wodFooter}>
                          <View style={styles.wodCat}>
                            <Text style={styles.wodCatText}>{wordOfTheDay.subject_category}</Text>
                          </View>
                          <TouchableOpacity
                            testID="wod-listen-btn"
                            style={styles.wodSpeaker}
                            onPress={speakWod}
                          >
                            <Volume2 size={20} color={colors.primary} strokeWidth={2.4} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Animated.View>
                  )}

                  {/* Due Today banner — only shown when SM-2 has scheduled reviews */}
                  {dueCount > 0 && (
                    <Animated.View entering={FadeIn.duration(400)}>
                      <TouchableOpacity
                        testID="due-today-banner"
                        style={styles.dueBanner}
                        onPress={() => router.push({ pathname: '/flashcards', params: { mode: 'due' } })}
                        activeOpacity={0.85}
                      >
                        <View style={styles.dueIconWrap}>
                          <AlarmClock size={20} color={colors.warning} strokeWidth={2.4} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.dueTitle}>{dueCount} word{dueCount > 1 ? 's' : ''} due for review</Text>
                          <Text style={styles.dueSub}>Tap to start spaced-repetition session</Text>
                        </View>
                        <Text style={styles.dueArrow}>›</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  )}

                  {/* Quick actions: Flashcards · Quiz · Progress · My List */}
                  <View style={styles.quickRow}>
                    <TouchableOpacity
                      testID="open-flashcards-btn"
                      style={[styles.quickBtn, { backgroundColor: colors.primary }]}
                      onPress={() => router.push('/flashcards')}
                      activeOpacity={0.85}
                    >
                      <Layers size={18} color={colors.textInverse} strokeWidth={2.2} />
                      <Text style={[styles.quickText, { color: colors.textInverse }]}>{t(lang, 'flashcards')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID="open-quiz-btn"
                      style={[styles.quickBtn, { backgroundColor: colors.success }]}
                      onPress={() => router.push('/quiz')}
                      activeOpacity={0.85}
                    >
                      <GraduationCap size={18} color={colors.textInverse} strokeWidth={2.2} />
                      <Text style={[styles.quickText, { color: colors.textInverse }]}>Quiz</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID="open-progress-btn"
                      style={[styles.quickBtn, styles.quickBtnOutline]}
                      onPress={() => router.push('/progress')}
                      activeOpacity={0.85}
                    >
                      <TrendingUp size={18} color={colors.primary} strokeWidth={2.2} />
                      <Text style={[styles.quickText, { color: colors.primary }]}>Progress</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Search */}
                  <View style={styles.searchWrap}>
                    <Search size={20} color={colors.textSecondary} strokeWidth={2.2} />
                    <TextInput
                      testID="search-input"
                      style={styles.searchInput}
                      placeholder={t(lang, 'search_placeholder')}
                      placeholderTextColor={colors.textSecondary}
                      value={query}
                      onChangeText={setQuery}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setTimeout(() => setFocused(false), 150)}
                      autoCorrect={false}
                      autoCapitalize="none"
                    />
                    {query.length > 0 && (
                      <TouchableOpacity onPress={() => setQuery('')} testID="clear-search-btn">
                        <X size={18} color={colors.textSecondary} strokeWidth={2.2} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Autocomplete suggestions */}
                  {suggestions.length > 0 && query.trim().length >= 2 && (
                    <View style={styles.suggestBox} testID="autocomplete-list">
                      {suggestions.map((s) => (
                        <TouchableOpacity
                          key={s.id}
                          testID={`suggestion-${s.id}`}
                          style={styles.suggestRow}
                          onPress={() => { openTerm(s); Keyboard.dismiss(); }}
                          activeOpacity={0.7}
                        >
                          <Search size={14} color={colors.textSecondary} />
                          <Text style={styles.suggestEng}>{s.eng_word}</Text>
                          <Text style={styles.suggestKn} numberOfLines={1}>{s.kn_meaning}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* AI Generate row — when no DB matches at all */}
                  {showAiGenerate && (
                    <TouchableOpacity
                      testID="ai-generate-btn"
                      style={styles.aiGenerateRow}
                      onPress={generateWithAi}
                      activeOpacity={0.85}
                    >
                      <View style={styles.aiSparkleWrap}>
                        <Sparkles size={18} color={colors.warning} strokeWidth={2.4} fill={colors.warning} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.aiTitle}>Generate "{query.trim()}" with AI</Text>
                        <Text style={styles.aiSub}>Add to your glossary instantly</Text>
                      </View>
                      <Text style={styles.aiArrow}>›</Text>
                    </TouchableOpacity>
                  )}

                  {/* Generating spinner */}
                  {generating && (
                    <View style={styles.aiLoading} testID="ai-loading">
                      <ActivityIndicator color={colors.warning} />
                      <Text style={styles.aiLoadingText}>Generating bilingual entry…</Text>
                    </View>
                  )}

                  {/* Recent searches when query is empty */}
                  {query.trim().length === 0 && recentTerms.length > 0 && (
                    <View style={styles.recentWrap} testID="recent-searches">
                      <View style={styles.recentHeader}>
                        <Clock size={14} color={colors.textSecondary} strokeWidth={2.2} />
                        <Text style={styles.recentLabel}>RECENT</Text>
                        <TouchableOpacity onPress={clear} testID="clear-recent-btn">
                          <Text style={styles.recentClear}>Clear</Text>
                        </TouchableOpacity>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                        {recentTerms.map((r) => (
                          <TouchableOpacity
                            key={r.id}
                            testID={`recent-chip-${r.id}`}
                            style={styles.recentChip}
                            onPress={() => setQuery(r.eng_word)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.recentChipText}>{r.eng_word}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  <FilterChips value={category} onChange={setCategory} lang={lang} />

                  <View style={styles.resultsHeader}>
                    <Text style={styles.resultsTitle}>{t(lang, 'results')}</Text>
                    {state.kind === 'Success' && (
                      <Text style={styles.resultsCount}>{state.items.length}</Text>
                    )}
                  </View>
                </View>
              }
              renderItem={({ item, index }) => (
                <Animated.View entering={FadeInDown.delay(index * 40).duration(350)} style={{ marginBottom: spacing.sm }}>
                  <TermCard
                    term={item}
                    onBookmark={() => { bookmark(item.id, (item as any).is_saved === 1); touch(item.id); }}
                    onPress={() => openTerm(item)}
                  />
                </Animated.View>
              )}
              ListEmptyComponent={
                <View style={styles.empty} testID="empty-state">
                  {state.kind === 'Loading' ? (
                    <>
                      <ActivityIndicator color={colors.primary} />
                      <Text style={styles.emptyTitle}>{t(lang, 'loading')}</Text>
                    </>
                  ) : state.kind === 'Error' ? (
                    <>
                      <Text style={styles.emptyTitle}>Error</Text>
                      <Text style={styles.emptySub}>{state.message}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.emptyTitle}>{t(lang, 'empty_title')}</Text>
                      <Text style={styles.emptySub}>{t(lang, 'empty_sub')}</Text>
                    </>
                  )}
                </View>
              }
            />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  listContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.lg, marginTop: spacing.sm,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandIcon: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  greeting: { color: colors.textSecondary, fontSize: 12, letterSpacing: 0.5 },
  appTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  streakChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: radius.pill, borderWidth: 1, borderColor: '#FFCDD2',
  },
  streakText: { color: colors.error, fontWeight: '800', fontSize: 13 },
  langBtn: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  langText: { fontSize: 14, color: colors.primary, fontWeight: '800' },

  // Word of the day — solid blue card
  wod: {
    minHeight: 220, borderRadius: radius.xxl, overflow: 'hidden',
    backgroundColor: colors.primary, ...shadow.hero,
  },
  wodBlob: {
    position: 'absolute', width: 180, height: 180, borderRadius: 999,
    backgroundColor: colors.primaryLight, opacity: 0.35,
  },
  wodContent: { padding: spacing.lg, flex: 1, justifyContent: 'flex-end' },
  wodLabel: {
    color: '#BBDEFB', fontSize: 11, fontWeight: '800',
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: spacing.sm,
  },
  wodEng: { color: colors.textInverse, fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  wodKn: { color: '#FFEB3B', fontSize: 26, fontWeight: '700', marginTop: 4, lineHeight: 36 },
  wodExample: { color: '#ffffffcc', fontSize: 13, marginTop: spacing.sm, fontStyle: 'italic', lineHeight: 18 },
  wodFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  wodCat: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: '#ffffff22' },
  wodCatText: { color: colors.textInverse, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  wodSpeaker: {
    width: 44, height: 44, borderRadius: radius.pill,
    backgroundColor: colors.textInverse, alignItems: 'center', justifyContent: 'center',
  },

  quickRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  quickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: spacing.md, borderRadius: radius.lg,
  },
  quickBtnOutline: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  quickText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },

  searchWrap: {
    marginTop: spacing.lg,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: 4, ...shadow.card,
  },
  searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: 15, color: colors.textPrimary, paddingVertical: 12 },

  resultsHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: spacing.md, marginBottom: spacing.sm },
  resultsTitle: { fontSize: 13, color: colors.textSecondary, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  resultsCount: { fontSize: 14, color: colors.primary, fontWeight: '800' },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { fontSize: 16, color: colors.textPrimary, fontWeight: '700' },
  emptySub: { fontSize: 13, color: colors.textSecondary },

  // Autocomplete suggestions box
  suggestBox: {
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    marginTop: spacing.sm, overflow: 'hidden', ...shadow.card,
  },
  suggestRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  suggestEng: { fontSize: 15, color: colors.textPrimary, fontWeight: '700', flex: 1 },
  suggestKn: { fontSize: 13, color: colors.primary, fontWeight: '600', maxWidth: '40%' },

  // Recent
  recentWrap: { marginTop: spacing.md },
  recentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  recentLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '700', letterSpacing: 1, flex: 1 },
  recentClear: { fontSize: 12, color: colors.error, fontWeight: '700' },
  recentChip: {
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: radius.pill, backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border,
  },
  recentChipText: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
});
