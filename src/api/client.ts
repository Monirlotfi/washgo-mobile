import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.46.178.40:3000/api/v1';
// const API_URL = 'https://primarily-disabled-casing.ngrok-free.dev/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur : ajoute automatiquement le token JWT
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('washgo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur : si 401, on déconnecte
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['washgo_token', 'washgo_user']);
    }
    return Promise.reject(error);
  },
);
