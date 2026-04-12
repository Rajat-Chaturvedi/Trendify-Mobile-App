// BiometricSetupScreen
// Requirements: 1.4, 1.5

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { isAvailable } from '../../services/biometricService';
import { setOnboardingComplete } from '../../storage/mmkv';
import { usePreferencesStore } from '../../stores/preferencesStore';

interface Props {
  onDone: () => void;
}

export function BiometricSetupScreen({ onDone }: Props) {
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    isAvailable().then(setBiometricAvailable);
  }, []);

  function handleEnable() {
    usePreferencesStore.getState().setBiometricEnabled(true);
    finishOnboarding();
  }

  function finishOnboarding() {
    setOnboardingComplete(true);
    onDone();
  }

  if (!biometricAvailable) {
    // Skip biometric setup — just complete onboarding
    finishOnboarding();
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">Enable Biometric Login</Text>
      <Text style={styles.subtitle}>
        Use Face ID or fingerprint to sign in quickly and securely.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={handleEnable}
        accessibilityLabel="Enable biometric login"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Enable</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.skipButton}
        onPress={finishOnboarding}
        accessibilityLabel="Skip biometric setup"
        accessibilityRole="button"
      >
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 40, textAlign: 'center' },
  button: { minWidth: 44, minHeight: 44, backgroundColor: '#007AFF', borderRadius: 8, paddingHorizontal: 32, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  skipButton: { minWidth: 44, minHeight: 44, paddingHorizontal: 32, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  skipText: { color: '#007AFF', fontSize: 16 },
});
