import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/api.types';
import { setTokenCache } from '../api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;

  setAuth: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

const TOKEN_KEY = 'washgo_token';
const USER_KEY = 'washgo_user';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuth: async (user, token) => {
    setTokenCache(token);
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, token, isLoading: false });
  },

  logout: async () => {
    setTokenCache(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    set({ user: null, token: null, isLoading: false });
  },

  loadFromStorage: async () => {
    try {
      const [token, userStr] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);
      if (token && userStr) {
        setTokenCache(token);
        set({ token, user: JSON.parse(userStr), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));