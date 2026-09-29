import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  DEFAULT_HOST_EMULATOR,
  DEFAULT_HOST_WIFI,
  DEFAULT_HOST_LOCALHOST,
} from '../config';
import { colors } from '../theme/colors';

interface ServerConfigModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ServerConfigModal: React.FC<ServerConfigModalProps> = ({
  visible,
  onClose,
}) => {
  const { serverUrl, updateServerUrl } = useAuth();
  const [urlInput, setUrlInput] = useState<string>(serverUrl);
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(
    null
  );

  const testConnection = async (targetUrl: string) => {
    setTesting(true);
    setTestResult(null);
    try {
      const cleaned = targetUrl.trim().replace(/\/+$/, '');
      const endpoint = `${cleaned.startsWith('http') ? cleaned : `http://${cleaned}`}/api/health`;
      const res = await fetch(endpoint, { method: 'GET' });
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setTestResult({
          ok: true,
          message: `Connected successfully! (${data.service || 'ConnectPulse API'})`,
        });
      } else {
        setTestResult({
          ok: false,
          message: 'Server responded, but health status was not OK.',
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: `Connection failed: ${err.message || 'Cannot reach host'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    await updateServerUrl(urlInput);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Backend Server Settings</Text>
          <Text style={styles.subtitle}>
            Choose or enter the IP where your Node.js backend server is running.
          </Text>

          {/* Quick presets */}
          <Text style={styles.sectionHeader}>Quick Presets:</Text>
          <View style={styles.presetsContainer}>
            <TouchableOpacity
              style={[
                styles.presetBtn,
                urlInput === DEFAULT_HOST_EMULATOR && styles.presetBtnActive,
              ]}
              onPress={() => {
                setUrlInput(DEFAULT_HOST_EMULATOR);
                testConnection(DEFAULT_HOST_EMULATOR);
              }}
            >
              <Text style={styles.presetText}>📱 Android Emulator (10.0.2.2)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.presetBtn,
                urlInput === DEFAULT_HOST_WIFI && styles.presetBtnActive,
              ]}
              onPress={() => {
                setUrlInput(DEFAULT_HOST_WIFI);
                testConnection(DEFAULT_HOST_WIFI);
              }}
            >
              <Text style={styles.presetText}>📶 Wi-Fi LAN (192.168.1.5)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.presetBtn,
                urlInput === DEFAULT_HOST_LOCALHOST && styles.presetBtnActive,
              ]}
              onPress={() => {
                setUrlInput(DEFAULT_HOST_LOCALHOST);
                testConnection(DEFAULT_HOST_LOCALHOST);
              }}
            >
              <Text style={styles.presetText}>💻 Localhost (127.0.0.1)</Text>
            </TouchableOpacity>
          </View>

          {/* Custom Input */}
          <Text style={styles.sectionHeader}>Server URL:</Text>
          <TextInput
            style={styles.input}
            value={urlInput}
            onChangeText={(txt) => {
              setUrlInput(txt);
              setTestResult(null);
            }}
            placeholder="http://10.0.2.2:5000"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Test connection feedback */}
          {testResult && (
            <View
              style={[
                styles.resultBox,
                testResult.ok ? styles.resultBoxSuccess : styles.resultBoxError,
              ]}
            >
              <Text
                style={[
                  styles.resultText,
                  testResult.ok ? styles.resultTextSuccess : styles.resultTextError,
                ]}
              >
                {testResult.message}
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={() => testConnection(urlInput)}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Text style={styles.testBtnText}>Test Server</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Apply & Save</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  sectionHeader: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  presetsContainer: {
    marginBottom: 16,
    gap: 8,
  },
  presetBtn: {
    backgroundColor: colors.bgCardLight,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.bgInput,
  },
  presetText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.bgInput,
    color: colors.textPrimary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  resultBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  resultBoxSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: colors.success,
  },
  resultBoxError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: colors.error,
  },
  resultText: {
    fontSize: 12,
    fontWeight: '500',
  },
  resultTextSuccess: {
    color: colors.success,
  },
  resultTextError: {
    color: colors.error,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  testBtn: {
    flex: 1,
    backgroundColor: colors.bgCardLight,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  testBtnText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  closeBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  closeBtnText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
