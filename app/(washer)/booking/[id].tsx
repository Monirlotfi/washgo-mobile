import { useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Pressable,
  Alert, ScrollView, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoogleMaps } from 'expo-maps';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../src/api/client';
import {
  useMarkArrived, useStartWash, useCompleteWash,
  useWasherCancelBooking,
} from '../../../src/hooks/useWasher';
import { Booking } from '../../../src/types/api.types';
import { useLocationTracking } from '../../../src/hooks/useLocationTracking';
import WasherCancelModal from '../../../src/components/WasherCancelModal';

export default function WasherBookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  useLocationTracking(true);

  const booking = useQuery({
    queryKey: ['washer-booking', id],
    queryFn: async () => {
      const res = await apiClient.get<Booking[]>('/washer/bookings');
      return res.data.find((b) => b.id === id) ?? null;
    },
    refetchInterval: 5000,
  });

  const arrived = useMarkArrived();
  const start = useStartWash();
  const complete = useCompleteWash();
  const cancelByWasher = useWasherCancelBooking();
  const [washerCancelVisible, setWasherCancelVisible] = useState(false);

  if (booking.isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#0066FF" />
      </SafeAreaView>
    );
  }

  if (!booking.data) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>Course introuvable</Text>
        <Pressable onPress={() => router.replace('/(washer)/dashboard')}>
          <Text style={styles.link}>Retour au dashboard</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const b = booking.data;

  if (b.status === 'COMPLETED' || b.status === 'CANCELLED') {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={{ fontSize: 60, marginBottom: 16 }}>
          {b.status === 'COMPLETED' ? '✅' : '❌'}
        </Text>
        <Text style={styles.bigTitle}>
          {b.status === 'COMPLETED' ? 'Course terminée !' : 'Course annulée'}
        </Text>
        <Pressable
          style={styles.primaryBtnInline}
          onPress={() => router.replace('/(washer)/dashboard')}
        >
          <Text style={styles.primaryBtnText}>Retour au dashboard</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const onAction = (mutation: any, label: string, confirmText: string) => {
    Alert.alert(label, confirmText, [
      { text: 'Annuler' },
      {
        text: 'Confirmer',
        onPress: () =>
          mutation.mutate(b.id, {
            onError: (err: any) => {
              Alert.alert('Erreur', err.response?.data?.message ?? 'Erreur inconnue');
            },
          }),
      },
    ]);
  };

  const callClient = () => {
    const phone = (b as any).client?.phone;
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable style={styles.topBarBtn} onPress={() => router.replace('/(washer)/dashboard')}>
          <Text style={styles.topBarBtnText}>← Dashboard</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>Course en cours</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <GoogleMaps.View
        style={styles.map}
        cameraPosition={{
          coordinates: { latitude: b.lat, longitude: b.lng },
          zoom: 14,
        }}
        markers={[{
          id: 'client',
          coordinates: { latitude: b.lat, longitude: b.lng },
          title: 'Client',
        }]}
      />

      <ScrollView style={styles.panel} contentContainerStyle={{ paddingBottom: 16 }}>
        <Text style={styles.statusBig}>{statusEmoji(b.status)}</Text>
        <Text style={styles.statusText}>{statusLabel(b.status)}</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Client</Text>
          <Text style={styles.cardValue}>{(b as any).client?.fullName ?? 'Client'}</Text>
          <Pressable onPress={callClient}>
            <Text style={styles.phoneLink}>📞 {(b as any).client?.phone}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Adresse</Text>
          <Text style={styles.cardValue}>{b.addressLabel}</Text>
          <Pressable
            onPress={() =>
              Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`)
            }
          >
            <Text style={styles.phoneLink}>🗺 Naviguer avec Google Maps</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Véhicule</Text>
          <Text style={styles.cardValue}>
            {b.vehicle?.brand} {b.vehicle?.model} · {b.vehicle?.plate}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Prix</Text>
          <Text style={styles.cardValue}>{b.priceMAD / 100} DH (cash)</Text>
        </View>

        {b.notes && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Notes du client</Text>
            <Text style={styles.cardValue}>{b.notes}</Text>
          </View>
        )}

        {b.status === 'AWAITING_CLIENT_CONFIRMATION' && (
          <View style={[styles.card, { backgroundColor: '#FFF8E1' }]}>
            <Text style={[styles.cardLabel, { color: '#996A00' }]}>⏳ En attente</Text>
            <Text style={[styles.cardValue, { color: '#664500' }]}>
              Le client doit confirmer la fin du lavage. Vous serez libéré dès qu'il aura validé.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {b.status === 'ACCEPTED' && (
          <>
            <Pressable
              style={[styles.primaryBtn, arrived.isPending && { opacity: 0.5 }]}
              onPress={() => onAction(arrived, 'Je suis arrivé', 'Vous êtes sur place ?')}
              disabled={arrived.isPending}
            >
              <Text style={styles.primaryBtnText}>📍 Je suis arrivé</Text>
            </Pressable>
            <Pressable style={styles.cancelBtnSecondary} onPress={() => setWasherCancelVisible(true)}>
              <Text style={styles.cancelBtnText}>Annuler (force majeure)</Text>
            </Pressable>
          </>
        )}
        {b.status === 'ARRIVED' && (
          <Pressable
            style={[styles.primaryBtn, start.isPending && { opacity: 0.5 }]}
            onPress={() => onAction(start, 'Démarrer le lavage', 'Commencer maintenant ?')}
            disabled={start.isPending}
          >
            <Text style={styles.primaryBtnText}>🧽 Démarrer le lavage</Text>
          </Pressable>
        )}
        {b.status === 'IN_PROGRESS' && (
          <Pressable
            style={[styles.successBtn, complete.isPending && { opacity: 0.5 }]}
            onPress={() => onAction(complete, 'Terminer le lavage', 'Lavage terminé ?')}
            disabled={complete.isPending}
          >
            <Text style={styles.primaryBtnText}>✅ Terminer le lavage</Text>
          </Pressable>
        )}
      </View>

      <WasherCancelModal
        visible={washerCancelVisible}
        onClose={() => setWasherCancelVisible(false)}
        onConfirm={(reason, customReason) =>
          cancelByWasher.mutate(
            { id: b.id, reason, customReason },
            {
              onSuccess: () => {
                setWasherCancelVisible(false);
                router.replace('/(washer)/dashboard');
              },
              onError: (err: any) => {
                const msg = err.response?.data?.message;
                Alert.alert('Erreur', Array.isArray(msg) ? msg.join('\n') : msg ?? 'Erreur');
              },
            },
          )
        }
        isLoading={cancelByWasher.isPending}
      />
    </SafeAreaView>
  );
}

function statusEmoji(s: string): string {
  return ({ ACCEPTED: '🚗', ARRIVED: '📍', IN_PROGRESS: '🧽', AWAITING_CLIENT_CONFIRMATION: '⏳' } as Record<string, string>)[s] ?? '';
}
function statusLabel(s: string): string {
  return ({
    ACCEPTED: 'En route vers le client', ARRIVED: 'Sur place',
    IN_PROGRESS: 'Lavage en cours', AWAITING_CLIENT_CONFIRMATION: 'En attente confirmation client',
  } as Record<string, string>)[s] ?? s;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  bigTitle: { fontSize: 22, fontWeight: '700', marginBottom: 24 },
  link: { color: '#0066FF', fontWeight: '600', marginTop: 12 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#EEE', backgroundColor: '#fff',
  },
  topBarBtn: { padding: 4 },
  topBarBtnText: { color: '#0066FF', fontWeight: '600', fontSize: 15 },
  topBarTitle: { fontSize: 16, fontWeight: '700' },
  topBarSpacer: { width: 80 },
  map: { flex: 1 },
  panel: {
    maxHeight: 380, paddingHorizontal: 20, paddingTop: 16,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#EEE',
  },
  statusBig: { fontSize: 50, textAlign: 'center', marginBottom: 4 },
  statusText: { textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 16 },
  card: { backgroundColor: '#F4F5F7', padding: 14, borderRadius: 12, marginBottom: 10 },
  cardLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  cardValue: { fontSize: 15, fontWeight: '600' },
  phoneLink: { color: '#0066FF', marginTop: 6, fontWeight: '600' },
  footer: {
    backgroundColor: '#fff', paddingHorizontal: 20,
    paddingTop: 12, paddingBottom: 16,
    borderTopWidth: 1, borderTopColor: '#EEE', gap: 4,
  },
  primaryBtn: { backgroundColor: '#0066FF', padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryBtnInline: {
    backgroundColor: '#0066FF', padding: 14, borderRadius: 12,
    alignItems: 'center', marginTop: 16, paddingHorizontal: 32,
  },
  successBtn: { backgroundColor: '#34C759', padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtnSecondary: { padding: 10, alignItems: 'center', marginTop: 4 },
  cancelBtnText: { color: '#FF3B30', fontWeight: '600', fontSize: 14 },
});