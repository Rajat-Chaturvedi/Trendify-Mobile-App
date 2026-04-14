// ProfileScreen
// Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 7.5

import React, { useEffect, useState } from 'react';
import {
  View, Text, Switch, TouchableOpacity, TextInput,
  StyleSheet, ScrollView, Linking, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { useAuthStore } from '../../stores/authStore';
import { getStatus } from '../../services/permissionManager';
import { register as registerNotifications, cancelScheduled } from '../../services/notificationService';
import { apiFetch } from '../../api/http';
import type { Category, PermissionStatus } from '../../types/index';

const ALL_CATEGORIES: Category[] = [
  'technology', 'sports', 'finance', 'entertainment', 'health', 'science',
];

function PermissionBadge({ label, status }: { label: string; status: PermissionStatus }) {
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
  const insets = useSafeAreaInsets();
  const prefs = usePreferencesStore.getState();

  const [user, setUser] = useState(useAuthStore.getState().user);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [savingName, setSavingName] = useState(false);

  const [categories, setCategories] = useState<Category[]>(prefs.categories);
  const [notificationsEnabled, setNotificationsEnabled] = useState(prefs.notificationsEnabled);
  const [locationEnabled, setLocationEnabled] = useState(prefs.locationEnabled);
  const [biometricEnabled, setBiometricEnabled] = useState(prefs.biometricEnabled);

  const [permStatuses, setPermStatuses] = useState<Record<string, PermissionStatus>>({
    camera: 'undetermined', location: 'undetermined', notifications: 'undetermined',
  });

  useEffect(() => {
    const unsub = useAuthStore.subscribe((state) => {
      setUser(state.user);
      setDisplayName(state.user?.displayName ?? '');
    });
    return unsub;
  }, []);

  useEffect(() => {
    Promise.all([getStatus('camera'), getStatus('location'), getStatus('notifications')])
      .then(([camera, location, notifications]) => setPermStatuses({ camera, location, notifications }));
  }, []);

  async function handleSaveDisplayName() {
    if (!displayName.trim()) return;
    setSavingName(true);
    try {
      const res = await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      if (res.ok) {
        const data = (await res.json()) as { id: string; email: string; displayName?: string };
        useAuthStore.setState({
          user: { id: data.id, email: data.email, displayName: data.displayName ?? data.email },
        });
        setEditingName(false);
      } else {
        Alert.alert('Error', 'Could not update display name.');
      }
    } catch {
      Alert.alert('Error', 'Could not update display name.');
    } finally {
      setSavingName(false);
    }
  }

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
    if (val) await registerNotifications();
    else await cancelScheduled();
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
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.userEmail}>{user?.email ?? 'Not signed in'}</Text>

        {editingName ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.nameInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Display name"
              autoFocus
              accessibilityLabel="Display name input"
            />
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveDisplayName}
              disabled={savingName}
              accessibilityLabel="Save display name"
              accessibilityRole="button"
            >
              {savingName
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => { setEditingName(false); setDisplayName(user?.displayName ?? ''); }}
              accessibilityLabel="Cancel editing"
              accessibilityRole="button"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{user?.displayName ?? 'Set display name'}</Text>
            <TouchableOpacity
              onPress={() => setEditingName(true)}
              accessibilityLabel="Edit display name"
              accessibilityRole="button"
              style={styles.editBtn}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Interests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <View style={styles.chips}>
          {ALL_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, categories.includes(cat) && styles.chipActive]}
              onPress={() => toggleCategory(cat)}
              accessibilityLabel={`${categories.includes(cat) ? 'Deselect' : 'Select'} ${cat}`}
              accessibilityRole="checkbox"
            >
              <Text style={[styles.chipText, categories.includes(cat) && styles.chipTextActive]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        {[
          { label: 'Notifications', value: notificationsEnabled, onChange: handleNotificationsToggle },
          { label: 'Location', value: locationEnabled, onChange: handleLocationToggle },
          { label: 'Biometric Login', value: biometricEnabled, onChange: handleBiometricToggle },
        ].map(({ label, value, onChange }) => (
          <View key={label} style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Switch value={value} onValueChange={onChange} accessibilityLabel={`Toggle ${label}`} />
          </View>
        ))}
      </View>

      {/* Permissions */}
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
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 16, paddingBottom: 32 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  userEmail: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  userName: { fontSize: 14, color: '#555', flex: 1 },
  editBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'flex-end' },
  editBtnText: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
  editRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  nameInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, minHeight: 44 },
  saveBtn: { minWidth: 44, minHeight: 44, backgroundColor: '#007AFF', borderRadius: 8, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  cancelBtn: { minWidth: 44, minHeight: 44, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { color: '#8E8E93', fontSize: 14 },
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
