import { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, FlatList, Switch,
  ActivityIndicator, Alert, RefreshControl, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import * as Location from 'expo-location';
import { GoogleMaps } from 'expo-maps';
import { useAuthStore } from '../../src/stores/auth.store';
import {
  useAvailableBookings, useActiveWasherBooking,
} from '../../src/hooks/useWasher';
import { useMyPendingOffers, useMakeOffer } from '../../src/hooks/useOffers';
import { useLocationTracking } from '../../src/hooks/useLocationTracking';
import { washerApi, AvailableBooking } from '../../src/api/washer';
import MakeOfferModal from '../../src/components/MakeOfferModal';

export default function WasherDashboard() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [previewBooking, setPreviewBooking] = useState<AvailableBooking | null>(null);
  const [offerModalBooking, setOfferModalBooking] = useState<AvailableBooking | null>(null);

  const activeBooking = useActiveWasherBooking();
  const availableBookings = useAvailableBookings(isOnline && !activeBooking.data);
  const myOffers = useMyPendingOffers(isOnline && !activeBooking.data);
  const makeOffer = useMakeOffer();

  useLocationTracking(isOnline || !!activeBooking.data);

  const handleToggle = async (value: boolean) => {
    setTogglingStatus(true);
    try {
      if (value) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission requise', 'Vous devez autoriser la géolocalisation pour passer en ligne.');
          setTogglingStatus(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        await washerApi.updateLocation(pos.coords.latitude, pos.coords.longitude);
        await washerApi.setAvailability('AVAILABLE');
        setIsOnline(true);
      } else {
        await washerApi.setAvailability('OFFLINE');
        setIsOnline(false);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message;
      Alert.alert('Erreur', Array.isArray(msg) ? msg.join('\n') : msg ?? 'Impossible');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleSubmitOffer = (priceMAD: number) => {
    if (!offerModalBooking) return;
    makeOffer.mutate(
      { bookingId: offerModalBooking.booking_id, priceMAD },
      {
        onSuccess: () => {
          setOfferModalBooking(null);
          setPreviewBooking(null);
          Alert.alert('✅ Offre envoyée', "Le client va voir votre proposition. Vous serez notifié s'il vous choisit.");
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message;
          Alert.alert('Erreur', Array.isArray(msg) ? msg.join('\n') : msg ?? "Impossible d'envoyer l'offre");
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>Dashboard</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.header}>
        <Text style={styles.welcome}>Bonjour,</Text>
        <Text style={styles.name}>{user?.fullName} 🧽</Text>
      </View>

      {activeBooking.data && (
        <Pressable
          style={styles.activeBanner}
          onPress={() => router.push(`/(washer)/booking/${activeBooking.data!.id}`)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.activeBannerLabel}>{activeBannerLabel(activeBooking.data.status)}</Text>
            <Text style={styles.activeBannerDetail}>{activeBooking.data.addressLabel}</Text>
          </View>
          <Text style={styles.activeBannerArrow}>→</Text>
        </Pressable>
      )}

      <View style={[
        styles.statusCard,
        isOnline && styles.statusCardOnline,
        !!activeBooking.data && styles.statusCardLocked,
      ]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.statusLabel, isOnline && styles.statusLabelOnline]}>
            {activeBooking.data ? '🚗 Course en cours' : isOnline ? '🟢 En ligne' : '⚪ Hors ligne'}
          </Text>
          <Text style={[styles.statusDetail, isOnline && styles.statusDetailOnline]}>
            {activeBooking.data
              ? 'Terminez votre course avant de changer de statut'
              : isOnline ? 'Vous pouvez faire des offres' : 'Activez pour voir les courses'}
          </Text>
        </View>
        {togglingStatus ? (
          <ActivityIndicator color={isOnline ? '#fff' : '#0066FF'} />
        ) : (
          <Switch
            value={isOnline}
            onValueChange={handleToggle}
            disabled={!!activeBooking.data}
            trackColor={{ false: '#ccc', true: '#34C759' }}
            thumbColor="#fff"
          />
        )}
      </View>

      {isOnline && !activeBooking.data && (myOffers.data?.length ?? 0) > 0 && (
        <View style={styles.myOffersBanner}>
          <Text style={styles.myOffersText}>
            ⏳ Vous avez {myOffers.data!.length} offre(s) en cours de validation
          </Text>
          <Pressable onPress={() => router.push('/(washer)/my-offers')}>
            <Text style={styles.myOffersLink}>Voir →</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {activeBooking.data
            ? 'Courses bloquées pendant une course active'
            : `Courses disponibles${availableBookings.data ? ` (${availableBookings.data.length})` : ''}`}
        </Text>

        {activeBooking.data ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Vous pourrez faire de nouvelles offres une fois la course actuelle terminée.
            </Text>
          </View>
        ) : !isOnline ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Passez en ligne pour voir les courses à proximité.</Text>
          </View>
        ) : availableBookings.isLoading ? (
          <ActivityIndicator />
        ) : (availableBookings.data?.length ?? 0) === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Aucune course disponible pour le moment.{'\n'}Restez en ligne, ça arrive ! 💪
            </Text>
          </View>
        ) : (
          <FlatList
            data={availableBookings.data}
            keyExtractor={(b) => b.booking_id}
            refreshControl={
              <RefreshControl
                refreshing={availableBookings.isRefetching}
                onRefresh={() => availableBookings.refetch()}
              />
            }
            renderItem={({ item }) => (
              <Pressable style={styles.bookingCard} onPress={() => setPreviewBooking(item)}>
                 <GoogleMaps.View
                    style={styles.miniMap}
                    cameraPosition={{
                      coordinates: { latitude: item.lat, longitude: item.lng },
                      zoom: 14,
                    }}
                    markers={[{ id: 'booking', coordinates: { latitude: item.lat, longitude: item.lng } }]}
                    uiSettings={{ scrollGesturesEnabled: false, zoomGesturesEnabled: false }}
                  />
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingDistance}>📍 {(item.distance_meters / 1000).toFixed(2)} km</Text>
                  <Text style={styles.bookingPrice}>Suggéré : {item.price_mad / 100} DH</Text>
                </View>
                <Text style={styles.bookingClient}>{item.client_name}</Text>
                <Text style={styles.bookingAddress}>{item.address_label}</Text>
                <Text style={styles.bookingVehicle}>
                  {categoryEmoji(item.vehicle_category, item.vehicle_size)}{' '}
                  {item.vehicle_brand} {item.vehicle_model} · {categoryLabel(item.vehicle_category, item.vehicle_size)}
                </Text>
                <Text style={styles.bookingWashType}>{washTypeLabel(item.wash_type)}</Text>
                <Text style={styles.tapHint}>Tape pour faire une offre →</Text>
              </Pressable>
            )}
          />
        )}
      </View>

      <Modal visible={!!previewBooking} animationType="slide" onRequestClose={() => setPreviewBooking(null)}>
        {previewBooking && (
          <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
            <View style={styles.modalTopBar}>
              <Pressable onPress={() => setPreviewBooking(null)}>
                <Text style={styles.modalClose}>✕ Fermer</Text>
              </Pressable>
              <Text style={styles.modalTitle}>Détails de la course</Text>
              <View style={{ width: 60 }} />
            </View>

            <GoogleMaps.View
              style={styles.modalMap}
              cameraPosition={{
                coordinates: { latitude: previewBooking.lat, longitude: previewBooking.lng },
                zoom: 14,
              }}
              markers={[{
                id: 'client',
                coordinates: { latitude: previewBooking.lat, longitude: previewBooking.lng },
                title: 'Client',
              }]}
            />

            <ScrollView style={styles.modalPanel} contentContainerStyle={{ paddingBottom: 16 }}>
              <View style={styles.modalCard}>
                <Text style={styles.modalLabel}>Distance</Text>
                <Text style={styles.modalValue}>{(previewBooking.distance_meters / 1000).toFixed(2)} km</Text>
              </View>
              <View style={styles.modalCard}>
                <Text style={styles.modalLabel}>Client</Text>
                <Text style={styles.modalValue}>{previewBooking.client_name}</Text>
              </View>
              <View style={styles.modalCard}>
                <Text style={styles.modalLabel}>Adresse</Text>
                <Text style={styles.modalValue}>{previewBooking.address_label}</Text>
              </View>
              <View style={styles.modalCard}>
                <Text style={styles.modalLabel}>Véhicule</Text>
                <Text style={styles.modalValue}>
                  {categoryEmoji(previewBooking.vehicle_category, previewBooking.vehicle_size)}{' '}
                  {previewBooking.vehicle_brand} {previewBooking.vehicle_model}
                </Text>
                <Text style={styles.modalDetail}>
                  {categoryLabel(previewBooking.vehicle_category, previewBooking.vehicle_size)}
                </Text>
              </View>
              <View style={styles.modalCard}>
                <Text style={styles.modalLabel}>Type de lavage</Text>
                <Text style={styles.modalValue}>{washTypeLabel(previewBooking.wash_type)}</Text>
              </View>
              <View style={styles.modalCard}>
                <Text style={styles.modalLabel}>Prix suggéré</Text>
                <Text style={styles.modalValue}>{previewBooking.price_mad / 100} DH</Text>
                <Text style={styles.modalDetail}>
                  Vous pouvez proposer un prix différent (à la baisse ou à la hausse)
                </Text>
              </View>
              {previewBooking.notes && (
                <View style={styles.modalCard}>
                  <Text style={styles.modalLabel}>Notes du client</Text>
                  <Text style={styles.modalValue}>💬 {previewBooking.notes}</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={styles.acceptBigBtn} onPress={() => setOfferModalBooking(previewBooking)}>
                <Text style={styles.acceptBigBtnText}>💰 Faire une offre</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        )}
      </Modal>

      <MakeOfferModal
        visible={!!offerModalBooking}
        suggestedPriceMAD={offerModalBooking?.price_mad ?? 0}
        onClose={() => setOfferModalBooking(null)}
        onConfirm={handleSubmitOffer}
        isLoading={makeOffer.isPending}
      />
    </SafeAreaView>
  );
}

function activeBannerLabel(status: string): string {
  return ({
    ACCEPTED: '🚗 En route vers le client',
    ARRIVED: '📍 Vous êtes sur place',
    IN_PROGRESS: '🧽 Lavage en cours',
    AWAITING_CLIENT_CONFIRMATION: '⏳ En attente confirmation client',
  } as Record<string, string>)[status] ?? 'Course en cours';
}
function categoryLabel(category: string | null, size: string): string {
  if (category === 'CITY_CAR') return 'Citadine / Berline';
  if (category === 'LARGE_VEHICLE') return 'Grande / 4x4 / Pickup';
  if (category === 'MOTORCYCLE') return 'Moto / Quad';
  if (size === 'SUV' || size === 'VAN') return 'Grande / 4x4 / Pickup';
  return 'Citadine / Berline';
}
function categoryEmoji(category: string | null, size: string): string {
  if (category === 'CITY_CAR') return '🚗';
  if (category === 'LARGE_VEHICLE') return '🚙';
  if (category === 'MOTORCYCLE') return '🏍️';
  if (size === 'SUV' || size === 'VAN') return '🚙';
  return '🚗';
}
function washTypeLabel(w: string): string {
  return ({ BASIC: '💧 Basique', PREMIUM: '✨ Premium', VIP: '👑 VIP' } as Record<string, string>)[w] ?? w;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingBottom: 0, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, marginTop: 4,
  },
  menuIcon: { fontSize: 28, color: '#333' },
  topBarTitle: { fontSize: 17, fontWeight: '700' },
  header: { marginBottom: 16, marginTop: 4 },
  welcome: { fontSize: 16, color: '#666' },
  name: { fontSize: 24, fontWeight: '700', marginTop: 2 },
  activeBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0066FF',
    padding: 16, borderRadius: 14, marginBottom: 16,
  },
  activeBannerLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  activeBannerDetail: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  activeBannerArrow: { color: '#fff', fontSize: 24, fontWeight: '700' },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F5F7',
    padding: 18, borderRadius: 16, marginBottom: 16,
  },
  statusCardOnline: { backgroundColor: '#34C759' },
  statusCardLocked: { opacity: 0.55 },
  statusLabel: { fontSize: 18, fontWeight: '700', color: '#333' },
  statusLabelOnline: { color: '#fff' },
  statusDetail: { fontSize: 13, color: '#666', marginTop: 2 },
  statusDetailOnline: { color: 'rgba(255,255,255,0.85)' },
  myOffersBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF8E1', padding: 14, borderRadius: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#FFE082',
  },
  myOffersText: { color: '#996A00', fontSize: 14, fontWeight: '600', flex: 1 },
  myOffersLink: { color: '#0066FF', fontWeight: '700', fontSize: 14 },
  section: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  emptyState: { backgroundColor: '#F9FAFB', padding: 28, borderRadius: 12, alignItems: 'center' },
  emptyText: { color: '#666', textAlign: 'center', lineHeight: 22 },
  bookingCard: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#EEE', overflow: 'hidden',
  },
  miniMap: { width: '100%', height: 120 },
  bookingHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, marginBottom: 4,
  },
  bookingDistance: { fontSize: 14, color: '#666', fontWeight: '500' },
  bookingPrice: { fontSize: 16, fontWeight: '700', color: '#0066FF' },
  bookingClient: { fontSize: 17, fontWeight: '700', paddingHorizontal: 16, marginBottom: 4 },
  bookingAddress: { fontSize: 14, color: '#333', paddingHorizontal: 16, marginBottom: 4 },
  bookingVehicle: { fontSize: 13, color: '#666', paddingHorizontal: 16, marginBottom: 4 },
  bookingWashType: { fontSize: 13, color: '#0066FF', fontWeight: '600', paddingHorizontal: 16, marginBottom: 6 },
  tapHint: { fontSize: 12, color: '#0066FF', fontWeight: '600', paddingHorizontal: 16, paddingBottom: 12 },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  modalClose: { color: '#0066FF', fontWeight: '600', fontSize: 15 },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalMap: { flex: 1 },
  modalPanel: { maxHeight: 350, padding: 16, borderTopWidth: 1, borderTopColor: '#EEE' },
  modalCard: { backgroundColor: '#F4F5F7', padding: 12, borderRadius: 10, marginBottom: 8 },
  modalLabel: { fontSize: 12, color: '#666', marginBottom: 2 },
  modalValue: { fontSize: 15, fontWeight: '600' },
  modalDetail: { fontSize: 13, color: '#666', marginTop: 2 },
  modalFooter: {
    backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12,
    paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#EEE',
  },
  acceptBigBtn: { backgroundColor: '#0066FF', padding: 16, borderRadius: 12, alignItems: 'center' },
  acceptBigBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});