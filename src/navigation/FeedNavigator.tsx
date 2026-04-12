// Feed Stack Navigator
// Requirements: 10.3, 10.4

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FeedScreen } from '../screens/feed/FeedScreen';
import { TrendItemDetailScreen } from '../screens/feed/TrendItemDetailScreen';
import type { TrendItem } from '../types/index';

export type FeedStackParamList = {
  FeedScreen: undefined;
  TrendItemDetail: { item: TrendItem };
};

const Stack = createNativeStackNavigator<FeedStackParamList>();

export function FeedNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="FeedScreen" options={{ title: 'Trending' }}>
        {({ navigation }) => (
          <FeedScreen
            onItemPress={(item) => navigation.navigate('TrendItemDetail', { item })}
            onBookmarksPress={() => {}}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="TrendItemDetail" options={{ title: 'Detail' }}>
        {({ navigation, route }) => (
          <TrendItemDetailScreen
            item={route.params.item}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
