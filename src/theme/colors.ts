import { useColorScheme } from 'react-native';

export interface AppColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textPlaceholder: string;
  primary: string;
  danger: string;
  success: string;
  warning: string;
  border: string;
  inputBackground: string;
  textOnPrimary: string;
}

const light: AppColors = {
  background: '#FFFFFF',
  surface: '#F4F5F7',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  textPlaceholder: '#999999',
  primary: '#0066FF',
  danger: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  border: '#DDDDDD',
  inputBackground: '#F4F5F7',
  textOnPrimary: '#FFFFFF',
};

const dark: AppColors = {
  background: '#121212',
  surface: '#1E1E1E',
  card: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  textPlaceholder: '#888888',
  primary: '#4A9FFF',
  danger: '#FF6B6B',
  success: '#30D158',
  warning: '#FF9F0A',
  border: '#333333',
  inputBackground: '#2C2C2C',
  textOnPrimary: '#FFFFFF',
};

export function getColors(scheme: 'light' | 'dark'): AppColors {
  return scheme === 'dark' ? dark : light;
}

export function useColors(): AppColors {
  const scheme = useColorScheme() ?? 'light';
  return getColors(scheme);
}
