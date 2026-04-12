// RootNavigator
// Requirements: 10.1, 10.3, 1.1

import React, { useEffect, useRef, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';

import { getOnboardingComplete } from '../storage/mmkv';
import { useAuthStore } from '../stores/authStore';
import { OnboardingNavigator } from './OnboardingNavigator';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(
    () => useAuthStore.getState().isAuthenticated,
  );

  const onboardingComplete = getOnboardingComplete();

  const initialRoute: keyof RootStackParamList = !onboardingComplete
    ? 'Onboarding'
    : isAuthenticated
    ? 'Main'
    : 'Auth';

  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((state) => {
      setIsAuthenticated(state.isAuthenticated);
      if (state.isAuthenticated) {
        navRef.current?.reset({ index: 0, routes: [{ name: 'Main' }] });
      } else {
        navRef.current?.reset({ index: 0, routes: [{ name: 'Auth' }] });
      }
    });
    return unsubscribe;
  }, []);

  function handleOnboardingComplete() {
    navRef.current?.reset({ index: 0, routes: [{ name: 'Auth' }] });
  }

  return (
    <NavigationContainer ref={navRef}>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding">
          {() => <OnboardingNavigator onComplete={handleOnboardingComplete} />}
        </Stack.Screen>
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Main" component={MainNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
