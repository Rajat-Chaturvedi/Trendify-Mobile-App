// RegisterScreen
// Requirements: 2.1

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { register } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';

interface Props {
  onSuccess: () => void;
  onLogin: () => void;
}

export function RegisterScreen({ onSuccess, onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    setLoading(true);
    setError(null);
    const result = await register(email, password);
    setLoading(false);
    if (result.success && result.token) {
      useAuthStore.getState().setToken(result.token);
      onSuccess();
    } else {
      setError(result.error ?? 'Registration failed. Please try again.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">Create Account</Text>

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
        onPress={handleRegister}
        disabled={loading}
        accessibilityLabel="Create account"
        accessibilityRole="button"
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={onLogin}
        accessibilityLabel="Sign in to existing account"
        accessibilityRole="button"
      >
        <Text style={styles.linkText}>Already have an account? Sign In</Text>
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
  linkButton: { minWidth: 44, minHeight: 44, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  linkText: { color: '#007AFF', fontSize: 14 },
});
