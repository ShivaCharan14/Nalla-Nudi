import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Volume2, Bookmark, Atom, Calculator, Briefcase } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { colors, radius, spacing, shadow } from '../theme';
import { GlossaryTerm } from '../data/seed';

interface Props {
  term: GlossaryTerm;
  onBookmark: () => void;
  onPress?: () => void;
}

const CATEGORY_ICON = {
  Science: Atom,
  Math: Calculator,
  Commerce: Briefcase,
};

const CATEGORY_TINT = {
  Science: '#1565C0',
  Math: '#2E7D32',
  Commerce: '#F57C00',
};

const DIFF_COLOR = {
  Beginner: colors.success,
  Intermediate: colors.warning,
  Advanced: colors.error,
};

export default function TermCard({ term, onBookmark, onPress }: Props) {
  const Icon = CATEGORY_ICON[term.subject_category];
  const tint = CATEGORY_TINT[term.subject_category];

  const speak = () => {
    Speech.stop();
    Speech.speak(term.eng_word, { language: 'en-IN', rate: 0.95 });
    setTimeout(() => Speech.speak(term.kn_meaning, { language: 'kn-IN', rate: 0.85 }), 900);
  };

  const saved = (term as any).is_saved === 1 || (term as any).is_saved === true;
  const diffColor = DIFF_COLOR[term.difficulty];

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <View style={styles.card} testID={`term-card-${term.id}`}>
        <View style={[styles.iconBadge, { backgroundColor: tint + '15' }]}>
          <Icon size={20} color={tint} strokeWidth={2.2} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.eng} numberOfLines={1}>{term.eng_word}</Text>
          {term.phonetic_kn && (
            <Text style={styles.phon} numberOfLines={1}>{term.phonetic_kn}</Text>
          )}
          <Text style={styles.kn} numberOfLines={1}>{term.kn_meaning}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.cat}>{term.subject_category}</Text>
            <View style={[styles.diffDot, { backgroundColor: diffColor }]} />
            <Text style={[styles.diff, { color: diffColor }]}>{term.difficulty}</Text>
          </View>
        </View>
        <TouchableOpacity testID={`listen-btn-${term.id}`} style={styles.iconBtn} onPress={speak} activeOpacity={0.7}>
          <Volume2 size={20} color={colors.primary} strokeWidth={2.2} />
        </TouchableOpacity>
        <TouchableOpacity testID={`bookmark-btn-${term.id}`} style={styles.iconBtn} onPress={onBookmark} activeOpacity={0.7}>
          <Bookmark
            size={20}
            color={saved ? colors.error : colors.textSecondary}
            fill={saved ? colors.error : 'transparent'}
            strokeWidth={2.2}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow.card,
  },
  iconBadge: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  textBlock: { flex: 1 },
  eng: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  phon: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic', marginTop: 1 },
  kn: { fontSize: 16, color: colors.primary, marginTop: 2, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  cat: { fontSize: 10, color: colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: '700' },
  diffDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 4 },
  diff: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  iconBtn: {
    width: 40, height: 40, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bgElevated,
  },
});
