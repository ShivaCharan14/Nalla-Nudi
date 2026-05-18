// SVG circular progress ring with center label.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme';

interface Props {
  size?: number;
  strokeWidth?: number;
  pct: number;          // 0..1
  centerTop: string;    // e.g. "23 / 45"
  centerSub?: string;   // e.g. "MASTERED"
  color?: string;
  trackColor?: string;
}

export default function CircularProgress({
  size = 180,
  strokeWidth = 14,
  pct,
  centerTop,
  centerSub,
  color = colors.success,
  trackColor = colors.bgElevated,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(1, pct)));
  const half = size / 2;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={half} cy={half} r={radius}
          stroke={trackColor} strokeWidth={strokeWidth} fill="none"
        />
        <Circle
          cx={half} cy={half} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${half} ${half})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.top}>{centerTop}</Text>
        {centerSub && <Text style={styles.sub}>{centerSub}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  top: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  sub: { fontSize: 11, color: colors.textSecondary, fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },
});
