// Bookmarks Stack Navigator
// Requirements: 10.3, 10.4

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BookmarksScreen } from '../screens/bookmarks/BookmarksScreen';
import { TrendItemDetailScreen } from '../screens/feed/TrendItemDetailScreen';
import type { TrendItem } from '../types/index';

export type BookmarksStackParamList = {
  BookmarksScreen: undefined;
  TrendItemDetail: { item: TrendItem };
};

const Stack = createNativeStackNavigator<BookmarksStackParamList>();

export function BookmarksNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="BookmarksScreen" options={{ title: 'Bookmarks' }}>
        {({ navigation }) => (
          <BookmarksScreen
            onItemPress={(item) => navigation.navigate('TrendItemDetail', { item })}
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
