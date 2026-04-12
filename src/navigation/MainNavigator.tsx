// MainNavigator (Bottom Tabs)
// Requirements: 10.1, 10.2

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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

export function MainNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Feed" component={FeedNavigator} />
      <Tab.Screen name="Explore" component={ExploreNavigator} />
      <Tab.Screen name="Bookmarks">
        {() => <BookmarksScreen onItemPress={() => {}} />}
      </Tab.Screen>
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
