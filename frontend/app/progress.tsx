// Progress Tracker screen — circular ring + per-subject bars + SM-2 stats.
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, Atom, Calculator, Briefcase, Layers, Sparkles, AlarmClock, Clock } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors, radius, spacing, shadow } from '../src/theme';
import CircularProgress from '../src/components/CircularProgress';
import { initDatabase, getAllTerms } from '../src/data/database';
import { GlossaryTerm } from '../src/data/seed';
import { buildProgress, ProgressSnapshot, dueTermIds } from '../src/store/useReview';
import { useReminder } from '../src/store/useReminder';

const SUBJECTS: Array<{ key: 'Science' | 'Math' | 'Commerce'; tint: string; icon: React.ComponentType<any> }> = [
  { key: 'Science',  tint: '#1565C0', icon: Atom },
  { key: 'Math',     tint: '#2E7D32', icon: Calculator },
  { key: 'Commerce', tint: '#F57C00', icon: Briefcase },
];

export default function ProgressScreen() {
  const router = useRouter();
  const [snap, setSnap] = useState<ProgressSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const reminder = useReminder();

  const refresh = useCallback(async () => {
    setLoading(true);
    await initDatabase();
    const all = await getAllTerms();
    const perCat: Record<string, number> = {};
    const catById: Record<number, string> = {};
    for (const t of all) {
      perCat[t.subject_category] = (perCat[t.subject_category] ?? 0) + 1;
      catById[t.id] = t.subject_category;
    }
    const s = await buildProgress(all.length, perCat, catById);
    setSnap(s);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  if (loading || !snap) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const masteryPct = snap.total > 0 ? snap.mastered / snap.total : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']} testID="progress-screen">
      <View style={styles.header}>
        <TouchableOpacity testID="progress-back-btn" style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.primary} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={styles.title}>Progress</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        {/* Hero ring */}
        <Animated.View entering={FadeInDown.duration(450)} style={styles.heroCard}>
          <CircularProgress
            pct={masteryPct}
            centerTop={`${snap.mastered} / ${snap.total}`}
            centerSub="MASTERED"
            color={colors.success}
          />
          <Text style={styles.heroPct}>{Math.round(masteryPct * 100)}%</Text>
          <Text style={styles.heroSub}>You're mastering Nalla-Nudi — keep going!</Text>
          <View style={styles.statRow}>
            <Stat label="Learning" value={snap.learning} color={colors.warning} />
            <View style={styles.statDivider} />
            <Stat label="Due Today" value={snap.due} color={colors.error} />
            <View style={styles.statDivider} />
            <Stat label="Total" value={snap.total} color={colors.textSecondary} />
          </View>
        </Animated.View>

        {/* Per-subject */}
        <Text style={styles.sectionLabel}>By Subject</Text>
        {SUBJECTS.map((s, i) => {
          const cat = snap.byCategory[s.key];
          const total = cat?.total ?? 0;
          const mast = cat?.mastered ?? 0;
          const pct = total > 0 ? mast / total : 0;
          const Icon = s.icon;
          return (
            <Animated.View
              key={s.key}
              entering={FadeInDown.delay(150 + i * 80).duration(400)}
              style={styles.subjectCard}
              testID={`subject-progress-${s.key.toLowerCase()}`}
            >
              <View style={[styles.subjectIcon, { backgroundColor: s.tint + '15' }]}>
                <Icon size={20} color={s.tint} strokeWidth={2.4} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.subjectTopRow}>
                  <Text style={styles.subjectName}>{s.key}</Text>
                  <Text style={[styles.subjectCount, { color: s.tint }]}>{mast} / {total}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: s.tint }]} />
                </View>
              </View>
            </Animated.View>
          );
        })}

        {/* CTAs */}
        <View style={styles.ctaRow}>
          <TouchableOpacity
            testID="progress-start-review"
            style={[styles.cta, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/flashcards')}
            activeOpacity={0.85}
          >
            <Layers size={18} color={colors.textInverse} strokeWidth={2.4} />
            <Text style={styles.ctaText}>{snap.due > 0 ? `Review ${snap.due} due` : 'Start Flashcards'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="progress-quiz-cta"
            style={[styles.cta, { backgroundColor: colors.success }]}
            onPress={() => router.push('/quiz')}
            activeOpacity={0.85}
          >
            <Sparkles size={18} color={colors.textInverse} strokeWidth={2.4} />
            <Text style={styles.ctaText}>Take Quiz</Text>
          </TouchableOpacity>
        </View>

        {/* Reminder card — interactive */}
        <View style={styles.reminderCard} testID="reminder-card">
          <View style={styles.reminderHeader}>
            <View style={styles.reminderIconWrap}>
              <AlarmClock size={20} color={colors.primary} strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reminderTitle}>Daily reminder</Text>
              <Text style={styles.reminderSub}>
                {reminder.pref.enabled
                  ? `On · ${formatTime(reminder.pref.hour, reminder.pref.minute)}`
                  : reminder.supported
                    ? 'Get a daily nudge to revise'
                    : 'Available on phone (Expo Go)'}
              </Text>
            </View>
            <TouchableOpacity
              testID="reminder-toggle"
              style={[styles.toggle, reminder.pref.enabled && styles.toggleOn, !reminder.supported && { opacity: 0.4 }]}
              onPress={reminder.toggle}
              disabled={!reminder.supported}
              activeOpacity={0.7}
            >
              <View style={[styles.toggleKnob, reminder.pref.enabled && styles.toggleKnobOn]} />
            </TouchableOpacity>
          </View>

          {reminder.pref.enabled && reminder.supported && (
            <View style={styles.timeRow}>
              <Clock size={14} color={colors.textSecondary} strokeWidth={2.2} />
              <Text style={styles.timeLabel}>Reminder time</Text>
              <View style={styles.timeChips}>
                {[18, 19, 20, 21].map((h) => (
                  <TouchableOpacity
                    key={h}
                    testID={`reminder-time-${h}`}
                    style={[styles.timeChip, reminder.pref.hour === h && styles.timeChipActive]}
                    onPress={() => reminder.setTime(h, 0)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.timeChipText, reminder.pref.hour === h && styles.timeChipTextActive]}>
                      {formatTime(h, 0)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {reminder.permissionDenied && (
            <Text style={styles.permWarn} testID="reminder-perm-warning">
              Notifications permission was denied. Enable it in your phone Settings → Apps → Expo Go → Notifications.
            </Text>
          )}

          {!reminder.supported && (
            <Text style={styles.permWarn}>
              Open this app in Expo Go on your phone to enable daily reminders.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTime(h: number, m: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}:${m.toString().padStart(2, '0')} ${period}`;
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md },
  iconBtn: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.3 },

  heroCard: { backgroundColor: colors.bgCard, padding: spacing.lg, borderRadius: radius.xxl, alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...shadow.card },
  heroPct: { fontSize: 14, fontWeight: '700', color: colors.success, marginTop: spacing.md, letterSpacing: 1 },
  heroSub: { fontSize: 13, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
  statRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, alignSelf: 'stretch' },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '700', letterSpacing: 1, marginTop: 4, textTransform: 'uppercase' },

  sectionLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: spacing.lg, marginBottom: spacing.sm },
  subjectCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, ...shadow.card },
  subjectIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  subjectTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  subjectName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  subjectCount: { fontSize: 13, fontWeight: '800' },
  barTrack: { height: 8, backgroundColor: colors.bgElevated, borderRadius: radius.pill, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.pill },

  ctaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cta: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderRadius: radius.lg },
  ctaText: { color: colors.textInverse, fontSize: 14, fontWeight: '700' },

  hintBox: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', backgroundColor: colors.primary + '10', padding: spacing.md, borderRadius: radius.lg, marginTop: spacing.lg, borderWidth: 1, borderColor: colors.primary + '30' },
  hintTitle: { fontSize: 13, fontWeight: '700', color: colors.primary },
  hintText: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },

  // Interactive reminder card
  reminderCard: {
    backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, marginTop: spacing.lg, ...shadow.card,
  },
  reminderHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reminderIconWrap: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center',
  },
  reminderTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  reminderSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  toggle: {
    width: 48, height: 28, borderRadius: 14,
    backgroundColor: colors.bgElevated, padding: 2, justifyContent: 'center',
  },
  toggleOn: { backgroundColor: colors.success },
  toggleKnob: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.bgCard, alignSelf: 'flex-start',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  toggleKnobOn: { alignSelf: 'flex-end' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, flexWrap: 'wrap' },
  timeLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  timeChips: { flexDirection: 'row', gap: 6, flex: 1, flexWrap: 'wrap' },
  timeChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgElevated,
  },
  timeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeChipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  timeChipTextActive: { color: colors.textInverse },
  permWarn: { marginTop: spacing.sm, fontSize: 11, color: colors.warning, fontStyle: 'italic', lineHeight: 16 },
});
