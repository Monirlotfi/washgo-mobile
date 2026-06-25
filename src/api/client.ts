import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.17:3000/api/v1';
// const API_URL = 'https://primarily-disabled-casing.ngrok-free.dev/api/v1';

// Cache mémoire du token pour éviter AsyncStorage synchrone à chaque requête
let cachedToken: string | null = null;

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Initialise le cache depuis AsyncStorage au démarrage
export async function initTokenCache(): Promise<void> {
  try {
    cachedToken = await AsyncStorage.getItem('washgo_token');
  } catch {
    cachedToken = null;
  }
}

// Met à jour le cache quand le token change
export function setTokenCache(token: string | null): void {
  cachedToken = token;
}

// Intercepteur : ajoute automatiquement le token JWT (lecture mémoire, pas AsyncStorage)
//apiClient.interceptors.request.use(async (config) => {
//  const token = await AsyncStorage.getItem('washgo_token');
//  if (token) {
//    config.headers.Authorization = `Bearer ${token}`;
//  }
//  return config;
//});
apiClient.interceptors.request.use((config) => {
  if (cachedToken) {
    config.headers.Authorization = `Bearer ${cachedToken}`;
  }
  return config;
});

// Intercepteur : si 401, on déconnecte
//apiClient.interceptors.response.use(
//  (response) => response,
//  async (error) => {
//    if (error.response?.status === 401) {
//      await AsyncStorage.multiRemove(['washgo_token', 'washgo_user']);
//    }
//    return Promise.reject(error);
//  },
//);
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      cachedToken = null;
      await AsyncStorage.multiRemove(['washgo_token', 'washgo_user']);
    }
    return Promise.reject(error);
  },
);
