import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { Category } from '../data/seed';
import { Lang, t } from '../i18n/strings';

type Filter = Category | 'All';

interface Props {
  value: Filter;
  onChange: (f: Filter) => void;
  lang: Lang;
}

const ORDER: Filter[] = ['All', 'Science', 'Math', 'Commerce'];

const labelKey: Record<Filter, keyof typeof import('../i18n/strings').strings.en> = {
  All: 'filter_all',
  Science: 'filter_science',
  Math: 'filter_math',
  Commerce: 'filter_commerce',
};

export default function FilterChips({ value, onChange, lang }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {ORDER.map((f) => {
        const active = value === f;
        return (
          <TouchableOpacity
            key={f}
            testID={`filter-chip-${f.toLowerCase()}`}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {t(lang, labelKey[f])}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: spacing.sm, gap: spacing.sm, paddingRight: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.textInverse,
  },
});
