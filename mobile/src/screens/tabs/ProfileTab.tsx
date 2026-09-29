import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { mutateUpdateProfile } from '../../services/graphql';
import { Avatar } from '../../components/Avatar';
import { ServerConfigModal } from '../../components/ServerConfigModal';
import { colors } from '../../theme/colors';

export const ProfileTab: React.FC = () => {
  const { user, refreshUser, logout, serverUrl } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [statusMessage, setStatusMessage] = useState(user?.statusMessage || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [serverModalVisible, setServerModalVisible] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await mutateUpdateProfile({
        displayName,
        statusMessage,
        bio,
      });
      await refreshUser();
      Alert.alert('Profile Saved', 'Your profile details have been updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of ConnectPulse?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header Card */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarWrapper}>
          <Avatar
            uri={user.avatar}
            name={user.displayName || user.username}
            size={90}
            isOnline={true}
            showBadge={true}
          />
        </View>

        <Text style={styles.displayName}>{user.displayName || user.username}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>

        <View style={styles.genderBadge}>
          <Text style={styles.genderBadgeText}>
            {user.gender === 'female'
              ? '👩 Female'
              : user.gender === 'male'
              ? '👨 Male'
              : '✨ Non-binary'}
          </Text>
        </View>
      </View>

      {/* Edit Profile Form */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Edit Profile</Text>

        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Display Name"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Status Message / Vibe</Text>
        <TextInput
          style={styles.input}
          value={statusMessage}
          onChangeText={setStatusMessage}
          placeholder="e.g. Ready for great conversations! ✨"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>About Me (Bio)</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="Write a few lines about yourself..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveProfile}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save Profile Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* App & Server Config */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Backend Connection</Text>
        <Text style={styles.configInfo}>
          Active Server: <Text style={styles.configHighlight}>{serverUrl}</Text>
        </Text>
        <TouchableOpacity
          style={styles.configBtn}
          onPress={() => setServerModalVisible(true)}
        >
          <Text style={styles.configBtnText}>⚙️ Change Server IP / Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Log Out</Text>
      </TouchableOpacity>

      <ServerConfigModal
        visible={serverModalVisible}
        onClose={() => setServerModalVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  avatarWrapper: {
    marginBottom: 12,
  },
  displayName: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  username: {
    color: colors.primaryLight,
    fontSize: 14,
    marginTop: 2,
  },
  email: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  genderBadge: {
    marginTop: 10,
    backgroundColor: colors.bgCardLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genderBadgeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  bioInput: {
    height: 70,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  configInfo: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 12,
  },
  configHighlight: {
    color: colors.primaryLight,
    fontWeight: '600',
  },
  configBtn: {
    backgroundColor: colors.bgCardLight,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  configBtnText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutBtnText: {
    color: colors.error,
    fontWeight: '700',
    fontSize: 15,
  },
});
