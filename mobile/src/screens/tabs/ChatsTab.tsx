import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Conversation, User } from '../../types';
import { fetchSearchUsers } from '../../services/graphql';
import { Avatar } from '../../components/Avatar';
import { colors } from '../../theme/colors';

interface ChatsTabProps {
  onSelectConversation: (conv: Conversation, partner: User) => void;
  onOpenNewChat: () => void;
  onStartChatWithUser: (user: User) => void;
}

export const ChatsTab: React.FC<ChatsTabProps> = ({
  onSelectConversation,
  onOpenNewChat,
  onStartChatWithUser,
}) => {
  const { user } = useAuth();
  const {
    conversations,
    loadingConversations,
    refreshConversations,
    isUserOnline,
    typingUsers,
  } = useChat();

  const [filterQuery, setFilterQuery] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Load suggested users on mount and when filterQuery changes
  useEffect(() => {
    let isCurrent = true;
    const loadSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const users = await fetchSearchUsers(filterQuery);
        if (isCurrent) {
          // Filter out current user
          const filtered = users.filter((u) => u.id !== user?.id);
          setSuggestedUsers(filtered);
        }
      } catch (err) {
        console.warn('[ChatsTab] Error fetching user suggestions:', err);
      } finally {
        if (isCurrent) setLoadingSuggestions(false);
      }
    };

    const timer = setTimeout(loadSuggestions, filterQuery ? 250 : 0);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [filterQuery, user?.id]);

  const getPartner = (conv: Conversation): User => {
    const partner = conv.participants.find((p) => p.id !== user?.id);
    return (
      partner || {
        id: 'unknown',
        username: 'Unknown',
        email: '',
        displayName: 'User',
        isOnline: false,
      }
    );
  };

  const getUnreadCount = (conv: Conversation): number => {
    if (!user) return 0;
    const item = conv.unreadCounts?.find((u) => u.userId === user.id);
    return item ? item.count : 0;
  };

  const formatLastTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const partner = getPartner(c);
    const searchTarget = `${partner.displayName} ${partner.username}`.toLowerCase();
    return searchTarget.includes(filterQuery.toLowerCase());
  });

  // Filter suggested users to those who don't already have an active conversation
  const newSuggestedUsers = suggestedUsers.filter(
    (sUser) =>
      !conversations.some((conv) =>
        conv.participants.some((p) => p.id === sUser.id)
      )
  );

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const partner = getPartner(item);
    const online = isUserOnline(partner.id) || partner.isOnline;
    const unread = getUnreadCount(item);
    const typing = typingUsers[item.id] || [];
    const isTyping = typing.length > 0;

    return (
      <TouchableOpacity
        style={styles.convCard}
        onPress={() => onSelectConversation(item, partner)}
        activeOpacity={0.7}
      >
        <Avatar
          uri={partner.avatar}
          name={partner.displayName || partner.username}
          size={54}
          isOnline={online}
          showBadge={true}
        />

        <View style={styles.convDetails}>
          <View style={styles.topRow}>
            <Text style={styles.partnerName} numberOfLines={1}>
              {partner.displayName || partner.username}
            </Text>
            <Text style={styles.timeText}>
              {formatLastTime(item.lastMessage?.createdAt || item.updatedAt)}
            </Text>
          </View>

          <View style={styles.bottomRow}>
            {isTyping ? (
              <Text style={styles.typingText}>typing...</Text>
            ) : item.lastMessage ? (
              <Text style={styles.lastMessageText} numberOfLines={1}>
                {item.lastMessage.type === 'call_log'
                  ? `📞 ${item.lastMessage.content}`
                  : item.lastMessage.content}
              </Text>
            ) : (
              <Text style={styles.emptyMessageText}>Started a conversation</Text>
            )}

            {unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCountText}>{unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search chats or find people..."
          placeholderTextColor={colors.textMuted}
          value={filterQuery}
          onChangeText={setFilterQuery}
        />
        {filterQuery ? (
          <TouchableOpacity onPress={() => setFilterQuery('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversationItem}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={loadingConversations}
            onRefresh={refreshConversations}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          filteredConversations.length > 0 ? (
            <Text style={styles.sectionHeader}>Messages</Text>
          ) : undefined
        }
        ListFooterComponent={
          <View style={styles.footerSection}>
            {/* Suggested Connections to Chat With */}
            {(newSuggestedUsers.length > 0 || loadingSuggestions) && (
              <View style={styles.suggestedContainer}>
                <View style={styles.suggestedHeaderRow}>
                  <Text style={styles.suggestedHeaderTitle}>
                    {filterQuery
                      ? `Suggested People (${newSuggestedUsers.length})`
                      : '✨ Start Chatting with Someone'}
                  </Text>
                  <TouchableOpacity onPress={onOpenNewChat}>
                    <Text style={styles.suggestedSeeAll}>View All →</Text>
                  </TouchableOpacity>
                </View>

                {loadingSuggestions && newSuggestedUsers.length === 0 ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading suggestions...</Text>
                  </View>
                ) : (
                  newSuggestedUsers.slice(0, 4).map((sUser) => {
                    const online = isUserOnline(sUser.id) || sUser.isOnline;
                    return (
                      <TouchableOpacity
                        key={sUser.id}
                        style={styles.suggestedCard}
                        onPress={() => onStartChatWithUser(sUser)}
                        activeOpacity={0.7}
                      >
                        <Avatar
                          uri={sUser.avatar}
                          name={sUser.displayName || sUser.username}
                          size={46}
                          isOnline={online}
                          showBadge={true}
                        />

                        <View style={styles.suggestedInfo}>
                          <View style={styles.suggestedNameRow}>
                            <Text style={styles.suggestedName}>
                              {sUser.displayName || sUser.username}
                            </Text>
                            {online ? (
                              <View style={styles.onlinePill}>
                                <Text style={styles.onlinePillText}>Online</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.suggestedHandle}>@{sUser.username}</Text>
                          {sUser.statusMessage ? (
                            <Text style={styles.suggestedStatus} numberOfLines={1}>
                              {sUser.statusMessage}
                            </Text>
                          ) : null}
                        </View>

                        <View style={styles.suggestedChatBtn}>
                          <Text style={styles.suggestedChatBtnText}>💬 Chat</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !loadingConversations ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyTitle}>
                {filterQuery ? 'No existing chats found' : 'No chats started yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {filterQuery
                  ? 'Check the suggestions below or start a new chat.'
                  : 'Connect with people below to start your first conversation!'}
              </Text>
              <TouchableOpacity style={styles.startBtn} onPress={onOpenNewChat}>
                <Text style={styles.startBtnText}>🔍 Search All People</Text>
              </TouchableOpacity>
            </View>
          ) : undefined
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onOpenNewChat}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>✏️</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
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
    fontSize: 14,
    paddingVertical: 10,
  },
  clearIcon: {
    color: colors.textMuted,
    fontSize: 14,
    padding: 4,
  },
  sectionHeader: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginVertical: 8,
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  convDetails: {
    flex: 1,
    marginLeft: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  partnerName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageText: {
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  emptyMessageText: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
    flex: 1,
  },
  typingText: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCountText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  footerSection: {
    marginTop: 16,
  },
  suggestedContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  suggestedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  suggestedHeaderTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestedSeeAll: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  suggestedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCardLight,
    padding: 10,
    borderRadius: 14,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestedInfo: {
    flex: 1,
    marginLeft: 10,
  },
  suggestedNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestedName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  onlinePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.online,
  },
  onlinePillText: {
    color: colors.online,
    fontSize: 9,
    fontWeight: '700',
  },
  suggestedHandle: {
    color: colors.primaryLight,
    fontSize: 11,
    marginTop: 1,
  },
  suggestedStatus: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  suggestedChatBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  suggestedChatBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    marginBottom: 16,
  },
  startBtn: {
    backgroundColor: colors.bgCardLight,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  startBtnText: {
    color: colors.primaryLight,
    fontWeight: '700',
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
  },
});
