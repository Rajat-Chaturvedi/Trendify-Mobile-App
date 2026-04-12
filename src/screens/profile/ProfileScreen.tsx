// ProfileScreen
// Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 7.5

import React, { useEffect, useState } from 'react';
import {
  View, Text, Switch, TouchableOpacity,
  StyleSheet, ScrollView, Linking,
} from 'react-native';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { useAuthStore } from '../../stores/authStore';
import { getStatus } from '../../services/permissionManager';
import { register as registerNotifications, cancelScheduled } from '../../services/notificationService';
import type { Category, PermissionStatus } from '../../types/index';

const ALL_CATEGORIES: Category[] = [
  'technology', 'sports', 'finance', 'entertainment', 'health', 'science',
];

interface PermissionBadgeProps {
  label: string;
  status: PermissionStatus;
}

function PermissionBadge({ label, status }: PermissionBadgeProps) {
  const color = status === 'granted' ? '#4CAF50' : status === 'denied' ? '#F44336' : '#FF9800';
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeLabel}>{label}</Text>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeStatus, { color }]}>{status}</Text>
      {status === 'denied' && (
        <TouchableOpacity
          onPress={() => Linking.openSettings()}
          accessibilityLabel={`Open settings to grant ${label} permission`}
          accessibilityRole="button"
          style={styles.settingsLink}
        >
          <Text style={styles.settingsLinkText}>Open Settings</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function ProfileScreen() {
  const prefs = usePreferencesStore.getState();
  const user = useAuthStore.getState().user;

  const [categories, setCategories] = useState<Category[]>(prefs.categories);
  const [notificationsEnabled, setNotificationsEnabled] = useState(prefs.notificationsEnabled);
  const [locationEnabled, setLocationEnabled] = useState(prefs.locationEnabled);
  const [biometricEnabled, setBiometricEnabled] = useState(prefs.biometricEnabled);

  const [permStatuses, setPermStatuses] = useState<Record<string, PermissionStatus>>({
    camera: 'undetermined',
    location: 'undetermined',
    notifications: 'undetermined',
  });

  useEffect(() => {
    Promise.all([
      getStatus('camera'),
      getStatus('location'),
      getStatus('notifications'),
    ]).then(([camera, location, notifications]) => {
      setPermStatuses({ camera, location, notifications });
    });
  }, []);

  function toggleCategory(cat: Category) {
    const updated = categories.includes(cat)
      ? categories.filter((c) => c !== cat)
      : [...categories, cat];
    setCategories(updated);
    usePreferencesStore.getState().setCategories(updated);
  }

  async function handleNotificationsToggle(val: boolean) {
    setNotificationsEnabled(val);
    usePreferencesStore.getState().setNotificationsEnabled(val);
    if (val) {
      await registerNotifications();
    } else {
      await cancelScheduled();
    }
  }

  function handleLocationToggle(val: boolean) {
    setLocationEnabled(val);
    usePreferencesStore.getState().setLocationEnabled(val);
  }

  function handleBiometricToggle(val: boolean) {
    setBiometricEnabled(val);
    usePreferencesStore.getState().setBiometricEnabled(val);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.userEmail}>{user?.email ?? 'Not signed in'}</Text>
        {user?.displayName && <Text style={styles.userName}>{user.displayName}</Text>}
      </View>

      {/* Category preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <View style={styles.chips}>
          {ALL_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, categories.includes(cat) && styles.chipActive]}
              onPress={() => toggleCategory(cat)}
              accessibilityLabel={`${categories.includes(cat) ? 'Deselect' : 'Select'} ${cat} category`}
              accessibilityRole="checkbox"
            >
              <Text style={[styles.chipText, categories.includes(cat) && styles.chipTextActive]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Toggles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationsToggle}
            accessibilityLabel="Toggle notifications"
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Location</Text>
          <Switch
            value={locationEnabled}
            onValueChange={handleLocationToggle}
            accessibilityLabel="Toggle location"
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Biometric Login</Text>
          <Switch
            value={biometricEnabled}
            onValueChange={handleBiometricToggle}
            accessibilityLabel="Toggle biometric login"
          />
        </View>
      </View>

      {/* Permission status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Permissions</Text>
        <PermissionBadge label="Camera" status={permStatuses['camera'] as PermissionStatus} />
        <PermissionBadge label="Location" status={permStatuses['location'] as PermissionStatus} />
        <PermissionBadge label="Notifications" status={permStatuses['notifications'] as PermissionStatus} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  section: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: 12 },
  userEmail: { fontSize: 16, fontWeight: '600' },
  userName: { fontSize: 14, color: '#666', marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 14, color: '#333' },
  chipTextActive: { color: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', minHeight: 44 },
  rowLabel: { fontSize: 16 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', minHeight: 44, flexWrap: 'wrap', gap: 8 },
  badgeLabel: { fontSize: 16, flex: 1 },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  badgeStatus: { fontSize: 14, fontWeight: '500' },
  settingsLink: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  settingsLinkText: { color: '#007AFF', fontSize: 13 },
});
