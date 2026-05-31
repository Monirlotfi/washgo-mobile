import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import { useAuthStore } from '../src/stores/auth.store';

const queryClient = new QueryClient();

export default function RootLayout() {
  const router = useRouter();
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const notifReceivedRef = useRef<Notifications.Subscription | null>(null);
  const notifResponseRef = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    loadFromStorage();
  }, []);

  // Listener : notif tapée → deep-link
  useEffect(() => {
    notifResponseRef.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as any;
        console.log('🔔 Notif tapée, data:', data);

        if (data?.bookingId) {
          const userRole = useAuthStore.getState().user?.role;
          if (userRole === 'WASHER') {
            router.push(`/(washer)/booking/${data.bookingId}` as any);
          } else {
            router.push(`/(client)/booking/${data.bookingId}` as any);
          }
        }
      },
    );

    return () => notifResponseRef.current?.remove();
  }, []);

  // Listener : notif reçue en foreground → affichage visible dans l'app
  useEffect(() => {
    notifReceivedRef.current = Notifications.addNotificationReceivedListener(
      (notif) => {
        const { title, body } = notif.request.content;
        console.log('🔔 Notif reçue en foreground:', title);

        // Affiche une alerte native si l'app est ouverte
        // (le banner système peut ne pas s'afficher selon Android/MIUI)
        if (title || body) {
          Alert.alert(
            title ?? '🔔 WashGo',
            body ?? '',
            [{ text: 'OK', style: 'default' }],
            { cancelable: true },
          );
        }
      },
    );

    return () => notifReceivedRef.current?.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(client)" />
          <Stack.Screen name="(washer)" />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}