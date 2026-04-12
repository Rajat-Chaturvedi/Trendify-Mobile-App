// Explore Stack Navigator
// Requirements: 10.3, 10.4

import React from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const ExploreScreen = () => <View><Text>Explore</Text></View>;
const TrendItemDetailScreen = () => <View><Text>Trend Detail</Text></View>;

export type ExploreStackParamList = {
  ExploreScreen: undefined;
  TrendItemDetail: { id: string };
};

const Stack = createNativeStackNavigator<ExploreStackParamList>();

export function ExploreNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="ExploreScreen" component={ExploreScreen} options={{ title: 'Explore' }} />
      <Stack.Screen name="TrendItemDetail" component={TrendItemDetailScreen} options={{ title: 'Detail' }} />
    </Stack.Navigator>
  );
}
