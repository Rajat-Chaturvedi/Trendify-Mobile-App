// PermissionsScreen
// Requirements: 1.2, 1.3

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { requestAll, recordDenial } from '../../services/permissionManager';
import type { PermissionResults } from '../../types/index';

interface Props {
  onNext: () => void;
}

export function PermissionsScreen({ onNext }: Props) {
  const [results, setResults] = useState<PermissionResults | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRequestPermissions() {
    setLoading(true);
    const res = await requestAll();
    setResults(res);
    // Record any denials
    (Object.keys(res) as Array<keyof PermissionResults>).forEach((type) => {
      if (res[type] === 'denied') recordDenial(type);
    });
    setLoading(false);
  }

  const statusLabel = (status: string) =>
    status === 'granted' ? '✅' : status === 'denied' ? '❌' : '⏳';

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">App Permissions</Text>
      <Text style={styles.subtitle}>
        Trendify works best with access to your camera, location, and notifications.
        You can change these later in Settings.
      </Text>

      {results && (
        <View style={styles.results}>
          {(['camera', 'location', 'notifications'] as const).map((type) => (
            <View key={type} style={styles.row}>
              <Text style={styles.permLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
              <Text accessibilityLabel={`${type} permission ${results[type]}`}>
                {statusLabel(results[type])}
              </Text>
            </View>
          ))}
        </View>
      )}

      {!results && (
        <TouchableOpacity
          style={styles.button}
          onPress={handleRequestPermissions}
          disabled={loading}
          accessibilityLabel="Request permissions"
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Allow Permissions</Text>
          )}
        </TouchableOpacity>
      )}

      {results && (
        <TouchableOpacity
          style={styles.button}
          onPress={onNext}
          accessibilityLabel="Continue to next step"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 32, textAlign: 'center' },
  results: { marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  permLabel: { fontSize: 16 },
  button: { minWidth: 44, minHeight: 44, backgroundColor: '#007AFF', borderRadius: 8, paddingHorizontal: 32, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
