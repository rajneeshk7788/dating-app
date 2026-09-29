import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../types';
import { colors } from '../theme/colors';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMine }) => {
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const isRead = message.status === 'read';

  if (message.type === 'call_log') {
    return (
      <View style={styles.systemBubbleContainer}>
        <View style={styles.systemBubble}>
          <Text style={styles.systemText}>📞 {message.content}</Text>
          <Text style={styles.systemTime}>{formatTime(message.createdAt)}</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.row,
        isMine ? styles.rowMine : styles.rowOther,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleOther,
        ]}
      >
        <Text style={[styles.messageText, isMine ? styles.textMine : styles.textOther]}>
          {message.content}
        </Text>

        <View style={styles.metaRow}>
          <Text style={[styles.timeText, isMine ? styles.timeMine : styles.timeOther]}>
            {formatTime(message.createdAt)}
          </Text>

          {isMine && (
            <Text style={[styles.readStatus, isRead ? styles.readStatusDone : styles.readStatusSent]}>
              {isRead ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    marginVertical: 4,
    paddingHorizontal: 12,
    flexDirection: 'row',
  },
  rowMine: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMine: {
    backgroundColor: colors.bubbleSent,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.bubbleReceived,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  textMine: {
    color: colors.bubbleTextSent,
  },
  textOther: {
    color: colors.bubbleTextReceived,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  timeText: {
    fontSize: 11,
  },
  timeMine: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  timeOther: {
    color: colors.textMuted,
  },
  readStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  readStatusDone: {
    color: '#67E8F9', // Cyan ticks when read
  },
  readStatusSent: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  systemBubbleContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemBubble: {
    backgroundColor: colors.bgCardLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  systemText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  systemTime: {
    color: colors.textMuted,
    fontSize: 10,
  },
});
