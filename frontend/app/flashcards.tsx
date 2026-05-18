// Flashcards Revision — 3D Flip Card with horizontal SWIPE gesture + SM-2 Hard/Okay/Easy rating.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight, Shuffle, GraduationCap, AlarmClock } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';

import { colors, radius, spacing, shadow } from '../src/theme';
import FlipCard from '../src/components/FlipCard';
import { GlossaryTerm } from '../src/data/seed';
import { initDatabase, getAllTerms } from '../src/data/database';
import { rateTerm, dueTermIds, Rating } from '../src/store/useReview';

const SWIPE_THRESHOLD = 80;

export default function FlashcardsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const dueOnly = params.mode === 'due';

  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rated, setRated] = useState(0);
  const [emptyDue, setEmptyDue] = useState(false);

  const dragX = useSharedValue(0);

  useEffect(() => {
    (async () => {
      await initDatabase();
      const all = await getAllTerms();
      if (dueOnly) {
        const dueIds = await dueTermIds();
        const due = all.filter((t) => dueIds.includes(t.id));
        if (due.length === 0) {
          setEmptyDue(true);
        } else {
          setTerms(due);
        }
      } else {
        setTerms([...all].sort(() => Math.random() - 0.5));
      }
      setLoading(false);
    })();
  }, [dueOnly]);

  const goNext = () => setIndex((i) => (i + 1) % terms.length);
  const goPrev = () => setIndex((i) => (i - 1 + terms.length) % terms.length);

  const shuffleAll = () => {
    setTerms((t) => [...t].sort(() => Math.random() - 0.5));
    setIndex(0);
  };

  const onRate = async (rating: Rating) => {
    if (terms.length === 0) return;
    await rateTerm(terms[index].id, rating);
    setRated((r) => r + 1);
    setTimeout(() => goNext(), 200);
  };

  // Pan gesture for swipe-to-next/prev
  const pan = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((e) => { dragX.value = e.translationX; })
    .onEnd((e) => {
      if (e.translationX < -SWIPE_THRESHOLD) {
        dragX.value = withTiming(-400, { duration: 200 }, () => {
          dragX.value = 0;
          runOnJS(goNext)();
        });
      } else if (e.translationX > SWIPE_THRESHOLD) {
        dragX.value = withTiming(400, { duration: 200 }, () => {
          dragX.value = 0;
          runOnJS(goPrev)();
        });
      } else {
        dragX.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragX.value },
      { rotateZ: `${dragX.value / 25}deg` },
    ],
  }));

  if (loading || (terms.length === 0 && !emptyDue)) {
    return (
      <SafeAreaView style={styles.safe} testID="flashcards-loading">
        <ActivityIndicator color={colors.primary} style={{ marginTop: 120 }} />
      </SafeAreaView>
    );
  }

  if (emptyDue) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']} testID="flashcards-empty-due">
        <View style={styles.header}>
          <TouchableOpacity testID="flashcards-back-btn" style={styles.iconBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.primary} strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={styles.title}>Due Today</Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.emptyDue}>
          <AlarmClock size={48} color={colors.success} strokeWidth={1.8} />
          <Text style={styles.emptyDueTitle}>All caught up!</Text>
          <Text style={styles.emptyDueSub}>No words are due for review right now. Keep practicing to build mastery.</Text>
          <TouchableOpacity style={styles.emptyDueBtn} onPress={() => router.replace('/flashcards')} activeOpacity={0.85}>
            <Text style={styles.emptyDueBtnText}>Practice all words</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const current = terms[index];

  return (
    <SafeAreaView style={styles.safe} edges={['top']} testID="flashcards-screen">
      <View style={styles.header}>
        <TouchableOpacity testID="flashcards-back-btn" style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.primary} strokeWidth={2.2} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.title}>Flashcards</Text>
          <Text style={styles.sub}>{index + 1} / {terms.length}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity testID="flashcards-quiz-btn" style={styles.iconBtn} onPress={() => router.push('/quiz')}>
            <GraduationCap size={20} color={colors.primary} strokeWidth={2.2} />
          </TouchableOpacity>
          <TouchableOpacity testID="flashcards-shuffle-btn" style={styles.iconBtn} onPress={shuffleAll}>
            <Shuffle size={20} color={colors.primary} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.cardWrap, cardStyle]}>
          <FlipCard term={current} />
        </Animated.View>
      </GestureDetector>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((index + 1) / terms.length) * 100}%` }]} />
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity testID="flashcards-prev-btn" style={[styles.navBtn, styles.navSecondary]} onPress={goPrev} activeOpacity={0.8}>
          <ChevronLeft size={20} color={colors.primary} strokeWidth={2.4} />
          <Text style={[styles.navText, { color: colors.primary }]}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="flashcards-next-btn" style={[styles.navBtn, styles.navPrimary]} onPress={goNext} activeOpacity={0.85}>
          <Text style={[styles.navText, { color: colors.textInverse }]}>Next</Text>
          <ChevronRight size={20} color={colors.textInverse} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>Tap card to flip · Swipe ← → to navigate</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, padding: spacing.md },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.lg, marginTop: spacing.sm,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: radius.md,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.3 },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2, letterSpacing: 1 },
  cardWrap: { marginVertical: spacing.md },
  progressTrack: {
    height: 6, backgroundColor: colors.bgElevated, borderRadius: radius.pill,
    marginHorizontal: spacing.xs, marginTop: spacing.md, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.success, borderRadius: radius.pill },
  navRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  navBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.md, borderRadius: radius.lg, ...shadow.card,
  },
  navPrimary: { backgroundColor: colors.primary },
  navSecondary: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  navText: { fontSize: 15, fontWeight: '700' },
  hint: { textAlign: 'center', color: colors.textSecondary, fontSize: 12, marginTop: spacing.md, letterSpacing: 0.5 },

  // SM-2 rating
  ratingRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  rateBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.lg, borderWidth: 1, gap: 2 },
  rateText: { fontSize: 13, fontWeight: '800', marginTop: 2 },
  rateSub: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },

  // Empty due state
  emptyDue: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyDueTitle: { fontSize: 22, fontWeight: '800', color: colors.success, marginTop: spacing.md },
  emptyDueSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginTop: 4 },
  emptyDueBtn: { marginTop: spacing.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.pill },
  emptyDueBtnText: { color: colors.textInverse, fontSize: 14, fontWeight: '700' },
});
