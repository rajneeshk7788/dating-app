import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { Conversation, User } from '../types';
import { ChatsTab } from './tabs/ChatsTab';
import { DiscoverTab } from './tabs/DiscoverTab';
import { CallsTab } from './tabs/CallsTab';
import { ProfileTab } from './tabs/ProfileTab';
import { NewChatModal } from './NewChatModal';
import { colors } from '../theme/colors';

type TabKey = 'chats' | 'discover' | 'calls' | 'profile';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { conversations, startConversation } = useChat();
  const [activeTab, setActiveTab] = useState<TabKey>('chats');
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);

  // Compute total unread count across all conversations
  const totalUnread = conversations.reduce((acc, conv) => {
    const item = conv.unreadCounts?.find((u) => u.userId === user?.id);
    return acc + (item ? item.count : 0);
  }, 0);

  const handleSelectConversation = (conv: Conversation, partner: User) => {
    navigation.navigate('Chat', {
      conversationId: conv.id,
      partner,
    });
  };

  const handleStartChatWithUser = async (targetUser: User) => {
    try {
      const conv = await startConversation(targetUser.id);
      navigation.navigate('Chat', {
        conversationId: conv.id,
        partner: targetUser,
      });
    } catch (err) {
      console.warn('[HomeScreen] Start chat failed:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top App Header */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <Text style={styles.brandLogo}>💖</Text>
          <Text style={styles.brandText}>ConnectPulse</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerSearchBtn}
            onPress={() => setNewChatModalOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.headerSearchIcon}>🔍 Search</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.newChatHeaderBtn}
            onPress={() => setNewChatModalOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.newChatHeaderIcon}>✏️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Body */}
      <View style={styles.body}>
        {activeTab === 'chats' && (
          <ChatsTab
            onSelectConversation={handleSelectConversation}
            onOpenNewChat={() => setNewChatModalOpen(true)}
            onStartChatWithUser={handleStartChatWithUser}
          />
        )}
        {activeTab === 'discover' && (
          <DiscoverTab onStartChatWithUser={handleStartChatWithUser} />
        )}
        {activeTab === 'calls' && <CallsTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTabBar}>
        {/* Chats Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('chats')}
        >
          <View style={styles.tabIconWrapper}>
            <Text style={[styles.tabIcon, activeTab === 'chats' && styles.tabIconActive]}>
              💬
            </Text>
            {totalUnread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {totalUnread > 99 ? '99+' : totalUnread}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, activeTab === 'chats' && styles.tabLabelActive]}>
            Chats
          </Text>
        </TouchableOpacity>

        {/* Discover (Dating) Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('discover')}
        >
          <Text style={[styles.tabIcon, activeTab === 'discover' && styles.tabIconActive]}>
            💖
          </Text>
          <Text
            style={[styles.tabLabel, activeTab === 'discover' && styles.tabLabelActive]}
          >
            Discover
          </Text>
        </TouchableOpacity>

        {/* Calls Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('calls')}
        >
          <Text style={[styles.tabIcon, activeTab === 'calls' && styles.tabIconActive]}>
            📞
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'calls' && styles.tabLabelActive]}>
            Calls
          </Text>
        </TouchableOpacity>

        {/* Profile Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabIcon, activeTab === 'profile' && styles.tabIconActive]}>
            👤
          </Text>
          <Text
            style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* New Chat Modal */}
      <NewChatModal
        visible={newChatModalOpen}
        onClose={() => setNewChatModalOpen(false)}
        onSelectUser={handleStartChatWithUser}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogo: {
    fontSize: 22,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: colors.bgCardLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerSearchIcon: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  newChatHeaderBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2,
  },
  newChatHeaderIcon: {
    fontSize: 16,
  },
  body: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 10,
    paddingBottom: 14,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapper: {
    position: 'relative',
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.55,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: colors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
