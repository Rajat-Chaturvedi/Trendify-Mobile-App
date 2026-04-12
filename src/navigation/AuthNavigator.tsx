// AuthNavigator
// Requirements: 2.1, 2.3, 2.5

import React, { useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainerRef, useNavigation } from '@react-navigation/native';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import type { RootStackParamList } from './RootNavigator';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const rootNav = useNavigation<NavigationContainerRef<RootStackParamList>>();

  function handleAuthSuccess() {
    rootNav.reset({ index: 0, routes: [{ name: 'Main' }] });
  }

  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login">
        {({ navigation }) => (
          <LoginScreen
            onSuccess={handleAuthSuccess}
            onRegister={() => navigation.navigate('Register')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {({ navigation }) => (
          <RegisterScreen
            onSuccess={handleAuthSuccess}
            onLogin={() => navigation.navigate('Login')}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
