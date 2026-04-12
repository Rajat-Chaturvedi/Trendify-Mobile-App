// Feed Stack Navigator
// Requirements: 10.3, 10.4

import React from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const FeedScreen = () => <View><Text>Feed</Text></View>;
const TrendItemDetailScreen = () => <View><Text>Trend Detail</Text></View>;

export type FeedStackParamList = {
  FeedScreen: undefined;
  TrendItemDetail: { id: string };
};

const Stack = createNativeStackNavigator<FeedStackParamList>();

export function FeedNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="FeedScreen" component={FeedScreen} options={{ title: 'Feed' }} />
      <Stack.Screen name="TrendItemDetail" component={TrendItemDetailScreen} options={{ title: 'Detail' }} />
    </Stack.Navigator>
  );
}
