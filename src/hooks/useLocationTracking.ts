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
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      lastLocationRef.current = null;
      return;
    }

    let active = true;

    const sendLocation = async () => {
      if (sendingRef.current) return;
      sendingRef.current = true;
      try {
        //const pos = await Location.getCurrentPositionAsync({
        //  accuracy: Location.Accuracy.High,
        //});
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!active) return;

        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        const last = lastLocationRef.current;

        // N'envoie que si la position a changé de plus de 50m
        if (last) {
          const R = 6371000;
          const dLat = ((newLat - last.lat) * Math.PI) / 180;
          const dLng = ((newLng - last.lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((last.lat * Math.PI) / 180) *
              Math.cos((newLat * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
          const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          if (dist < 50) return; // pas de changement significatif
        }

        lastLocationRef.current = { lat: newLat, lng: newLng };
        await washerApi.updateLocation(newLat, newLng);
      } catch (e) {
        console.warn('Location update failed:', e);
      } finally {
        sendingRef.current = false;
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