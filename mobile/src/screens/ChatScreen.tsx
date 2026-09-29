import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useCall } from '../context/CallContext';
import { User, Message } from '../types';
import { Avatar } from '../components/Avatar';
import { MessageBubble } from '../components/MessageBubble';
import { colors } from '../theme/colors';

interface ChatScreenProps {
  route: {
    params: {
      conversationId: string;
      partner: User;
    };
  };
  navigation: any;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const { conversationId, partner } = route.params;
  const { user } = useAuth();
  const {
    messages,
    loadingMessages,
    loadMessagesForConversation,
    sendMessage,
    markMessageRead,
    setTyping,
    isUserOnline,
    typingUsers,
  } = useChat();
  const { startCall } = useCall();

  const [inputContent, setInputContent] = useState('');
  const [sending, setSending] = useState(false);
  const typingTimerRef = useRef<any>(null);
  const flatListRef = useRef<FlatList<Message>>(null);

  const conversationMessages = messages[conversationId] || [];
  const online = isUserOnline(partner.id) || partner.isOnline;
  const typingList = typingUsers[conversationId] || [];
  const isPartnerTyping = typingList.length > 0;

  // Load conversation messages on mount
  useEffect(() => {
    loadMessagesForConversation(conversationId);
  }, [conversationId]);

  // Mark incoming unread messages as read
  useEffect(() => {
    conversationMessages.forEach((msg) => {
      if (msg.sender.id !== user?.id && msg.status !== 'read') {
        markMessageRead(conversationId, msg.id);
      }
    });
  }, [conversationMessages, user?.id, conversationId]);

  // Scroll to bottom when message arrives
  useEffect(() => {
    if (conversationMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversationMessages.length]);

  const handleInputChange = (txt: string) => {
    setInputContent(txt);

    // Typing start
    setTyping(conversationId, true);

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimerRef.current = setTimeout(() => {
      setTyping(conversationId, false);
    }, 2000);
  };

  const handleSend = async () => {
    const text = inputContent.trim();
    if (!text || sending) return;

    setInputContent('');
    setTyping(conversationId, false);
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    setSending(true);
    try {
      await sendMessage(conversationId, text, 'text');
    } catch (err) {
      console.warn('[ChatScreen] Send error:', err);
    } finally {
      setSending(false);
    }
  };

  const getSubtitle = () => {
    if (isPartnerTyping) {
      return 'typing...';
    }
    if (online) {
      return 'Active now';
    }
    if (partner.lastSeen) {
      try {
        const d = new Date(partner.lastSeen);
        return `Last seen ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } catch {
        return 'Offline';
      }
    }
    return 'Offline';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Chat Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileHeaderBtn}
          activeOpacity={0.8}
        >
          <Avatar
            uri={partner.avatar}
            name={partner.displayName || partner.username}
            size={42}
            isOnline={online}
            showBadge={true}
          />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.partnerName} numberOfLines={1}>
              {partner.displayName || partner.username}
            </Text>
            <Text
              style={[
                styles.partnerStatus,
                isPartnerTyping
                  ? styles.partnerStatusTyping
                  : online
                  ? styles.partnerStatusOnline
                  : null,
              ]}
            >
              {getSubtitle()}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Action icons for audio & video call */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerCallBtn}
            onPress={() => startCall(partner, 'audio', conversationId)}
          >
            <Text style={styles.headerCallIcon}>📞</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerCallBtn}
            onPress={() => startCall(partner, 'video', conversationId)}
          >
            <Text style={styles.headerCallIcon}>📹</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Message List */}
      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loadingMessages && conversationMessages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={conversationMessages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isMine={item.sender.id === user?.id}
              />
            )}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <Text style={styles.emptyEmoji}>👋</Text>
                <Text style={styles.emptyTitle}>
                  Say hello to {partner.displayName || partner.username}!
                </Text>
                <Text style={styles.emptySubtitle}>
                  This is the start of your direct conversation.
                </Text>
              </View>
            }
          />
        )}

        {/* Real-time typing bubble */}
        {isPartnerTyping && (
          <View style={styles.typingBanner}>
            <Text style={styles.typingBannerText}>
              ✍️ {partner.displayName || partner.username} is typing...
            </Text>
          </View>
        )}

        {/* Composer Input Bar */}
        <View style={styles.composerBar}>
          <TextInput
            style={styles.composerInput}
            value={inputContent}
            onChangeText={handleInputChange}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              !inputContent.trim() && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputContent.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.sendBtnText}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 8,
    marginRight: 4,
  },
  backBtnText: {
    color: colors.primaryLight,
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileHeaderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleContainer: {
    marginLeft: 10,
    flex: 1,
  },
  partnerName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  partnerStatus: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  partnerStatusOnline: {
    color: colors.online,
    fontWeight: '600',
  },
  partnerStatusTyping: {
    color: colors.primaryLight,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  headerCallBtn: {
    padding: 8,
    backgroundColor: colors.bgCardLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerCallIcon: {
    fontSize: 18,
  },
  chatArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingVertical: 12,
  },
  emptyMessages: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 30,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  typingBanner: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  typingBannerText: {
    color: colors.secondaryLight,
    fontSize: 12,
    fontStyle: 'italic',
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  composerInput: {
    flex: 1,
    backgroundColor: colors.bgInput,
    color: colors.textPrimary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  sendBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
