// Quiz Mode — mode selector (Random / My List / Weak / Subject) + 10 MCQ runner.
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, X, RotateCw, Trophy, Shuffle, Bookmark, AlertTriangle, Atom, Calculator, Briefcase } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { colors, radius, spacing, shadow } from '../src/theme';
import { Category, GlossaryTerm } from '../src/data/seed';
import { initDatabase, getAllTerms, getBookmarks } from '../src/data/database';
import { getWeakWordIds, recordWrong, recordCorrect } from '../src/store/useRecent';

const TOTAL = 10;

type QuizMode =
  | { kind: 'random' }
  | { kind: 'bookmarks' }
  | { kind: 'weak' }
  | { kind: 'subject'; cat: Category };

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

interface Question { term: GlossaryTerm; options: string[]; answer: number; }

function buildQuestions(pool: GlossaryTerm[], all: GlossaryTerm[]): Question[] {
  const picked = shuffle(pool).slice(0, TOTAL);
  return picked.map((term) => {
    const distractors = shuffle(all.filter((t) => t.id !== term.id)).slice(0, 3).map((t) => t.kn_meaning);
    const options = shuffle([term.kn_meaning, ...distractors]);
    return { term, options, answer: options.indexOf(term.kn_meaning) };
  });
}

export default function QuizScreen() {
  const router = useRouter();

  // Mode selection state
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [allTerms, setAllTerms] = useState<GlossaryTerm[]>([]);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [weakCount, setWeakCount] = useState(0);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Active quiz state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [building, setBuilding] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Load metadata for selector once
  useEffect(() => {
    (async () => {
      await initDatabase();
      const all = await getAllTerms();
      setAllTerms(all);
      const bm = await getBookmarks();
      setBookmarkCount(bm.length);
      const weak = await getWeakWordIds();
      setWeakCount(weak.length);
      setLoadingMeta(false);
    })();
  }, []);

  const startQuiz = async (m: QuizMode) => {
    setBuilding(true);
    setErrMsg(null);
    let pool: GlossaryTerm[] = [];
    if (m.kind === 'random') pool = allTerms;
    else if (m.kind === 'bookmarks') pool = await getBookmarks();
    else if (m.kind === 'weak') {
      const ids = await getWeakWordIds();
      pool = allTerms.filter((t) => ids.includes(t.id));
    } else if (m.kind === 'subject') {
      pool = allTerms.filter((t) => t.subject_category === m.cat);
    }
    if (pool.length < 4) {
      setErrMsg('Not enough words for this mode. Need at least 4.');
      setBuilding(false);
      return;
    }
    setQuestions(buildQuestions(pool, allTerms));
    setMode(m); setIdx(0); setPicked(null); setScore(0); setDone(false);
    setBuilding(false);
  };

  const restart = () => mode && startQuiz(mode);
  const backToMenu = () => { setMode(null); setQuestions([]); setDone(false); setErrMsg(null); };

  const onPick = async (i: number) => {
    if (picked !== null) return;
    const q = questions[idx];
    const correct = i === q.answer;
    if (correct) { setScore((s) => s + 1); await recordCorrect(q.term.id); }
    else { await recordWrong(q.term.id); }
    setPicked(i);
    setTimeout(() => {
      if (idx + 1 >= questions.length) setDone(true);
      else { setIdx(idx + 1); setPicked(null); }
    }, 900);
  };

  if (loadingMeta) {
    return <SafeAreaView style={styles.safe}><ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} /></SafeAreaView>;
  }

  // ---- Mode selector ----
  if (!mode) {
    const sciCount = allTerms.filter((t) => t.subject_category === 'Science').length;
    const mathCount = allTerms.filter((t) => t.subject_category === 'Math').length;
    const comCount = allTerms.filter((t) => t.subject_category === 'Commerce').length;

    return (
      <SafeAreaView style={styles.safe} edges={['top']} testID="quiz-menu">
        <View style={styles.header}>
          <TouchableOpacity testID="quiz-back-btn" style={styles.iconBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.primary} strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={styles.title}>Quiz</Text>
          <View style={styles.iconBtn} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          <Text style={styles.menuLabel}>Choose your mode</Text>
          {errMsg && (
            <View style={styles.errBox} testID="quiz-error">
              <AlertTriangle size={16} color={colors.error} strokeWidth={2.4} />
              <Text style={styles.errText}>{errMsg}</Text>
            </View>
          )}

          <ModeCard
            testID="mode-random"
            icon={<Shuffle size={22} color={colors.primary} strokeWidth={2.4} />}
            title="Random 10"
            sub={`From all ${allTerms.length} terms`}
            onPress={() => startQuiz({ kind: 'random' })}
            tint={colors.primary}
          />
          <ModeCard
            testID="mode-bookmarks"
            icon={<Bookmark size={22} color={colors.error} strokeWidth={2.4} />}
            title="From My List"
            sub={bookmarkCount > 0 ? `${bookmarkCount} saved word${bookmarkCount > 1 ? 's' : ''}` : 'Bookmark some words first'}
            onPress={() => startQuiz({ kind: 'bookmarks' })}
            tint={colors.error}
            disabled={bookmarkCount < 4}
          />
          <ModeCard
            testID="mode-weak"
            icon={<AlertTriangle size={22} color={colors.warning} strokeWidth={2.4} />}
            title="Weak Words"
            sub={weakCount > 0 ? `${weakCount} word${weakCount > 1 ? 's' : ''} you got wrong recently` : 'Take a quiz first to find weak words'}
            onPress={() => startQuiz({ kind: 'weak' })}
            tint={colors.warning}
            disabled={weakCount < 4}
          />

          <Text style={[styles.menuLabel, { marginTop: spacing.lg }]}>By subject</Text>
          <ModeCard
            testID="mode-science"
            icon={<Atom size={22} color="#1565C0" strokeWidth={2.4} />}
            title="Science"
            sub={`${sciCount} terms`}
            onPress={() => startQuiz({ kind: 'subject', cat: 'Science' })}
            tint="#1565C0"
          />
          <ModeCard
            testID="mode-math"
            icon={<Calculator size={22} color="#2E7D32" strokeWidth={2.4} />}
            title="Math"
            sub={`${mathCount} terms`}
            onPress={() => startQuiz({ kind: 'subject', cat: 'Math' })}
            tint="#2E7D32"
          />
          <ModeCard
            testID="mode-commerce"
            icon={<Briefcase size={22} color="#F57C00" strokeWidth={2.4} />}
            title="Commerce"
            sub={`${comCount} terms`}
            onPress={() => startQuiz({ kind: 'subject', cat: 'Commerce' })}
            tint="#F57C00"
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (building) {
    return <SafeAreaView style={styles.safe}><ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} /></SafeAreaView>;
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <SafeAreaView style={styles.safe} edges={['top']} testID="quiz-done">
        <View style={styles.header}>
          <TouchableOpacity testID="quiz-back-btn" style={styles.iconBtn} onPress={backToMenu}>
            <ArrowLeft size={22} color={colors.primary} strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={styles.title}>Quiz Complete</Text>
          <View style={styles.iconBtn} />
        </View>
        <Animated.View entering={FadeIn.duration(500)} style={styles.resultCard}>
          <Trophy size={56} color={colors.warning} strokeWidth={2.2} />
          <Text style={styles.scoreBig} testID="quiz-score">{score} / {questions.length}</Text>
          <Text style={styles.scoreSub}>{pct}% correct</Text>
          <Text style={styles.feedback}>
            {pct >= 80 ? 'Excellent! 🎉' : pct >= 50 ? 'Good effort — keep practicing.' : 'Try again — revise flashcards first.'}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl }}>
            <TouchableOpacity testID="quiz-restart-btn" style={[styles.cta]} onPress={restart}>
              <RotateCw size={18} color={colors.textInverse} strokeWidth={2.4} />
              <Text style={styles.ctaText}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="quiz-changemode-btn" style={[styles.cta, { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }]} onPress={backToMenu}>
              <Text style={[styles.ctaText, { color: colors.primary }]}>Change Mode</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  const q = questions[idx];

  return (
    <SafeAreaView style={styles.safe} edges={['top']} testID="quiz-screen">
      <View style={styles.header}>
        <TouchableOpacity testID="quiz-back-btn" style={styles.iconBtn} onPress={backToMenu}>
          <ArrowLeft size={22} color={colors.primary} strokeWidth={2.2} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.title}>Quiz</Text>
          <Text style={styles.sub}>{idx + 1} / {questions.length} • Score {score}</Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((idx) / questions.length) * 100}%` }]} />
      </View>

      <Animated.View entering={FadeInDown.duration(400)} key={idx} style={styles.questionCard}>
        <Text style={styles.qLabel}>What is the Kannada meaning of</Text>
        <Text style={styles.qWord} testID="quiz-question">{q.term.eng_word}</Text>
        {q.term.phonetic_kn && <Text style={styles.qPhon}>{q.term.phonetic_kn}</Text>}
        <View style={styles.qChip}>
          <Text style={styles.qChipText}>{q.term.subject_category}</Text>
        </View>
      </Animated.View>

      <View style={styles.optionsList}>
        {q.options.map((opt, i) => {
          const isPicked = picked === i;
          const isAnswer = picked !== null && i === q.answer;
          const isWrong = isPicked && i !== q.answer;
          return (
            <TouchableOpacity
              key={i}
              testID={`quiz-option-${i}`}
              style={[styles.option, isAnswer && styles.optionCorrect, isWrong && styles.optionWrong]}
              onPress={() => onPick(i)}
              disabled={picked !== null}
              activeOpacity={0.85}
            >
              <Text style={[styles.optionText, (isAnswer || isWrong) && { color: colors.textInverse }]}>
                {opt}
              </Text>
              {isAnswer && <Check size={20} color={colors.textInverse} strokeWidth={2.4} />}
              {isWrong && <X size={20} color={colors.textInverse} strokeWidth={2.4} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

interface ModeCardProps {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onPress: () => void;
  tint: string;
  testID: string;
  disabled?: boolean;
}

function ModeCard({ icon, title, sub, onPress, tint, testID, disabled }: ModeCardProps) {
  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.modeCard, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <View style={[styles.modeIcon, { backgroundColor: tint + '15' }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.modeTitle}>{title}</Text>
        <Text style={styles.modeSub}>{sub}</Text>
      </View>
      <Text style={[styles.modeArrow, { color: tint }]}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, padding: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg, marginTop: spacing.sm },
  iconBtn: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2, letterSpacing: 0.5 },

  // mode menu
  menuLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: spacing.sm },
  modeCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, ...shadow.card,
  },
  modeIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  modeTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  modeSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  modeArrow: { fontSize: 28, fontWeight: '300' },

  errBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFEBEE', padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: '#FFCDD2' },
  errText: { color: colors.error, fontSize: 13, fontWeight: '600', flex: 1 },

  // quiz
  progressTrack: { height: 6, backgroundColor: colors.bgElevated, borderRadius: radius.pill, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.warning },
  questionCard: { backgroundColor: colors.bgCard, padding: spacing.xl, borderRadius: radius.xxl, marginVertical: spacing.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', ...shadow.card },
  qLabel: { fontSize: 12, color: colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '700' },
  qWord: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.md, textAlign: 'center', letterSpacing: -0.5 },
  qPhon: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic', marginTop: 6 },
  qChip: { marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.primary + '15' },
  qChipText: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 1 },
  optionsList: { gap: spacing.sm },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, padding: spacing.md, borderRadius: radius.lg, ...shadow.card },
  optionCorrect: { backgroundColor: colors.success, borderColor: colors.success },
  optionWrong: { backgroundColor: colors.error, borderColor: colors.error },
  optionText: { fontSize: 17, fontWeight: '600', color: colors.textPrimary, flex: 1 },

  // result
  resultCard: { alignItems: 'center', backgroundColor: colors.bgCard, padding: spacing.xl, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.border, marginTop: spacing.xl, ...shadow.hero },
  scoreBig: { fontSize: 48, fontWeight: '800', color: colors.primary, marginTop: spacing.md, letterSpacing: -1 },
  scoreSub: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  feedback: { fontSize: 16, color: colors.textPrimary, marginTop: spacing.lg, textAlign: 'center' },
  cta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill },
  ctaText: { color: colors.textInverse, fontSize: 14, fontWeight: '700' },
});
