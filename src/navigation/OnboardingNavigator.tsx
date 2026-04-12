// OnboardingNavigator
// Requirements: 10.1, 10.3

import React from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ─── Placeholder screens ──────────────────────────────────────────────────────

const WelcomeScreen = () => (
  <View>
    <Text>Welcome</Text>
  </View>
);

const FeatureIntroScreen = () => (
  <View>
    <Text>Feature Intro</Text>
  </View>
);

const PermissionsScreen = () => (
  <View>
    <Text>Permissions</Text>
  </View>
);

const BiometricSetupScreen = () => (
  <View>
    <Text>Biometric Setup</Text>
  </View>
);

// ─── Stack param list ─────────────────────────────────────────────────────────

export type OnboardingStackParamList = {
  Welcome: undefined;
  FeatureIntro: undefined;
  Permissions: undefined;
  BiometricSetup: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="FeatureIntro" component={FeatureIntroScreen} />
      <Stack.Screen name="Permissions" component={PermissionsScreen} />
      <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
    </Stack.Navigator>
  );
}
