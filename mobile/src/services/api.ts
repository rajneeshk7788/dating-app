import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthUrl } from '../config';
import { User } from '../types';

export const TOKEN_KEY = '@connectpulse_token';
export const REFRESH_TOKEN_KEY = '@connectpulse_refresh_token';
export const USER_KEY = '@connectpulse_user';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
  displayName: string;
  gender?: string;
  bio?: string;
  avatar?: string;
}

export const getStoredToken = async (): Promise<string | null> => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token || token === 'undefined' || token === 'null' || !token.trim()) return null;
  return token;
};

export const getStoredRefreshToken = async (): Promise<string | null> => {
  const token = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  if (!token || token === 'undefined' || token === 'null' || !token.trim()) return null;
  return token;
};

export const getStoredUser = async (): Promise<User | null> => {
  const data = await AsyncStorage.getItem(USER_KEY);
  if (!data || data === 'undefined' || data === 'null') return null;
  try {
    return JSON.parse(data) as User;
  } catch {
    return null;
  }
};

export const storeAuthSession = async (
  token: string,
  refreshToken: string,
  user: User
): Promise<void> => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuthSession = async (): Promise<void> => {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
};

export const loginApi = async (
  params: LoginParams
): Promise<{ user: User; token: string; refreshToken: string }> => {
  const url = `${getAuthUrl()}/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Login failed');
  }
  const token = json.data.accessToken || json.data.token;
  return {
    user: json.data.user,
    token,
    refreshToken: json.data.refreshToken,
  };
};

export const registerApi = async (
  params: RegisterParams
): Promise<{ user: User; token: string; refreshToken: string }> => {
  const url = `${getAuthUrl()}/register`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Registration failed');
  }
  const token = json.data.accessToken || json.data.token;
  return {
    user: json.data.user,
    token,
    refreshToken: json.data.refreshToken,
  };
};

export const logoutApi = async (): Promise<void> => {
  try {
    const token = await getStoredToken();
    const refreshToken = await getStoredRefreshToken();
    if (token) {
      await fetch(`${getAuthUrl()}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch {
    // Continue even if network error on logout
  } finally {
    await clearAuthSession();
  }
};

export const getMeApi = async (): Promise<User> => {
  const token = await getStoredToken();
  if (!token) throw new Error('No auth token stored');

  const res = await fetch(`${getAuthUrl()}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to fetch current user profile');
  }
  return json.data.user;
};

export const forgotPasswordApi = async (email: string): Promise<string> => {
  const res = await fetch(`${getAuthUrl()}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to process request');
  }
  return json.resetToken || json.message;
};

export const resetPasswordApi = async (
  resetToken: string,
  newPassword: string
): Promise<string> => {
  const res = await fetch(`${getAuthUrl()}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resetToken, newPassword }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to reset password');
  }
  return json.message;
};
