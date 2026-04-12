// Explore Stack Navigator
// Requirements: 10.3, 10.4

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ExploreScreen } from '../screens/explore/ExploreScreen';
import { TrendItemDetailScreen } from '../screens/feed/TrendItemDetailScreen';
import type { TrendItem } from '../types/index';

export type ExploreStackParamList = {
  ExploreScreen: undefined;
  TrendItemDetail: { item: TrendItem };
};

const Stack = createNativeStackNavigator<ExploreStackParamList>();

export function ExploreNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="ExploreScreen" options={{ title: 'Explore' }}>
        {({ navigation }) => (
          <ExploreScreen
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
