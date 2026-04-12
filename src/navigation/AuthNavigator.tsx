// AuthNavigator
// Requirements: 10.1, 10.3

import React from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ─── Placeholder screens ──────────────────────────────────────────────────────

const LoginScreen = () => (
  <View>
    <Text>Login</Text>
  </View>
);

const RegisterScreen = () => (
  <View>
    <Text>Register</Text>
  </View>
);

// ─── Stack param list ─────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
