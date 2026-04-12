// BookmarksScreen
// Requirements: 9.1, 9.2, 9.4

import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useBookmarksStore } from '../../stores/bookmarksStore';
import type { TrendItem } from '../../types/index';

interface Props {
  onItemPress: (item: TrendItem) => void;
}

export function BookmarksScreen({ onItemPress }: Props) {
  // Re-render when bookmarks change by reading from store
  const [, forceUpdate] = useState(0);
  const bookmarks = useBookmarksStore.getState().bookmarks;
  const removeBookmark = useBookmarksStore.getState().removeBookmark;

  // Subscribe to store changes
  React.useEffect(() => {
    return useBookmarksStore.subscribe(() => forceUpdate((n) => n + 1));
  }, []);

  if (bookmarks.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🔖</Text>
        <Text style={styles.emptyTitle}>No bookmarks yet</Text>
        <Text style={styles.emptySubtitle}>Tap the bookmark button on any trend to save it here.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={bookmarks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.cardContent}
            onPress={() => onItemPress(item)}
            accessibilityLabel={`View bookmarked trend: ${item.title}`}
            accessibilityRole="button"
          >
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.cardMeta}>{item.source} · {item.category}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeBookmark(item.id)}
            accessibilityLabel={`Remove bookmark: ${item.title}`}
            accessibilityRole="button"
          >
            <Text style={styles.removeText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f5f5f5' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
  card: { flexDirection: 'row', backgroundColor: '#fff', margin: 8, borderRadius: 8, overflow: 'hidden', minHeight: 44 },
  cardContent: { flex: 1, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  cardMeta: { fontSize: 12, color: '#888' },
  removeButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  removeText: { fontSize: 16, color: '#999' },
});
