// My List — shows bookmarked terms.
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, BookmarkX } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors, radius, spacing } from '../src/theme';
import { useBookmarks } from '../src/store/useGlossary';
import TermCard from '../src/components/TermCard';
import { toggleBookmark } from '../src/data/database';

export default function Bookmarks() {
  const router = useRouter();
  const { items, loading, refresh } = useBookmarks();

  useFocusEffect(React.useCallback(() => { refresh(); }, [refresh]));

  return (
    <SafeAreaView style={styles.safe} edges={['top']} testID="bookmarks-screen">
      <View style={styles.header}>
        <TouchableOpacity
          testID="bookmarks-back-btn"
          style={styles.iconBtn}
          onPress={() => router.back()}
        >
          <ArrowLeft size={22} color={colors.primary} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={styles.title}>My List</Text>
        <View style={styles.iconBtn} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      ) : items.length === 0 ? (
        <View style={styles.empty} testID="bookmarks-empty">
          <BookmarkX size={48} color={colors.textSecondary} strokeWidth={1.8} />
          <Text style={styles.emptyTitle}>No bookmarks yet</Text>
          <Text style={styles.emptySub}>Tap the bookmark icon on any term to save it here.</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
          data={items}
          keyExtractor={(it) => String(it.id)}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 40).duration(350)} style={{ marginBottom: spacing.sm }}>
              <TermCard
                term={item}
                onBookmark={async () => {
                  await toggleBookmark(item.id, false);
                  refresh();
                }}
              />
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: radius.md,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.primary, letterSpacing: -0.3 },
  empty: { alignItems: 'center', justifyContent: 'center', flex: 1, padding: spacing.xl, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.sm },
  emptySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
