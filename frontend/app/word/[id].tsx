// Word Details screen — full bilingual entry with TTS for English & Kannada.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Volume2, Bookmark, Sparkles, Atom, Calculator, Briefcase } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { colors, radius, spacing, shadow } from '../../src/theme';
import { GlossaryTerm } from '../../src/data/seed';
import { initDatabase, getTermById, toggleBookmark } from '../../src/data/database';

const CATEGORY_TINT: Record<string, string> = { Science: '#1565C0', Math: '#2E7D32', Commerce: '#F57C00' };
const CATEGORY_ICON: Record<string, any> = { Science: Atom, Math: Calculator, Commerce: Briefcase };
const DIFF_COLOR: Record<string, string> = { Beginner: colors.success, Intermediate: colors.warning, Advanced: colors.error };

export default function WordDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [term, setTerm] = useState<GlossaryTerm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      await initDatabase();
      const t = await getTermById(Number(id));
      setTerm(t);
      setSaved((t as any)?.is_saved === 1);
      setLoading(false);
    })();
    return () => { Speech.stop(); };
  }, [id]);

  const speakEnglish = () => {
    if (!term) return;
    Speech.stop();
    Speech.speak(term.eng_word, { language: 'en-IN', rate: 0.9 });
    setTimeout(() => {
      if (term.english_meaning) Speech.speak(term.english_meaning, { language: 'en-IN', rate: 0.95 });
    }, 800);
  };

  const speakKannada = () => {
    if (!term) return;
    Speech.stop();
    Speech.speak(term.kn_meaning, { language: 'kn-IN', rate: 0.85 });
    setTimeout(() => {
      if (term.kannada_explanation) Speech.speak(term.kannada_explanation, { language: 'kn-IN', rate: 0.85 });
    }, 1100);
  };

  const onBookmark = async () => {
    if (!term) return;
    const next = !saved;
    setSaved(next);
    await toggleBookmark(term.id, next);
  };

  if (loading) {
    return <SafeAreaView style={styles.safe}><ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} /></SafeAreaView>;
  }

  if (!term) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity testID="word-back-btn" style={styles.iconBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.primary} strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={styles.title}>Word</Text>
          <View style={styles.iconBtn} />
        </View>
        <Text style={styles.notFound}>Word not found.</Text>
      </SafeAreaView>
    );
  }

  const tint = CATEGORY_TINT[term.subject_category] ?? colors.primary;
  const Icon = CATEGORY_ICON[term.subject_category] ?? Atom;
  const isAi = (term as any).ai_generated === 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top']} testID="word-detail-screen">
      <View style={styles.header}>
        <TouchableOpacity testID="word-back-btn" style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.primary} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>Details</Text>
        <TouchableOpacity testID="word-bookmark-btn" style={styles.iconBtn} onPress={onBookmark}>
          <Bookmark size={20} color={saved ? colors.error : colors.textSecondary} fill={saved ? colors.error : 'transparent'} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero card — English word */}
        <Animated.View entering={FadeIn.duration(450)} style={[styles.hero, { backgroundColor: tint }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroPill}>
              <Icon size={14} color={colors.textInverse} strokeWidth={2.4} />
              <Text style={styles.heroPillText}>{term.subject_category}</Text>
            </View>
            <View style={[styles.heroPill, { backgroundColor: '#ffffff22' }]}>
              <View style={[styles.diffDot, { backgroundColor: DIFF_COLOR[term.difficulty] }]} />
              <Text style={styles.heroPillText}>{term.difficulty}</Text>
            </View>
          </View>
          <Text style={styles.engHero} testID="word-eng">{term.eng_word}</Text>
          {term.phonetic_kn && <Text style={styles.phonHero}>{term.phonetic_kn}</Text>}
          {isAi && (
            <View style={styles.aiBadge} testID="ai-badge">
              <Sparkles size={12} color={colors.warning} strokeWidth={2.4} />
              <Text style={styles.aiBadgeText}>AI Generated</Text>
            </View>
          )}
        </Animated.View>

        {/* English Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section} testID="english-section">
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTag}>
              <Text style={styles.sectionTagText}>EN</Text>
            </View>
            <Text style={styles.sectionTitle}>English Meaning</Text>
            <TouchableOpacity testID="speak-english-btn" style={[styles.speakerBtn, { backgroundColor: tint }]} onPress={speakEnglish} activeOpacity={0.85}>
              <Volume2 size={18} color={colors.textInverse} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionBody} testID="english-meaning">
            {term.english_meaning || 'No English explanation available yet.'}
          </Text>
          {term.example && (
            <View style={styles.exampleBox}>
              <Text style={styles.exampleLabel}>EXAMPLE</Text>
              <Text style={styles.exampleText}>"{term.example}"</Text>
            </View>
          )}
        </Animated.View>

        {/* Kannada Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section} testID="kannada-section">
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionTag, { backgroundColor: colors.warning + '22' }]}>
              <Text style={[styles.sectionTagText, { color: colors.warning }]}>ಕ</Text>
            </View>
            <Text style={styles.sectionTitle}>Kannada Meaning</Text>
            <TouchableOpacity testID="speak-kannada-btn" style={[styles.speakerBtn, { backgroundColor: colors.warning }]} onPress={speakKannada} activeOpacity={0.85}>
              <Volume2 size={18} color={colors.textInverse} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
          <Text style={styles.knMeaning} testID="kannada-meaning">{term.kn_meaning}</Text>
          <Text style={styles.knExplanation} testID="kannada-explanation">
            {term.kannada_explanation || 'ವಿವರಣೆ ಲಭ್ಯವಿಲ್ಲ.'}
          </Text>
        </Animated.View>

        {/* Footer hint */}
        <Text style={styles.footerHint}>
          Tap the speaker icons to hear pronunciation.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md },
  iconBtn: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.3, flex: 1, textAlign: 'center' },

  content: { padding: spacing.md, paddingBottom: spacing.xxl },

  hero: { borderRadius: radius.xxl, padding: spacing.lg, ...shadow.hero, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ffffff33', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  heroPillText: { color: colors.textInverse, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  diffDot: { width: 6, height: 6, borderRadius: 3 },
  engHero: { color: colors.textInverse, fontSize: 36, fontWeight: '800', letterSpacing: -1, lineHeight: 44 },
  phonHero: { color: '#ffffffcc', fontSize: 16, marginTop: 6, fontStyle: 'italic', letterSpacing: 0.5 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: spacing.md, backgroundColor: '#ffffff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  aiBadgeText: { fontSize: 11, fontWeight: '700', color: colors.warning, letterSpacing: 0.5 },

  section: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginTop: spacing.md, ...shadow.card },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  sectionTag: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  sectionTagText: { fontSize: 13, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase', flex: 1 },
  speakerBtn: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },

  sectionBody: { fontSize: 17, color: colors.textPrimary, fontWeight: '600', lineHeight: 24, marginTop: 4 },
  knMeaning: { fontSize: 28, color: colors.primary, fontWeight: '800', letterSpacing: -0.5, lineHeight: 38 },
  knExplanation: { fontSize: 16, color: colors.textPrimary, fontWeight: '500', lineHeight: 24, marginTop: spacing.sm },

  exampleBox: { marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.bgElevated, borderRadius: radius.md, borderLeftWidth: 3, borderLeftColor: colors.primary },
  exampleLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  exampleText: { fontSize: 14, color: colors.textPrimary, fontStyle: 'italic', lineHeight: 20 },

  footerHint: { textAlign: 'center', color: colors.textSecondary, fontSize: 12, marginTop: spacing.lg, letterSpacing: 0.3 },
  notFound: { textAlign: 'center', marginTop: spacing.xxl, color: colors.textSecondary, fontSize: 16 },
});
