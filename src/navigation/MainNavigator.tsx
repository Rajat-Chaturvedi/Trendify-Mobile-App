// MainNavigator (Bottom Tabs)
// Requirements: 10.1, 10.2

import React from 'react';
import { Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FeedNavigator } from './FeedNavigator';
import { ExploreNavigator } from './ExploreNavigator';
import { BookmarksScreen } from '../screens/bookmarks/BookmarksScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

export type MainTabParamList = {
  Feed: undefined;
  Explore: undefined;
  Bookmarks: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, string> = {
  Feed: '🔥',
  Explore: '🔍',
  Bookmarks: '🔖',
  Profile: '👤',
};

export function MainNavigator() {
  const insets = useSafeAreaInsets();
  // On Android with gesture nav, insets.bottom can be 0 even though nav bar overlaps.
  // Add a minimum bottom padding so the tab bar always clears the system nav area.
  const tabBarHeight = 56 + Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8),
          paddingTop: 6,
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          backgroundColor: '#fff',
          elevation: 8,
        },
        tabBarIcon: ({ color }) => (
          <Text style={{ fontSize: 22, color }}>{TAB_ICONS[route.name]}</Text>
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedNavigator} />
      <Tab.Screen name="Explore" component={ExploreNavigator} />
      <Tab.Screen name="Bookmarks">
        {() => <BookmarksScreen onItemPress={() => {}} />}
      </Tab.Screen>
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
