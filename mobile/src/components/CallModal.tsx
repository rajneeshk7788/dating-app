import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useCall } from '../context/CallContext';
import { Avatar } from './Avatar';
import { colors } from '../theme/colors';

export const CallModal: React.FC = () => {
  const {
    callState,
    callPartner,
    callType,
    duration,
    isMuted,
    isVideoEnabled,
    isSpeakerOn,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
  } = useCall();

  if (callState === 'idle' || !callPartner) {
    return null;
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusLabel = () => {
    switch (callState) {
      case 'incoming':
        return `Incoming ${callType === 'video' ? 'Video' : 'Audio'} Call...`;
      case 'calling':
        return `Calling ${callPartner.displayName || callPartner.username}...`;
      case 'connected':
        return formatDuration(duration);
      case 'ended':
        return 'Call Ended';
      default:
        return '';
    }
  };

  return (
    <Modal visible={true} animationType="slide" transparent={false}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        {/* Top Header info */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>ConnectPulse</Text>
          <View style={styles.callTypeBadge}>
            <Text style={styles.callTypeText}>
              {callType === 'video' ? '📹 Video Call' : '📞 Voice Call'}
            </Text>
          </View>
        </View>

        {/* Center Partner Profile */}
        <View style={styles.centerSection}>
          <View style={styles.avatarGlow}>
            <Avatar
              uri={callPartner.avatar}
              name={callPartner.displayName || callPartner.username}
              size={120}
              isOnline={true}
            />
          </View>

          <Text style={styles.partnerName}>
            {callPartner.displayName || callPartner.username}
          </Text>
          {callPartner.statusMessage ? (
            <Text style={styles.statusMessage} numberOfLines={1}>
              {callPartner.statusMessage}
            </Text>
          ) : null}

          <Text
            style={[
              styles.callStatus,
              callState === 'connected' && styles.callStatusConnected,
            ]}
          >
            {getStatusLabel()}
          </Text>
        </View>

        {/* Action Controls */}
        <View style={styles.controlsSection}>
          {callState === 'incoming' ? (
            <View style={styles.incomingButtonsRow}>
              {/* Decline Button */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.declineBtn]}
                onPress={rejectCall}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnIcon}>✕</Text>
                <Text style={styles.actionBtnLabel}>Decline</Text>
              </TouchableOpacity>

              {/* Accept Button */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.acceptBtn]}
                onPress={acceptCall}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnIcon}>✓</Text>
                <Text style={styles.actionBtnLabel}>Accept</Text>
              </TouchableOpacity>
            </View>
          ) : callState === 'connected' ? (
            <View style={styles.activeCallContainer}>
              <View style={styles.toolsRow}>
                {/* Mute Button */}
                <TouchableOpacity
                  style={[styles.toolBtn, isMuted && styles.toolBtnActive]}
                  onPress={toggleMute}
                >
                  <Text style={styles.toolIcon}>{isMuted ? '🔇' : '🎙️'}</Text>
                  <Text style={styles.toolLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                </TouchableOpacity>

                {/* Speaker Button */}
                <TouchableOpacity
                  style={[styles.toolBtn, isSpeakerOn && styles.toolBtnActive]}
                  onPress={toggleSpeaker}
                >
                  <Text style={styles.toolIcon}>🔊</Text>
                  <Text style={styles.toolLabel}>Speaker</Text>
                </TouchableOpacity>

                {/* Video Toggle (if video call) */}
                {callType === 'video' && (
                  <TouchableOpacity
                    style={[styles.toolBtn, !isVideoEnabled && styles.toolBtnActive]}
                    onPress={toggleVideo}
                  >
                    <Text style={styles.toolIcon}>{isVideoEnabled ? '📹' : '🚫'}</Text>
                    <Text style={styles.toolLabel}>{isVideoEnabled ? 'Cam Off' : 'Cam On'}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* End Call Button */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.endCallBtn]}
                onPress={endCall}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnIcon}>📞</Text>
                <Text style={styles.actionBtnLabel}>End Call</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Calling or Ended */
            <View style={styles.incomingButtonsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.endCallBtn]}
                onPress={endCall}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnIcon}>✕</Text>
                <Text style={styles.actionBtnLabel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
  },
  appTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  callTypeBadge: {
    marginTop: 8,
    backgroundColor: colors.bgCardLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  callTypeText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  centerSection: {
    alignItems: 'center',
  },
  avatarGlow: {
    padding: 8,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 20,
  },
  partnerName: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
  },
  statusMessage: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 12,
    maxWidth: '80%',
    textAlign: 'center',
  },
  callStatus: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '500',
    marginTop: 4,
  },
  callStatusConnected: {
    color: colors.online,
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: 1.5,
  },
  controlsSection: {
    marginBottom: 24,
  },
  incomingButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  activeCallContainer: {
    alignItems: 'center',
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 32,
  },
  toolBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.bgCardLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolBtnActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primary,
  },
  toolIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  toolLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  actionBtnIcon: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  actionBtnLabel: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  acceptBtn: {
    backgroundColor: colors.callAccept,
  },
  declineBtn: {
    backgroundColor: colors.callReject,
  },
  endCallBtn: {
    backgroundColor: colors.callReject,
  },
});
