// FeedScreen
// Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 5.4, 9.3, 12.4

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
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

  const locationEnabled = usePreferencesStore.getState().locationEnabled;

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
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.2}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={styles.footer} /> : null}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  locationBanner: { backgroundColor: '#E3F2FD', padding: 8, alignItems: 'center' },
  locationText: { fontSize: 13, color: '#1565C0' },
  card: { backgroundColor: '#fff', margin: 8, padding: 16, borderRadius: 8, minHeight: 44 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  cardMeta: { fontSize: 12, color: '#888' },
  skeletonItem: { backgroundColor: '#fff', margin: 8, padding: 16, borderRadius: 8, height: 72 },
  skeletonTitle: { backgroundColor: '#e0e0e0', height: 16, borderRadius: 4, marginBottom: 8, width: '80%' },
  skeletonSubtitle: { backgroundColor: '#e0e0e0', height: 12, borderRadius: 4, width: '50%' },
  errorText: { fontSize: 16, color: '#666', marginBottom: 16, textAlign: 'center' },
  offlineText: { fontSize: 16, color: '#666', marginBottom: 16, textAlign: 'center' },
  retryButton: { minWidth: 44, minHeight: 44, backgroundColor: '#007AFF', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { paddingVertical: 16 },
});
