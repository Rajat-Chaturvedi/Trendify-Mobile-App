// TrendItemDetailScreen
// Requirements: 4.1, 4.2, 4.3, 4.4

import React from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, ScrollView, Share, Linking,
} from 'react-native';
import { useBookmarksStore } from '../../stores/bookmarksStore';
import type { TrendItem } from '../../types/index';

interface Props {
  item: TrendItem;
  onBack: () => void;
}

export function TrendItemDetailScreen({ item, onBack }: Props) {
  const isBookmarked = useBookmarksStore.getState().isBookmarked(item.id);
  const addBookmark = useBookmarksStore.getState().addBookmark;
  const removeBookmark = useBookmarksStore.getState().removeBookmark;

  function handleBookmark() {
    if (isBookmarked) {
      removeBookmark(item.id);
    } else {
      addBookmark(item);
    }
  }

  async function handleShare() {
    await Share.share({ title: item.title, url: item.url, message: `${item.title} — ${item.url}` });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image
        source={{ uri: `https://picsum.photos/seed/${item.id}/800/400` }}
        style={styles.image}
        accessibilityLabel={`Image for ${item.title}`}
        resizeMode="cover"
      />

      <View style={styles.body}>
        <Text style={styles.category}>{item.category.toUpperCase()}</Text>
        <Text style={styles.title} accessibilityRole="header">{item.title}</Text>
        <Text style={styles.meta}>{item.source} · {new Date(item.publishedAt).toLocaleDateString()}</Text>
        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleBookmark}
            accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            accessibilityRole="button"
          >
            <Text style={styles.actionText}>{isBookmarked ? '🔖 Bookmarked' : '🔖 Bookmark'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
            accessibilityLabel="Share this trend"
            accessibilityRole="button"
          >
            <Text style={styles.actionText}>↗ Share</Text>
          </TouchableOpacity>
        </View>

        {!!item.url && (
          <TouchableOpacity
            style={styles.readButton}
            onPress={() => Linking.openURL(item.url)}
            accessibilityLabel="Read full article"
            accessibilityRole="link"
          >
            <Text style={styles.readButtonText}>Read Full Article →</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 32 },
  image: { width: '100%', height: 240 },
  body: { padding: 16 },
  category: { fontSize: 12, color: '#007AFF', fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, color: '#1a1a1a' },
  meta: { fontSize: 13, color: '#8E8E93', marginBottom: 16 },
  description: { fontSize: 16, lineHeight: 26, color: '#333', marginBottom: 24 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionButton: { minWidth: 44, minHeight: 44, borderWidth: 1, borderColor: '#007AFF', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
  readButton: { backgroundColor: '#007AFF', borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  readButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
