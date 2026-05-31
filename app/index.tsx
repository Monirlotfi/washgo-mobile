import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../src/stores/auth.store';

export default function Index() {
  const { user, token, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  if (!token || !user) return <Redirect href="/(auth)/login" />;

  if (user.role === 'WASHER') return <Redirect href="/(washer)/dashboard" />;
  if (user.role === 'CLIENT') return <Redirect href="/(client)/home" />;

  // ADMIN ou autre — fallback
  return <Redirect href="/(auth)/login" />;
}