// FeatureIntroScreen
// Requirements: 1.1

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const FEATURES = [
  { icon: '📰', title: 'Trending Feed', desc: 'Discover what the world is talking about.' },
  { icon: '📍', title: 'Local Trends', desc: 'See what is trending near you.' },
  { icon: '🔖', title: 'Bookmarks', desc: 'Save articles to read offline.' },
];

interface Props {
  onNext: () => void;
}

export function FeatureIntroScreen({ onNext }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">What you can do</Text>
      {FEATURES.map((f) => (
        <View key={f.title} style={styles.feature}>
          <Text style={styles.icon}>{f.icon}</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </View>
        </View>
      ))}
      <TouchableOpacity
        style={styles.button}
        onPress={onNext}
        accessibilityLabel="Continue to permissions"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
  feature: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  icon: { fontSize: 32, marginRight: 16 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  featureDesc: { fontSize: 14, color: '#666' },
  button: { minWidth: 44, minHeight: 44, backgroundColor: '#007AFF', borderRadius: 8, paddingHorizontal: 32, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
