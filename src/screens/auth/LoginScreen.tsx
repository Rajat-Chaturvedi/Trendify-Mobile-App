// LoginScreen
// Requirements: 2.1, 2.3, 2.5

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { login } from '../../services/authService';
import { authenticate, isAvailable } from '../../services/biometricService';
import { useAuthStore } from '../../stores/authStore';
import { usePreferencesStore } from '../../stores/preferencesStore';

interface Props {
  onSuccess: () => void;
  onRegister: () => void;
}

export function LoginScreen({ onSuccess, onRegister }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    const result = await login(email, password);
    setLoading(false);
    if (result.success && result.token) {
      useAuthStore.getState().setToken(result.token);
      onSuccess();
    } else {
      setError(result.error ?? 'Authentication failed. Please try again.');
    }
  }

  async function handleBiometric() {
    const available = await isAvailable();
    if (!available) {
      setError('Biometric authentication is not available on this device.');
      return;
    }
    const result = await authenticate('Sign in to Trendify');
    if (result.success) {
      // Restore the stored token into AuthStore, then fetch profile
      const { restoreSession, fetchAndSetProfile } = await import('../../services/authService');
      const token = await restoreSession();
      if (token) {
        useAuthStore.getState().setToken(token);
        await fetchAndSetProfile();
        onSuccess();
      } else {
        setError('No saved session found. Please sign in with your credentials first.');
      }
    } else {
      setError('Biometric authentication failed. Please use your credentials.');
    }
  }

  const biometricEnabled = usePreferencesStore.getState().biometricEnabled;

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">Sign In</Text>

      {error && (
        <Text style={styles.error} accessibilityRole="alert">{error}</Text>
      )}

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        accessibilityLabel="Email address"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        accessibilityLabel="Password"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
        accessibilityLabel="Sign in"
        accessibilityRole="button"
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
      </TouchableOpacity>

      {biometricEnabled && (
        <TouchableOpacity
          style={styles.biometricButton}
          onPress={handleBiometric}
          accessibilityLabel="Sign in with biometrics"
          accessibilityRole="button"
        >
          <Text style={styles.biometricText}>Use Face ID / Fingerprint</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.linkButton}
        onPress={onRegister}
        accessibilityLabel="Create an account"
        accessibilityRole="button"
      >
        <Text style={styles.linkText}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  error: { color: '#D32F2F', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, minHeight: 44 },
  button: { minWidth: 44, minHeight: 44, backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  biometricButton: { minWidth: 44, minHeight: 44, borderWidth: 1, borderColor: '#007AFF', borderRadius: 8, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  biometricText: { color: '#007AFF', fontSize: 16 },
  linkButton: { minWidth: 44, minHeight: 44, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  linkText: { color: '#007AFF', fontSize: 14 },
});
