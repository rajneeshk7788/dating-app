import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { CallRecord, User } from '../../types';
import { Avatar } from '../../components/Avatar';
import { colors } from '../../theme/colors';

export const CallsTab: React.FC = () => {
  const { user } = useAuth();
  const { callHistory, refreshCallHistory, startCall } = useCall();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshCallHistory();
    setRefreshing(false);
  };

  const formatCallDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return '';
    }
  };

  const formatDuration = (secs: number) => {
    if (!secs) return '0s';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const renderItem = ({ item }: { item: CallRecord }) => {
    const isCaller = item.caller.id === user?.id;
    const partner = isCaller ? item.receiver : item.caller;
    const isMissed = item.status === 'missed' || item.status === 'rejected';

    return (
      <View style={styles.card}>
        <Avatar
          uri={partner?.avatar}
          name={partner?.displayName || partner?.username || 'Unknown'}
          size={50}
        />

        <View style={styles.info}>
          <Text style={styles.partnerName}>
            {partner?.displayName || partner?.username || 'User'}
          </Text>

          <View style={styles.statusRow}>
            <Text
              style={[
                styles.arrowIcon,
                isCaller ? styles.arrowOutgoing : styles.arrowIncoming,
                isMissed && styles.arrowMissed,
              ]}
            >
              {isCaller ? '↗' : '↙'}
            </Text>
            <Text style={[styles.statusText, isMissed && styles.statusMissed]}>
              {item.callType === 'video' ? 'Video' : 'Voice'} •{' '}
              {item.status === 'completed'
                ? formatDuration(item.duration)
                : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>

          <Text style={styles.timeText}>{formatCallDate(item.createdAt)}</Text>
        </View>

        <TouchableOpacity
          style={styles.callBackBtn}
          onPress={() => startCall(partner, item.callType)}
          activeOpacity={0.7}
        >
          <Text style={styles.callBackIcon}>
            {item.callType === 'video' ? '📹' : '📞'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={callHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📞</Text>
            <Text style={styles.emptyTitle}>No call logs yet</Text>
            <Text style={styles.emptySubtitle}>
              Voice and video calls you make or receive will appear here.
            </Text>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    padding: 14,
    borderRadius: 16,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: {
    flex: 1,
    marginLeft: 14,
  },
  partnerName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  arrowIcon: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  arrowOutgoing: {
    color: colors.online,
  },
  arrowIncoming: {
    color: colors.secondaryLight,
  },
  arrowMissed: {
    color: colors.error,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  statusMissed: {
    color: colors.error,
  },
  timeText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  callBackBtn: {
    padding: 10,
    backgroundColor: colors.bgCardLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  callBackIcon: {
    fontSize: 18,
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
    paddingHorizontal: 24,
  },
});
