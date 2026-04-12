// MainNavigator (Bottom Tabs)
// Requirements: 10.1, 10.3

import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// ─── Placeholder tab screens ──────────────────────────────────────────────────

const FeedScreen = () => (
  <View>
    <Text>Feed</Text>
  </View>
);

const ExploreScreen = () => (
  <View>
    <Text>Explore</Text>
  </View>
);

const BookmarksScreen = () => (
  <View>
    <Text>Bookmarks</Text>
  </View>
);

const ProfileScreen = () => (
  <View>
    <Text>Profile</Text>
  </View>
);

// ─── Tab param list ───────────────────────────────────────────────────────────

export type MainTabParamList = {
  Feed: undefined;
  Explore: undefined;
  Bookmarks: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Bookmarks" component={BookmarksScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
