// ExploreScreen
// Requirements: 3.1, 3.2

import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { useTrendFeed } from '../../hooks/useTrendFeed';
import type { Category, TrendItem } from '../../types/index';

const ALL_CATEGORIES: Category[] = [
  'technology', 'sports', 'finance', 'entertainment', 'health', 'science',
];

interface Props {
  onItemPress: (item: TrendItem) => void;
}

export function ExploreScreen({ onItemPress }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();

  const { data, isLoading, isError, refetch } = useTrendFeed(
    selectedCategory ? { categories: [selectedCategory] } : {},
  );

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <View style={styles.container}>
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
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => onItemPress(item)}
              accessibilityLabel={`View trend: ${item.title}`}
              accessibilityRole="button"
            >
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.cardMeta}>{item.source} · {item.category}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  chipRow: { maxHeight: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  chipContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 14, color: '#333' },
  chipTextActive: { color: '#fff' },
  loader: { marginTop: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 16, color: '#666', marginBottom: 16 },
  retryButton: { minWidth: 44, minHeight: 44, backgroundColor: '#007AFF', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  card: { backgroundColor: '#fff', margin: 8, padding: 16, borderRadius: 8, minHeight: 44 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  cardMeta: { fontSize: 12, color: '#888' },
});
