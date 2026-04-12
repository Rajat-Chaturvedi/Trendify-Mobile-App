// RootNavigator
// Requirements: 10.1, 10.3, 1.1

import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import { getOnboardingComplete } from '../storage/mmkv';
import { useAuthStore } from '../stores/authStore';
import { OnboardingNavigator } from './OnboardingNavigator';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

// ─── Root param list ──────────────────────────────────────────────────────────

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Component ────────────────────────────────────────────────────────────────

export function RootNavigator() {
  // Subscribe to auth state changes so the navigator re-renders on login/logout
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => useAuthStore.getState().isAuthenticated,
  );

  useEffect(() => {
    // useAuthStore is a vanilla zustand store — subscribe returns an unsubscribe fn
    const unsubscribe = useAuthStore.subscribe((state) => {
      setIsAuthenticated(state.isAuthenticated);
    });
    return unsubscribe;
  }, []);

  const onboardingComplete = getOnboardingComplete();

  // Determine initial route based on flags
  const initialRoute: keyof RootStackParamList = !onboardingComplete
    ? 'Onboarding'
    : isAuthenticated
    ? 'Main'
    : 'Auth';

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        {!onboardingComplete && (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        )}
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
