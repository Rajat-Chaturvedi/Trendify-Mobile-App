// ExploreScreen
// Requirements: 3.1, 3.2

import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTrendFeed } from '../../hooks/useTrendFeed';
import type { Category, TrendItem } from '../../types/index';

const ALL_CATEGORIES: Category[] = [
  'technology', 'sports', 'finance', 'entertainment', 'health', 'science',
];

interface Props {
  onItemPress: (item: TrendItem) => void;
}

export function ExploreScreen({ onItemPress }: Props) {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();

  const { data, isLoading, isError, refetch } = useTrendFeed(
    selectedCategory ? { categories: [selectedCategory] } : {},
  );

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Category filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipContent}
      >
        <TouchableOpacity
          style={[styles.chip, !selectedCategory && styles.chipActive]}
          onPress={() => setSelectedCategory(undefined)}
          accessibilityLabel="Show all categories"
          accessibilityRole="button"
        >
          <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {ALL_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, selectedCategory === cat && styles.chipActive]}
            onPress={() => setSelectedCategory(cat)}
            accessibilityLabel={`Filter by ${cat}`}
            accessibilityRole="button"
          >
            <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading && <ActivityIndicator style={styles.loader} />}

      {isError && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Could not load trends.</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
            accessibilityLabel="Retry loading explore feed"
            accessibilityRole="button"
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => onItemPress(item)}
              accessibilityLabel={`View trend: ${item.title}`}
              accessibilityRole="button"
            >
              <Image
                source={{ uri: `https://picsum.photos/seed/${item.id}/400/200` }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.cardBody}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardMeta}>{item.source} · {new Date(item.publishedAt).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  chipRow: { maxHeight: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  chipContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, alignItems: 'center' },
  chip: { minHeight: 44, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 14, color: '#333' },
  chipTextActive: { color: '#fff' },
  loader: { marginTop: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 16, color: '#666', marginBottom: 16 },
  retryButton: { minWidth: 44, minHeight: 44, backgroundColor: '#007AFF', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, marginBottom: 12, marginTop: 4, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  cardImage: { width: '100%', height: 160, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  cardBody: { padding: 12 },
  categoryBadge: { backgroundColor: '#EBF5FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 6 },
  categoryText: { color: '#007AFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', lineHeight: 22, marginBottom: 6 },
  cardMeta: { fontSize: 12, color: '#8E8E93' },
});
