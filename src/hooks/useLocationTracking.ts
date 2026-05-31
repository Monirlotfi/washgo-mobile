import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { washerApi } from '../api/washer';

const TRACKING_INTERVAL_MS = 15000; // envoie position toutes les 15s

/**
 * Démarre le tracking GPS quand `enabled` est true.
 * Envoie la position au backend toutes les 15 secondes.
 */
export function useLocationTracking(enabled: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    let active = true;

    const sendLocation = async () => {
      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        if (!active) return;
        await washerApi.updateLocation(pos.coords.latitude, pos.coords.longitude);
      } catch (e) {
        console.warn('Location update failed:', e);
      }
    };

    // Envoie immédiatement la première position
    sendLocation();

    // Puis toutes les 15s
    intervalRef.current = setInterval(sendLocation, TRACKING_INTERVAL_MS);

    return () => {
      active = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled]);
}