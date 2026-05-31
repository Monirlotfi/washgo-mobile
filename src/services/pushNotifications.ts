import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { notificationsApi } from '../api/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Récupère le token Expo avec retry (utile sur Xiaomi/MIUI où FCM
 * met parfois quelques secondes à devenir disponible).
 */
async function getExpoPushTokenWithRetry(
  projectId?: string,
  maxAttempts = 3,
  delayMs = 2000,
): Promise<string | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      return tokenData.data;
    } catch (err: any) {
      const isServiceUnavailable =
        err?.message?.includes('SERVICE_NOT_AVAILABLE') ||
        err?.message?.includes('java.io.IOException');

      if (isServiceUnavailable && attempt < maxAttempts) {
        console.warn(
          `⚠️ FCM indisponible (tentative ${attempt}/${maxAttempts}), retry dans ${delayMs}ms...`,
        );
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }

      // Dernière tentative ou erreur non-FCM : log et abandonne
      if (isServiceUnavailable) {
        console.warn(
          '⚠️ FCM SERVICE_NOT_AVAILABLE après tous les retries.\n' +
          'Sur Xiaomi/MIUI : désactive les restrictions batterie pour Expo Go\n' +
          '(Paramètres → Applis → Expo Go → Éco. batterie → Aucune restriction)',
        );
      } else {
        console.error('Erreur récupération token Expo:', err?.message ?? err);
      }

      return null;
    }
  }
  return null;
}

/**
 * Demande la permission, récupère le token Expo, et l'envoie au backend.
 * Appelé après login.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Configure le channel Android (obligatoire pour Android 8+)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notifications WashGo',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0066FF',
      sound: 'default',
    });
  }

  // Les push ne fonctionnent que sur device physique
  if (!Device.isDevice) {
    console.warn('Push notifications nécessitent un device physique (pas un simulateur)');
    return null;
  }

  // Demande la permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Permission de notifications refusée');
    return null;
  }

  // Récupère le projectId depuis la config Expo
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  // Récupère le token avec retry (gère SERVICE_NOT_AVAILABLE sur Xiaomi)
  const token = await getExpoPushTokenWithRetry(projectId);

  if (!token) {
    // L'app continue normalement sans push — pas bloquant
    return null;
  }

  console.log('🎯 Push token récupéré:', token);

  // Envoie au backend
  try {
    await notificationsApi.registerToken(token);
    console.log('✅ Push token enregistré côté backend');
  } catch (err: any) {
    console.error('Erreur enregistrement token côté backend:', err?.message ?? err);
  }

  return token;
}

/**
 * Désenregistre le token côté backend (appelé au logout).
 */
// Empêche les appels multiples en rafale (reloads Metro en dev)
let isUnregistering = false;

export async function unregisterPushNotifications(): Promise<void> {
  if (isUnregistering) return;
  isUnregistering = true;

  try {
    await notificationsApi.clearToken();
    console.log('✅ Push token retiré côté backend');
  } catch (err: any) {
    console.error('Erreur désinscription token:', err?.message ?? err);
  } finally {
    isUnregistering = false;
  }
}