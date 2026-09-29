import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY_SERVER_URL = '@connectpulse_server_url';

// Default host based on platform:
// Android Emulator maps host machine to 10.0.2.2
// If running on physical Android device, use Wi-Fi IP 192.168.1.5
export const DEFAULT_HOST_EMULATOR = 'http://10.0.2.2:5000';
export const DEFAULT_HOST_WIFI = 'http://192.168.1.5:5000';
export const DEFAULT_HOST_LOCALHOST = 'http://localhost:5000';

const getDefaultServerUrl = (): string => {
  if (Platform.OS === 'android') {
    return DEFAULT_HOST_EMULATOR;
  }
  return DEFAULT_HOST_LOCALHOST;
};

let currentServerUrl = getDefaultServerUrl();

export const getServerUrl = (): string => currentServerUrl;

export const setServerUrl = async (url: string): Promise<void> => {
  let cleaned = url.trim().replace(/\/+$/, '');
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `http://${cleaned}`;
  }
  currentServerUrl = cleaned;
  await AsyncStorage.setItem(STORAGE_KEY_SERVER_URL, cleaned);
};

export const initServerUrl = async (): Promise<string> => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_SERVER_URL);
    if (saved && saved.trim()) {
      currentServerUrl = saved.trim();
    } else {
      currentServerUrl = getDefaultServerUrl();
    }
  } catch {
    currentServerUrl = getDefaultServerUrl();
  }
  return currentServerUrl;
};

export const getApiUrl = (): string => `${getServerUrl()}/api`;
export const getAuthUrl = (): string => `${getServerUrl()}/api/auth`;
export const getGraphQLUrl = (): string => `${getServerUrl()}/graphql`;
export const getSocketUrl = (): string => getServerUrl();
