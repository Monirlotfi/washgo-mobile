import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Pressable, Alert,
  ScrollView, FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';

import {
  useBooking, useCancelBooking, useConfirmCompletion,
} from '../../../src/hooks/useBookings';
import { useRateBooking } from '../../../src/hooks/useRatings';
import { useBookingOffers, useChooseOffer } from '../../../src/hooks/useOffers';
import CancelBookingModal from '../../../src/components/CancelBookingModal';
import RateBookingModal from '../../../src/components/RateBookingModal';
import StarRating from '../../../src/components/StarRating';
import OfferCard from '../../../src/components/OfferCard';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const booking = useBooking(id);
  const cancel = useCancelBooking();
  const confirm = useConfirmCompletion();
  const rate = useRateBooking();
  const chooseOffer = useChooseOffer();

  const isPending = booking.data?.status === 'PENDING';
  const offers = useBookingOffers(id, isPending);

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const ratePromptShown = useRef(false);

  useEffect(() => {
    const b = booking.data;
    if (b && b.status === 'COMPLETED' && !b.rating && !ratePromptShown.current) {
      setRateModalVisible(true);
      ratePromptShown.current = true;
    }
  }, [booking.data?.status, booking.data?.rating]);

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
        <Text>Réservation introuvable</Text>
        <Pressable onPress={() => router.replace('/(client)/home')}>
          <Text style={styles.link}>Retour à l'accueil</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const b = booking.data;

  if (b.status === 'PENDING') {
    return (
      <PendingOffersView
        booking={b}
        offers={offers.data ?? []}
        isLoadingOffers={offers.isLoading}
        onCancel={() => setCancelModalVisible(true)}
        onChoose={(offerId) => {
          chooseOffer.mutate(
            { bookingId: b.id, offerId },
            {
              onError: (err: any) => {
                const msg = err.response?.data?.message;
                Alert.alert('Erreur', Array.isArray(msg) ? msg.join('\n') : msg ?? 'Erreur');
              },
            },
          );
        }}
        isChoosing={chooseOffer.isPending}
        cancelModalVisible={cancelModalVisible}
        setCancelModalVisible={setCancelModalVisible}
        onCancelConfirm={(reason: string, customReason?: string) => {
          cancel.mutate(
            { id: b.id, reason, customReason },
            {
              onSuccess: () => {
                setCancelModalVisible(false);
                router.replace('/(client)/home');
              },
              onError: (err: any) => {
                const msg = err.response?.data?.message;
                Alert.alert('Erreur', Array.isArray(msg) ? msg.join('\n') : msg ?? 'Erreur');
              },
            },
          );
        }}
        isCancelling={cancel.isPending}
        onBack={() => router.replace('/(client)/home')}
      />
    );
  }

  const canCancel = ['ACCEPTED'].includes(b.status);
  const canConfirm = b.status === 'AWAITING_CLIENT_CONFIRMATION';
  const canRate = b.status === 'COMPLETED' && !b.rating;
  const isFinal = ['COMPLETED', 'CANCELLED'].includes(b.status);

  const handleConfirmCompletion = () => {
    Alert.alert(
      'Confirmer la fin du lavage',
      'Le laveur a-t-il bien terminé le lavage de votre véhicule ?',
      [
        { text: 'Pas encore' },
        {
          text: 'Oui, confirmer',
          onPress: () =>
            confirm.mutate(b.id, {
              onError: (err: any) => {
                const msg = err.response?.data?.message;
                Alert.alert('Erreur', Array.isArray(msg) ? msg.join('\n') : msg ?? 'Erreur');
              },
            }),
        },
      ],
    );
  };

  const handleRateSubmit = (score: number, comment?: string) => {
    rate.mutate(
      { bookingId: b.id, score, comment },
      {
        onSuccess: () => setRateModalVisible(false),
        onError: (err: any) => {
          const msg = err.response?.data?.message;
          Alert.alert('Erreur', Array.isArray(msg) ? msg.join('\n') : msg ?? 'Erreur');
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/(client)/home')}>
          <Text style={styles.back}>← Accueil</Text>
        </Pressable>
      </View>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: b.lat,
          longitude: b.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker
          coordinate={{ latitude: b.lat, longitude: b.lng }}
          title="Votre adresse"
        />
        {b.washer?.currentLat && b.washer?.currentLng && (
          <Marker
            coordinate={{
              latitude: b.washer.currentLat,
              longitude: b.washer.currentLng,
            }}
            title={b.washer.user.fullName}
          />
        )}
      </MapView>

      <ScrollView style={styles.panel} contentContainerStyle={{ paddingBottom: 16 }}>
        <Text style={styles.statusLabel}>{statusEmoji(b.status)}</Text>
        <Text style={styles.status}>{humanStatus(b.status)}</Text>

        {b.status === 'ACCEPTED' && b.estimatedDurationMin !== null && (
          <View style={styles.etaCard}>
            <Text style={styles.etaIcon}>🕐</Text>
            <View>
              <Text style={styles.etaLabel}>Arrivée estimée</Text>
              <Text style={styles.etaValue}>~{b.estimatedDurationMin} min</Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Type de lavage</Text>
          <Text style={styles.cardValue}>{washTypeLabel(b.washType)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Adresse</Text>
          <Text style={styles.cardValue}>{b.addressLabel}</Text>
        </View>

        {b.washer && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Votre laveur</Text>
            <Text style={styles.cardValue}>{b.washer.user.fullName}</Text>
            <Text style={styles.cardDetail}>{b.washer.user.phone}</Text>
            {b.washer.avgRating > 0 && (
              <View style={styles.washerRatingRow}>
                <StarRating value={Math.round(b.washer.avgRating)} size={16} readonly />
                <Text style={styles.washerRatingText}>{b.washer.avgRating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Prix final</Text>
          <Text style={styles.cardValue}>{b.priceMAD / 100} DH (paiement cash)</Text>
        </View>

        {b.notes && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Détails</Text>
            <Text style={styles.cardValue}>{b.notes}</Text>
          </View>
        )}

        {b.rating && (
          <View style={[styles.card, styles.cardRating]}>
            <Text style={styles.cardLabel}>Votre évaluation</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <StarRating value={b.rating.score} size={20} readonly />
              <Text style={styles.cardValue}>{b.rating.score}/5</Text>
            </View>
            {b.rating.comment && (
              <Text style={[styles.cardDetail, { marginTop: 6, fontStyle: 'italic' }]}>
                "{b.rating.comment}"
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {(canConfirm || canCancel || canRate || isFinal) && (
        <View style={styles.footer}>
          {canConfirm && (
            <Pressable
              style={[styles.confirmBtn, confirm.isPending && { opacity: 0.5 }]}
              onPress={handleConfirmCompletion}
              disabled={confirm.isPending}
            >
              <Text style={styles.confirmBtnText}>
                {confirm.isPending ? 'Confirmation...' : '✅ Confirmer la fin du lavage'}
              </Text>
            </Pressable>
          )}
          {canRate && (
            <Pressable style={styles.rateBtn} onPress={() => setRateModalVisible(true)}>
              <Text style={styles.rateBtnText}>⭐ Noter le service</Text>
            </Pressable>
          )}
          {canCancel && (
            <Pressable style={styles.cancelBtn} onPress={() => setCancelModalVisible(true)}>
              <Text style={styles.cancelText}>Annuler la réservation</Text>
            </Pressable>
          )}
          {isFinal && !canRate && (
            <Pressable style={styles.backHomeBtn} onPress={() => router.replace('/(client)/home')}>
              <Text style={styles.backHomeText}>Retour à l'accueil</Text>
            </Pressable>
          )}
        </View>
      )}

      <CancelBookingModal
        visible={cancelModalVisible}
        onClose={() => setCancelModalVisible(false)}
        onConfirm={(reason, customReason) => {
          cancel.mutate(
            { id: b.id, reason, customReason },
            {
              onSuccess: () => {
                setCancelModalVisible(false);
                router.replace('/(client)/home');
              },
              onError: (err: any) => {
                const msg = err.response?.data?.message;
                Alert.alert('Erreur', Array.isArray(msg) ? msg.join('\n') : msg ?? 'Erreur');
              },
            },
          );
        }}
        isLoading={cancel.isPending}
      />

      <RateBookingModal
        visible={rateModalVisible}
        washerName={b.washer?.user.fullName ?? 'votre laveur'}
        onClose={() => setRateModalVisible(false)}
        onSubmit={handleRateSubmit}
        isLoading={rate.isPending}
      />
    </SafeAreaView>
  );
}

function PendingOffersView({
  booking, offers, isLoadingOffers, onChoose, isChoosing,
  cancelModalVisible, setCancelModalVisible, onCancelConfirm, isCancelling, onBack,
}: any) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!booking.expiresAt) return;
    const update = () => {
      const ms = new Date(booking.expiresAt).getTime() - Date.now();
      setSecondsLeft(Math.max(0, Math.floor(ms / 1000)));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [booking.expiresAt]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timerCritical = secondsLeft < 60;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>← Accueil</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Vos offres</Text>
        <View style={{ width: 80 }} />
      </View>

      <View style={[styles.timerCard, timerCritical && styles.timerCardCritical]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.timerLabel}>
            {secondsLeft > 0 ? '⏱ Temps restant pour choisir' : '⏱ Délai expiré'}
          </Text>
          <Text style={[styles.timerValue, timerCritical && styles.timerValueCritical]}>
            {secondsLeft > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : '0:00'}
          </Text>
        </View>
        <Text style={styles.suggestedPriceLabel}>
          Prix suggéré : {booking.priceMAD / 100} DH
        </Text>
      </View>

      <View style={styles.offersHeader}>
        <Text style={styles.offersTitle}>
          {offers.length > 0
            ? `${offers.length} offre${offers.length > 1 ? 's' : ''} reçue${offers.length > 1 ? 's' : ''}`
            : 'Recherche de laveurs...'}
        </Text>
        {offers.length > 0 && <Text style={styles.offersHint}>Triées par prix croissant</Text>}
      </View>

      {isLoadingOffers && offers.length === 0 ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#0066FF" />
        </View>
      ) : offers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>En attente d'offres</Text>
          <Text style={styles.emptyText}>
            Les laveurs disponibles vont vous proposer leur prix.
            Vous pourrez choisir celui qui vous convient.
          </Text>
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          renderItem={({ item }) => (
            <OfferCard
              offer={item}
              suggestedPriceMAD={booking.priceMAD}
              onChoose={() => onChoose(item.id)}
              isLoading={isChoosing}
            />
          )}
        />
      )}

      <View style={styles.footer}>
        <Pressable style={styles.cancelBtn} onPress={() => setCancelModalVisible(true)}>
          <Text style={styles.cancelText}>Annuler la commande</Text>
        </Pressable>
      </View>

      <CancelBookingModal
        visible={cancelModalVisible}
        onClose={() => setCancelModalVisible(false)}
        onConfirm={onCancelConfirm}
        isLoading={isCancelling}
      />
    </SafeAreaView>
  );
}

function humanStatus(s: string): string {
  return ({
    PENDING: "Recherche d'un laveur...",
    ACCEPTED: 'Un laveur a accepté, il est en route.',
    ARRIVED: 'Votre laveur est arrivé !',
    IN_PROGRESS: 'Lavage en cours.',
    AWAITING_CLIENT_CONFIRMATION: "Le laveur a terminé. Confirmez la fin du lavage si tout est OK.",
    COMPLETED: 'Lavage terminé ✅',
    CANCELLED: 'Réservation annulée',
  } as Record<string, string>)[s] ?? s;
}
function statusEmoji(s: string): string {
  return ({
    PENDING: '🔍', ACCEPTED: '🚗', ARRIVED: '📍',
    IN_PROGRESS: '🧽', AWAITING_CLIENT_CONFIRMATION: '⏳',
    COMPLETED: '✅', CANCELLED: '❌',
  } as Record<string, string>)[s] ?? '';
}
function washTypeLabel(w: string): string {
  return ({ BASIC: '💧 Basique', PREMIUM: '✨ Premium', VIP: '👑 VIP' } as Record<string, string>)[w] ?? w;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  back: { color: '#0066FF', fontSize: 16, fontWeight: '600' },
  link: { color: '#0066FF', fontWeight: '600', marginTop: 8 },
  map: { flex: 1 },
  panel: {
    maxHeight: 380, paddingHorizontal: 20, paddingTop: 16,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#EEE',
  },
  statusLabel: { fontSize: 40, textAlign: 'center', marginBottom: 4 },
  status: { textAlign: 'center', fontSize: 16, color: '#333', marginBottom: 16, lineHeight: 22 },
  etaCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F1FF', padding: 14, borderRadius: 12, marginBottom: 12, gap: 12,
  },
  etaIcon: { fontSize: 28 },
  etaLabel: { fontSize: 12, color: '#666' },
  etaValue: { fontSize: 20, fontWeight: '700', color: '#0066FF' },
  card: { backgroundColor: '#F4F5F7', padding: 14, borderRadius: 12, marginBottom: 10 },
  cardRating: { backgroundColor: '#FFF8E1', borderWidth: 1, borderColor: '#FFE082' },
  cardLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  cardValue: { fontSize: 15, fontWeight: '600' },
  cardDetail: { fontSize: 14, color: '#666', marginTop: 2 },
  washerRatingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  washerRatingText: { fontSize: 13, color: '#666', fontWeight: '600' },
  timerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F1FF', padding: 16, margin: 16, borderRadius: 14,
  },
  timerCardCritical: { backgroundColor: '#FFE5E5' },
  timerLabel: { fontSize: 12, color: '#666' },
  timerValue: { fontSize: 24, fontWeight: '700', color: '#0066FF' },
  timerValueCritical: { color: '#C62828' },
  suggestedPriceLabel: { fontSize: 12, color: '#666', textAlign: 'right' },
  offersHeader: { paddingHorizontal: 16, marginBottom: 8 },
  offersTitle: { fontSize: 17, fontWeight: '700' },
  offersHint: { fontSize: 12, color: '#666', marginTop: 2 },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: '#666', textAlign: 'center', lineHeight: 20, fontSize: 14 },
  footer: {
    backgroundColor: '#fff', paddingHorizontal: 20,
    paddingTop: 12, paddingBottom: 16,
    borderTopWidth: 1, borderTopColor: '#EEE', gap: 8,
  },
  confirmBtn: { backgroundColor: '#34C759', padding: 16, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  rateBtn: { backgroundColor: '#FFB400', padding: 16, borderRadius: 12, alignItems: 'center' },
  rateBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: { padding: 14, alignItems: 'center' },
  cancelText: { color: '#FF3B30', fontWeight: '600', fontSize: 15 },
  backHomeBtn: { backgroundColor: '#0066FF', padding: 14, borderRadius: 10, alignItems: 'center' },
  backHomeText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});