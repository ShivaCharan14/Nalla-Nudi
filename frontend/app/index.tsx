// Splash Screen — Educational Blue. Auto transitions to Dashboard after ~2.8s.
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { GraduationCap } from 'lucide-react-native';
import { colors, radius, spacing } from '../src/theme';

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/dashboard'), 2800);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={styles.bg} testID="splash-screen">
      {/* Decorative gradient circles */}
      <View style={[styles.blob, { top: -80, right: -60, backgroundColor: colors.primaryLight, opacity: 0.35 }]} />
      <View style={[styles.blob, { bottom: -100, left: -80, backgroundColor: colors.success, opacity: 0.25 }]} />
      <View style={[styles.blob, { top: '40%', left: -50, width: 160, height: 160, backgroundColor: colors.primaryLight, opacity: 0.2 }]} />

      <View style={styles.content}>
        <Animated.View entering={FadeIn.delay(100).duration(700)} style={styles.logoCircle}>
          <GraduationCap size={42} color={colors.textInverse} strokeWidth={2.2} />
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(200).duration(700)} style={styles.appNameKn}>
          ನಲ್ಲ-ನುಡಿ
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(400).duration(700)} style={styles.appName}>
          Nalla-Nudi
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(600).duration(700)} style={styles.tagline}>
          Bridge-Dictionary for STEM Students
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(900).duration(700)}>
          <TouchableOpacity
            testID="splash-get-started-btn"
            style={styles.cta}
            onPress={() => router.replace('/dashboard')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>Get Started  →</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.primaryDark, overflow: 'hidden' },
  blob: { position: 'absolute', width: 220, height: 220, borderRadius: 999 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  logoCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 3, borderColor: '#ffffff33',
  },
  appNameKn: {
    color: colors.textInverse, fontSize: 44, fontWeight: '800',
    letterSpacing: -0.5, lineHeight: 56,
  },
  appName: {
    color: '#ffffffcc', fontSize: 18, fontWeight: '700',
    letterSpacing: 6, marginTop: spacing.xs, textTransform: 'uppercase',
  },
  tagline: {
    color: '#ffffffcc', fontSize: 14, marginTop: spacing.md,
    textAlign: 'center', letterSpacing: 0.5,
  },
  cta: {
    marginTop: spacing.xxl,
    backgroundColor: colors.textInverse,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  ctaText: {
    color: colors.primaryDark, fontSize: 16, fontWeight: '800', letterSpacing: 0.5,
  },
});
