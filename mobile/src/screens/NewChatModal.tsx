import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { User } from '../types';
import { fetchSearchUsers } from '../services/graphql';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { Avatar } from '../components/Avatar';
import { colors } from '../theme/colors';

interface NewChatModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  visible,
  onClose,
  onSelectUser,
}) => {
  const { user: currentUser } = useAuth();
  const { isUserOnline } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const performSearch = async (queryText: string) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const results = await fetchSearchUsers(queryText);
      const filtered = results.filter((u) => u.id !== currentUser?.id);
      setUsers(filtered);
    } catch (err: any) {
      console.warn('[SearchUsers] Error:', err);
      setErrorMessage(
        err.message || 'Could not load users. Please check your backend connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setUsers([]);
      return;
    }

    // When modal opens, load initial suggestions immediately without delay
    if (!searchQuery.trim()) {
      performSearch('');
      return;
    }

    // Debounce when user is actively typing
    const debounce = setTimeout(() => {
      performSearch(searchQuery);
    }, 250);

    return () => clearTimeout(debounce);
  }, [searchQuery, visible, currentUser?.id]);

  const renderItem = ({ item }: { item: User }) => {
    const online = isUserOnline(item.id) || item.isOnline;

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => {
          onClose();
          onSelectUser(item);
        }}
        activeOpacity={0.7}
      >
        <Avatar
          uri={item.avatar}
          name={item.displayName || item.username}
          size={52}
          isOnline={online}
          showBadge={true}
        />

        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{item.displayName || item.username}</Text>
            {online ? (
              <View style={styles.onlinePill}>
                <Text style={styles.onlinePillText}>Online</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.userHandle}>@{item.username}</Text>
          {item.statusMessage ? (
            <Text style={styles.statusMsg} numberOfLines={1}>
              {item.statusMessage}
            </Text>
          ) : item.bio ? (
            <Text style={styles.statusMsg} numberOfLines={1}>
              {item.bio}
            </Text>
          ) : null}
        </View>

        <View style={styles.chatButton}>
          <Text style={styles.chatButtonText}>💬 Chat</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Search to Chat</Text>
            <Text style={styles.subtitle}>Find people and start conversations</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Type name, username or email..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Section title */}
        {!errorMessage && (
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>
              {searchQuery.trim()
                ? `Results for "${searchQuery}" (${users.length})`
                : '✨ Suggested People to Chat With'}
            </Text>
            {!searchQuery.trim() && (
              <Text style={styles.sectionHeaderSubtitle}>
                Active users ready to connect
              </Text>
            )}
          </View>
        )}

        {/* Error message */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => performSearch(searchQuery)}
            >
              <Text style={styles.retryBtnText}>Tap to Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* User list */}
        {loading && users.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Finding suggestions...</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>🔎</Text>
                  <Text style={styles.emptyTitle}>No matching users found</Text>
                  <Text style={styles.emptySubtitle}>
                    Try searching for another name like "Bob" or "Alice".
                  </Text>
                </View>
              ) : undefined
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.bgCardLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeText: {
    color: colors.primaryLight,
    fontSize: 14,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    paddingVertical: 10,
  },
  clearSearch: {
    color: colors.textMuted,
    fontSize: 16,
    padding: 4,
  },
  sectionHeaderRow: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  sectionHeaderTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeaderSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: colors.error,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    padding: 12,
    borderRadius: 16,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  onlinePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.online,
  },
  onlinePillText: {
    color: colors.online,
    fontSize: 10,
    fontWeight: '700',
  },
  userHandle: {
    color: colors.primaryLight,
    fontSize: 12,
    marginTop: 1,
  },
  statusMsg: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  chatButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  chatButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});
