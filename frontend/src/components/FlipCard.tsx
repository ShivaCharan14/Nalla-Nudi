import React, { useEffect } from 'react';
import { StyleSheet, TouchableWithoutFeedback, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Volume2 } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { colors, radius, spacing, shadow } from '../theme';
import { GlossaryTerm } from '../data/seed';

interface Props {
  term: GlossaryTerm;
}

export default function FlipCard({ term }: Props) {
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = 0;
  }, [term.id]);

  const frontStyle = useAnimatedStyle(() => {
    const rotate = interpolate(spin.value, [0, 1], [0, 180]);
    const opacity = spin.value < 0.5 ? 1 : 0;
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotate}deg` }],
      opacity,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotate = interpolate(spin.value, [0, 1], [180, 360]);
    const opacity = spin.value >= 0.5 ? 1 : 0;
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotate}deg` }],
      opacity,
    };
  });

  const flip = () => {
    spin.value = withTiming(spin.value === 0 ? 1 : 0, {
      duration: 650,
      easing: Easing.bezier(0.175, 0.885, 0.32, 1.275),
    });
  };

  const speakEn = (e: any) => {
    e?.stopPropagation?.();
    Speech.stop();
    Speech.speak(term.eng_word, { language: 'en-IN', rate: 0.95 });
  };
  const speakKn = (e: any) => {
    e?.stopPropagation?.();
    Speech.stop();
    Speech.speak(term.kn_meaning, { language: 'kn-IN', rate: 0.85 });
  };

  return (
    <TouchableWithoutFeedback onPress={flip}>
      <View style={styles.wrapper} testID={`flip-card-${term.id}`}>
        {/* Front */}
        <Animated.View style={[styles.face, styles.front, frontStyle]}>
          <Text style={styles.label}>EN</Text>
          <Text style={styles.engWord} numberOfLines={2}>{term.eng_word}</Text>
          {term.phonetic_kn && (
            <Text style={styles.phonetic}>{term.phonetic_kn}</Text>
          )}
          <Text style={styles.hint}>Tap to reveal Kannada</Text>
          <TouchableWithoutFeedback onPress={speakEn}>
            <View style={styles.speakBtn} testID={`flip-listen-en-${term.id}`}>
              <Volume2 size={20} color={colors.primary} strokeWidth={2.2} />
            </View>
          </TouchableWithoutFeedback>
          <View style={[styles.catPill, { backgroundColor: colors.primaryLight + '22' }]}>
            <Text style={[styles.catText, { color: colors.primary }]}>{term.subject_category}</Text>
          </View>
        </Animated.View>

        {/* Back */}
        <Animated.View style={[styles.face, styles.back, backStyle]}>
          <Text style={[styles.label, { color: '#BBDEFB' }]}>ಕನ್ನಡ</Text>
          <Text style={styles.knWord} numberOfLines={3}>{term.kn_meaning}</Text>
          {term.example ? (
            <Text style={styles.example} numberOfLines={4}>“{term.example}”</Text>
          ) : null}
          <TouchableWithoutFeedback onPress={speakKn}>
            <View style={[styles.speakBtn, { backgroundColor: '#ffffff22' }]} testID={`flip-listen-kn-${term.id}`}>
              <Volume2 size={20} color={colors.textInverse} strokeWidth={2.2} />
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', height: 420 },
  face: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    ...shadow.hero,
  },
  front: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  back: { backgroundColor: colors.primary },
  label: {
    position: 'absolute', top: spacing.lg, left: spacing.lg,
    fontSize: 12, letterSpacing: 2, color: colors.textSecondary, fontWeight: '700',
  },
  engWord: {
    fontSize: 40, fontWeight: '800', color: colors.textPrimary,
    textAlign: 'center', letterSpacing: -0.5,
  },
  knWord: {
    fontSize: 38, fontWeight: '800', color: colors.textInverse,
    textAlign: 'center', lineHeight: 50,
  },
  example: {
    marginTop: spacing.lg, fontSize: 13, color: '#ffffffcc',
    textAlign: 'center', fontStyle: 'italic', paddingHorizontal: spacing.md,
    lineHeight: 18,
  },
  hint: {
    position: 'absolute', bottom: spacing.xl,
    fontSize: 12, color: colors.textSecondary, letterSpacing: 1,
  },
  speakBtn: {
    position: 'absolute', bottom: spacing.lg, right: spacing.lg,
    width: 44, height: 44, borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  catPill: {
    position: 'absolute', top: spacing.lg, right: spacing.lg,
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill,
  },
  catText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  phonetic: {
    marginTop: spacing.sm, fontSize: 16, color: colors.textSecondary,
    fontStyle: 'italic', textAlign: 'center', letterSpacing: 0.5,
  },
});
