// WelcomeScreen
// Requirements: 1.1

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  onNext: () => void;
}

export function WelcomeScreen({ onNext }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔥</Text>
      <Text style={styles.title} accessibilityRole="header">Welcome to Trendify</Text>
      <Text style={styles.subtitle}>Stay on top of what's trending around you.</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={onNext}
        accessibilityLabel="Get started"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#007AFF' },
  icon: { fontSize: 72, marginBottom: 24 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 12, textAlign: 'center', color: '#fff' },
  subtitle: { fontSize: 17, color: 'rgba(255,255,255,0.85)', marginBottom: 48, textAlign: 'center', lineHeight: 24 },
  button: { minWidth: 200, minHeight: 52, backgroundColor: '#fff', borderRadius: 26, paddingHorizontal: 40, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#007AFF', fontSize: 17, fontWeight: '700' },
});
