import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';
import { User } from '../../types';
import { fetchSearchUsers } from '../../services/graphql';
import { Avatar } from '../../components/Avatar';
import { colors } from '../../theme/colors';

interface DiscoverTabProps {
  onStartChatWithUser: (user: User) => void;
}

export const DiscoverTab: React.FC<DiscoverTabProps> = ({ onStartChatWithUser }) => {
  const { user: currentUser } = useAuth();
  const { isUserOnline } = useChat();
  const { startCall } = useCall();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const allUsers = await fetchSearchUsers('');
      // Filter out self
      setUsers(allUsers.filter((u) => u.id !== currentUser?.id));
    } catch (err: any) {
      console.warn('[Discover] Load users error:', err);
      setErrorMsg(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentUser]);

  const renderItem = ({ item }: { item: User }) => {
    const online = isUserOnline(item.id) || item.isOnline;

    return (
      <View style={styles.card}>
        {/* Profile Banner / Image */}
        <View style={styles.bannerRow}>
          <Avatar
            uri={item.avatar}
            name={item.displayName || item.username}
            size={76}
            isOnline={online}
            showBadge={true}
          />
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName}>{item.displayName || item.username}</Text>
              {online ? (
                <View style={styles.onlinePill}>
                  <Text style={styles.onlinePillText}>Online</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.username}>@{item.username}</Text>
            {item.gender ? (
              <View style={styles.genderChip}>
                <Text style={styles.genderText}>
                  {item.gender === 'female' ? '👩 Female' : item.gender === 'male' ? '👨 Male' : '✨ ' + item.gender}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Bio / Status Message */}
        {item.statusMessage ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>"{item.statusMessage}"</Text>
          </View>
        ) : null}

        {item.bio ? (
          <Text style={styles.bioText} numberOfLines={2}>
            {item.bio}
          </Text>
        ) : null}

        {/* Quick Connect Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.btnAction, styles.btnChat]}
            onPress={() => onStartChatWithUser(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnIcon}>💬</Text>
            <Text style={styles.btnChatText}>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnAction, styles.btnCall]}
            onPress={() => startCall(item, 'audio')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnIcon}>📞</Text>
            <Text style={styles.btnCallText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnAction, styles.btnVideo]}
            onPress={() => startCall(item, 'video')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnIcon}>📹</Text>
            <Text style={styles.btnVideoText}>Video</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadUsers}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>{errorMsg ? '⚠️' : '👥'}</Text>
              <Text style={styles.emptyTitle}>
                {errorMsg ? 'Connection Error' : 'No new profiles discovered'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {errorMsg || 'Pull down to refresh and see people nearby!'}
              </Text>
              {errorMsg ? (
                <TouchableOpacity style={styles.retryBtn} onPress={loadUsers}>
                  <Text style={styles.retryBtnText}>Tap to Retry</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : undefined
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  displayName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  onlinePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.online,
  },
  onlinePillText: {
    color: colors.online,
    fontSize: 10,
    fontWeight: '700',
  },
  username: {
    color: colors.primaryLight,
    fontSize: 13,
    marginTop: 2,
  },
  genderChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bgCardLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genderText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  statusBox: {
    backgroundColor: colors.bgInput,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  bioText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginVertical: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btnAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  btnIcon: {
    fontSize: 14,
  },
  btnChat: {
    backgroundColor: colors.primary,
    flex: 1.2,
  },
  btnChatText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  btnCall: {
    backgroundColor: colors.bgCardLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnCallText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  btnVideo: {
    backgroundColor: colors.bgCardLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnVideoText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: 14,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
