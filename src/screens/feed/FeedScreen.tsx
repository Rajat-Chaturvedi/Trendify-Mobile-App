// FeedScreen
// Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 5.4, 9.3, 12.4

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { useTrendFeed } from '../../hooks/useTrendFeed';
import { getCurrentCoordinates, resolveRegionCode } from '../../services/locationService';
import { usePreferencesStore } from '../../stores/preferencesStore';
import type { TrendItem } from '../../types/index';

interface Props {
  onItemPress: (item: TrendItem) => void;
  onBookmarksPress: () => void;
}

function SkeletonItem() {
  return (
    <View style={styles.skeletonItem}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonSubtitle} />
    </View>
  );
}

export function FeedScreen({ onItemPress, onBookmarksPress }: Props) {
  const [regionCode, setRegionCode] = useState<string | undefined>();
  const [locationLoading, setLocationLoading] = useState(false);

  const [locationEnabled, setLocationEnabled] = useState(
    () => usePreferencesStore.getState().locationEnabled,
  );

  useEffect(() => {
    return usePreferencesStore.subscribe((state) => {
      setLocationEnabled(state.locationEnabled);
    });
  }, []);

  useEffect(() => {
    if (!locationEnabled) return;
    setLocationLoading(true);
    getCurrentCoordinates(10000)
      .then(async (coords) => {
        if (coords) {
          const code = await resolveRegionCode(coords);
          setRegionCode(code);
        }
      })
      .finally(() => setLocationLoading(false));
  }, [locationEnabled]);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTrendFeed({ regionCode });

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        {locationLoading && (
          <View style={styles.locationBanner}>
            <Text style={styles.locationText}>📍 Detecting your location…</Text>
          </View>
        )}
        {[1, 2, 3, 4, 5].map((i) => <SkeletonItem key={i} />)}
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Could not load trends. Check your connection.</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => refetch()}
          accessibilityLabel="Retry loading feed"
          accessibilityRole="button"
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.offlineText}>You're offline and have no cached content.</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onBookmarksPress}
          accessibilityLabel="View bookmarks"
          accessibilityRole="button"
        >
          <Text style={styles.retryText}>View Bookmarks</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {locationLoading && (
        <View style={styles.locationBanner}>
          <Text style={styles.locationText}>📍 Detecting your location…</Text>
        </View>
      )}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.2}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Trendify</Text>
            <Text style={styles.headerSubtitle}>What's trending today</Text>
          </View>
        }
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={styles.footer} /> : null}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', paddingTop: 8 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  locationBanner: { backgroundColor: '#E3F2FD', padding: 8, alignItems: 'center' },
  locationText: { fontSize: 13, color: '#1565C0' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1a1a1a' },
  headerSubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, marginBottom: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  cardImage: { width: '100%', height: 160, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  cardBody: { padding: 12 },
  categoryBadge: { backgroundColor: '#EBF5FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 6 },
  categoryText: { color: '#007AFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', lineHeight: 22, marginBottom: 6 },
  cardMeta: { fontSize: 12, color: '#8E8E93' },
  skeletonItem: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 12, height: 220 },
  skeletonTitle: { backgroundColor: '#e0e0e0', height: 16, borderRadius: 4, marginBottom: 8, width: '80%' },
  skeletonSubtitle: { backgroundColor: '#e0e0e0', height: 12, borderRadius: 4, width: '50%' },
  errorText: { fontSize: 16, color: '#666', marginBottom: 16, textAlign: 'center' },
  offlineText: { fontSize: 16, color: '#666', marginBottom: 16, textAlign: 'center' },
  retryButton: { minWidth: 44, minHeight: 44, backgroundColor: '#007AFF', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { paddingVertical: 16 },
});
