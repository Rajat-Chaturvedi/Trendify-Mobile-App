// OnboardingNavigator
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { FeatureIntroScreen } from '../screens/onboarding/FeatureIntroScreen';
import { PermissionsScreen } from '../screens/onboarding/PermissionsScreen';
import { BiometricSetupScreen } from '../screens/onboarding/BiometricSetupScreen';

export type OnboardingStackParamList = {
  Welcome: undefined;
  FeatureIntro: undefined;
  Permissions: undefined;
  BiometricSetup: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

interface Props {
  onComplete: () => void;
}

export function OnboardingNavigator({ onComplete }: Props) {
  return (
    <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome">
        {({ navigation }) => (
          <WelcomeScreen onNext={() => navigation.navigate('FeatureIntro')} />
        )}
      </Stack.Screen>
      <Stack.Screen name="FeatureIntro">
        {({ navigation }) => (
          <FeatureIntroScreen onNext={() => navigation.navigate('Permissions')} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Permissions">
        {({ navigation }) => (
          <PermissionsScreen onNext={() => navigation.navigate('BiometricSetup')} />
        )}
      </Stack.Screen>
      <Stack.Screen name="BiometricSetup">
        {() => <BiometricSetupScreen onDone={onComplete} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
