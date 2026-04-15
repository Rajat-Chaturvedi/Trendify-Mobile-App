// ProfileScreen
// Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 7.5

import React, { useEffect, useState } from 'react';
import {
  View, Text, Switch, TouchableOpacity, TextInput,
  StyleSheet, ScrollView, Linking, ActivityIndicator,
  Alert, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { useAuthStore } from '../../stores/authStore';
import { getStatus } from '../../services/permissionManager';
import { register as registerNotifications, cancelScheduled } from '../../services/notificationService';
import { logout, fetchAndSetProfile } from '../../services/authService';
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

  // Reactive store selectors — re-render automatically when store changes,
  // no manual subscription or useState snapshot needed.
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [categories, setCategories] = useState<Category[]>(() => usePreferencesStore.getState().categories);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => usePreferencesStore.getState().notificationsEnabled);
  const [locationEnabled, setLocationEnabled] = useState(() => usePreferencesStore.getState().locationEnabled);
  const [biometricEnabled, setBiometricEnabled] = useState(() => usePreferencesStore.getState().biometricEnabled);

  const [permStatuses, setPermStatuses] = useState<Record<string, PermissionStatus>>({
    camera: 'undetermined', location: 'undetermined', notifications: 'undetermined',
  });

  // Keep displayName input in sync when the store user changes (e.g. after profile fetch)
  useEffect(() => {
    setDisplayName(user?.displayName ?? '');
  }, [user?.displayName]);

  // If authenticated but profile not yet loaded (e.g. session restored before fetch
  // completed), trigger a fetch now so avatar and display name appear immediately.
  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchAndSetProfile();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    return usePreferencesStore.subscribe((state) => {
      setCategories(state.categories);
      setNotificationsEnabled(state.notificationsEnabled);
      setLocationEnabled(state.locationEnabled);
      setBiometricEnabled(state.biometricEnabled);
    });
  }, []);

  useEffect(() => {
    Promise.all([getStatus('camera'), getStatus('location'), getStatus('notifications')])
      .then(([camera, location, notifications]) => {
        setPermStatuses({ camera, location, notifications });
        // Auto-request camera if undetermined
        if (camera === 'undetermined') {
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const mod = require('expo-camera');
            if (typeof mod.requestCameraPermissionsAsync === 'function') {
              mod.requestCameraPermissionsAsync().then((res: { status: string }) => {
                const status = res.status === 'granted' ? 'granted' : res.status === 'denied' ? 'denied' : 'undetermined';
                setPermStatuses((prev) => ({ ...prev, camera: status as 'granted' | 'denied' | 'undetermined' }));
              });
            }
          } catch { /* expo-camera unavailable */ }
        }
      });
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
        const data = (await res.json()) as { id: string; email: string; displayName?: string; avatarUrl?: string; avatar?: string };
        useAuthStore.setState({
          user: {
            id: data.id,
            email: data.email,
            displayName: data.displayName ?? data.email,
            // Preserve existing avatar if the PATCH response doesn't include one
            avatarUrl: data.avatarUrl ?? data.avatar ?? user?.avatarUrl ?? null,
          },
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

  async function handleAvatarPress() {
    Alert.alert('Profile Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: () => pickAvatar('camera') },
      { text: 'Choose from Library', onPress: () => pickAvatar('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function pickAvatar(source: 'camera' | 'library') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ImagePicker = require('expo-image-picker');
      let result;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Permission needed', 'Photo library permission is required.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true });
      }

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setUploadingAvatar(true);

      // Send as base64 data URI to dedicated avatar endpoint
      const base64 = asset.base64;
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const dataUri = base64 ? `data:${mimeType};base64,${base64}` : null;

      if (!dataUri) {
        Alert.alert('Error', 'Could not read image data.');
        setUploadingAvatar(false);
        return;
      }

      const res = await apiFetch('/users/me/avatar', {
        method: 'POST',
        body: JSON.stringify({ avatar: dataUri }),
      });

      if (res.ok) {
        const data = (await res.json()) as { avatarUrl?: string; avatar?: string };
        useAuthStore.setState((state) => ({
          user: state.user
            ? { ...state.user, avatarUrl: data.avatarUrl ?? data.avatar ?? asset.uri }
            : state.user,
        }));
      } else {
        Alert.alert('Error', 'Could not upload photo.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not upload photo.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          useAuthStore.getState().clearAuth();
        },
      },
    ]);
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        {/* Avatar */}
        <View style={styles.avatarRow}>
          <TouchableOpacity
            onPress={handleAvatarPress}
            accessibilityLabel="Change profile photo"
            accessibilityRole="button"
            style={styles.avatarContainer}
          >
            {uploadingAvatar ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator color="#007AFF" />
              </View>
            ) : user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {(user?.displayName ?? user?.email ?? '?')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditIcon}>📷</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.userInfo}>
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
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setEditingName(true)}
                accessibilityLabel="Edit display name"
                accessibilityRole="button"
                style={styles.nameRow}
              >
                <Text style={styles.userName}>{user?.displayName ?? 'Set display name'}</Text>
                <Text style={styles.editBtnText}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          accessibilityLabel="Sign out"
          accessibilityRole="button"
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
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
          { label: 'Location', value: locationEnabled, onChange: (v: boolean) => { setLocationEnabled(v); usePreferencesStore.getState().setLocationEnabled(v); } },
          { label: 'Biometric Login', value: biometricEnabled, onChange: (v: boolean) => { setBiometricEnabled(v); usePreferencesStore.getState().setBiometricEnabled(v); } },
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
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarContainer: { position: 'relative', marginRight: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E5E5EA', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 28, fontWeight: '700', color: '#007AFF' },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#007AFF', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  avatarEditIcon: { fontSize: 12 },
  userInfo: { flex: 1 },
  userEmail: { fontSize: 14, color: '#8E8E93', marginBottom: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  userName: { fontSize: 17, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  editBtnText: { fontSize: 16 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  nameInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, minHeight: 44 },
  saveBtn: { minWidth: 44, minHeight: 44, backgroundColor: '#007AFF', borderRadius: 8, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  logoutBtn: { minHeight: 44, borderRadius: 8, borderWidth: 1, borderColor: '#FF3B30', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
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
