import { useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Alert, ActivityIndicator,
  ScrollView, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoogleMaps } from 'expo-maps';
import * as Location from 'expo-location';
import { useVehicles } from '../../src/hooks/useVehicles';
import { useCreateBooking, useVehiclePricing } from '../../src/hooks/useBookings';
import { Vehicle, WashType } from '../../src/types/api.types';

const NOTE_CHIPS = [
  'Coffre très sale', 'Produits spécifiques', 'Démontage coussin',
  'Tapis à laver', 'Insectes sur pare-brise',
];

const WASH_TYPES: { value: WashType; label: string; description: string; emoji: string }[] = [
  { value: 'BASIC', label: 'Basique', description: 'Lavage extérieur standard', emoji: '💧' },
  { value: 'PREMIUM', label: 'Premium', description: 'Extérieur + intérieur soigné', emoji: '✨' },
  { value: 'VIP', label: 'VIP', description: 'Service complet, finitions luxe', emoji: '👑' },
];

export default function NewBookingScreen() {
  const router = useRouter();
  const vehicles = useVehicles();
  const createBooking = useCreateBooking();

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [addressLabel, setAddressLabel] = useState<string>('Ma position');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [washType, setWashType] = useState<WashType>('BASIC');
  const [notes, setNotes] = useState('');
  const [locError, setLocError] = useState<string | null>(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  const pricing = useVehiclePricing(selectedVehicle?.id ?? null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocError('Permission de localisation refusée');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      try {
        const [addr] = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (addr) {
          setAddressLabel([addr.street, addr.city].filter(Boolean).join(', ') || 'Ma position');
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (vehicles.data?.length && !selectedVehicle) {
      setSelectedVehicle(vehicles.data[0]);
    }
  }, [vehicles.data]);

  const toggleChip = (chip: string) => {
    setNotes((prev) => {
      const lines = prev.split('\n').filter(Boolean);
      if (lines.includes(chip)) return lines.filter((l) => l !== chip).join('\n');
      return [...lines, chip].join('\n');
    });
  };

  const isChipSelected = (chip: string) => notes.split('\n').includes(chip);

  const onConfirm = () => {
    if (!selectedVehicle || !location) return;
    createBooking.mutate(
      {
        vehicleId: selectedVehicle.id,
        addressLabel,
        lat: location.lat,
        lng: location.lng,
        washType,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: (data) => router.replace(`/(client)/booking/${data.booking.id}`),
        onError: (err: any) => {
          const msg = err.response?.data?.message;
          Alert.alert('Erreur', Array.isArray(msg) ? msg.join('\n') : msg ?? 'Erreur inconnue');
        },
      },
    );
  };

  if (locError) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{locError}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!location) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={{ marginTop: 12, color: '#666' }}>Récupération de votre position...</Text>
      </SafeAreaView>
    );
  }

  // ─── ÉTAPE 1 : Carte plein écran ───
  if (!locationConfirmed) {
    return (
      <View style={{ flex: 1 }}>
        <GoogleMaps.View
          style={{ flex: 1 }}
          cameraPosition={{
            coordinates: { latitude: location.lat, longitude: location.lng },
            zoom: 15,
          }}
          markers={[{
            id: 'position',
            coordinates: { latitude: location.lat, longitude: location.lng },
            title: 'Votre position',
          }]}
        />
        <View style={styles.mapOverlayTop}>
          <Pressable style={styles.mapBackBtn} onPress={() => router.back()}>
            <Text style={styles.mapBackText}>← Retour</Text>
          </Pressable>
          <View style={styles.mapTitleCard}>
            <Text style={styles.mapTitleText}>Confirmez votre position</Text>
          </View>
        </View>
        <View style={styles.mapOverlayBottom}>
          <View style={styles.mapAddressCard}>
            <Text style={styles.mapAddressLabel}>📍 Adresse détectée</Text>
            <Text style={styles.mapAddressValue}>{addressLabel}</Text>
          </View>
          <Pressable style={styles.mapConfirmBtn} onPress={() => setLocationConfirmed(true)}>
            <Text style={styles.mapConfirmBtnText}>✅ Confirmer cette position</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── ÉTAPE 2 : Formulaire avec mini map ───
  const currentPrice = pricing.data ? pricing.data[washType] : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => setLocationConfirmed(false)}>
          <Text style={styles.back}>← Position</Text>
        </Pressable>
        <Text style={styles.title}>Nouveau lavage</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }}>
        <View style={styles.miniMapWrapper}>
          <GoogleMaps.View
            style={StyleSheet.absoluteFillObject}
            cameraPosition={{
              coordinates: { latitude: location.lat, longitude: location.lng },
              zoom: 15,
            }}
            markers={[{
              id: 'position',
              coordinates: { latitude: location.lat, longitude: location.lng },
            }]}
            uiSettings={{ scrollGesturesEnabled: false, zoomGesturesEnabled: false }}
          />
          <View style={styles.miniMapBadge}>
            <Text style={styles.miniMapBadgeText}>📍 {addressLabel}</Text>
          </View>
          <Pressable style={styles.changeLocationBtn} onPress={() => setLocationConfirmed(false)}>
            <Text style={styles.changeLocationText}>Modifier</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>1. Choisissez votre véhicule</Text>
          {vehicles.data?.map((v) => (
            <Pressable
              key={v.id}
              style={[styles.vehicleOption, selectedVehicle?.id === v.id && styles.vehicleOptionActive]}
              onPress={() => setSelectedVehicle(v)}
            >
              <Text style={styles.vehicleEmoji}>{categoryEmoji(v.category, v.size)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleName}>{v.brand} {v.model}</Text>
                <Text style={styles.vehiclePlate}>{v.plate}</Text>
              </View>
              <View style={[styles.radio, selectedVehicle?.id === v.id && styles.radioActive]}>
                {selectedVehicle?.id === v.id && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          ))}

          <Text style={styles.sectionTitle}>2. Type de lavage</Text>
          {pricing.isLoading ? <ActivityIndicator /> : (
            WASH_TYPES.map((w) => (
              <Pressable
                key={w.value}
                style={[styles.washTypeCard, washType === w.value && styles.washTypeCardActive]}
                onPress={() => setWashType(w.value)}
              >
                <Text style={styles.washTypeEmoji}>{w.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.washTypeLabel, washType === w.value && styles.washTypeLabelActive]}>
                    {w.label}
                  </Text>
                  <Text style={styles.washTypeDescription}>{w.description}</Text>
                </View>
                <Text style={[styles.washTypePrice, washType === w.value && styles.washTypePriceActive]}>
                  {pricing.data ? `${pricing.data[w.value] / 100} DH` : '-'}
                </Text>
              </Pressable>
            ))
          )}

          <Text style={styles.sectionTitle}>3. Détails (optionnel)</Text>
          <Text style={styles.helpText}>Sélectionnez les options applicables ou écrivez votre demande spécifique.</Text>
          <View style={styles.chipsContainer}>
            {NOTE_CHIPS.map((chip) => (
              <Pressable
                key={chip}
                style={[styles.chip, isChipSelected(chip) && styles.chipActive]}
                onPress={() => toggleChip(chip)}
              >
                <Text style={[styles.chipText, isChipSelected(chip) && styles.chipTextActive]}>
                  {isChipSelected(chip) ? '✓ ' : '+ '}{chip}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.notesInput}
            placeholder="Ajouter une demande spécifique..."
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={500}
          />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>{currentPrice ? `${currentPrice / 100} DH` : '-'}</Text>
        </View>
        <Pressable
          style={[styles.ctaButton, (!selectedVehicle || createBooking.isPending) && { opacity: 0.5 }]}
          onPress={onConfirm}
          disabled={!selectedVehicle || createBooking.isPending}
        >
          <Text style={styles.ctaButtonText}>
            {createBooking.isPending ? 'Envoi...' : 'Commander'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function categoryEmoji(category: string | null, size: string): string {
  if (category === 'CITY_CAR') return '🚗';
  if (category === 'LARGE_VEHICLE') return '🚙';
  if (category === 'MOTORCYCLE') return '🏍️';
  if (size === 'SUV' || size === 'VAN') return '🚙';
  return '🚗';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#FF3B30', fontSize: 16, marginBottom: 12 },
  link: { color: '#0066FF', fontWeight: '600' },
  mapOverlayTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12,
  },
  mapBackBtn: {
    backgroundColor: 'rgba(255,255,255,0.9)', alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  mapBackText: { color: '#0066FF', fontWeight: '600', fontSize: 14 },
  mapTitleCard: {
    backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 16,
    paddingVertical: 10, borderRadius: 12, alignSelf: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  mapTitleText: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  mapOverlayBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 8,
  },
  mapAddressCard: { marginBottom: 16 },
  mapAddressLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  mapAddressValue: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  mapConfirmBtn: { backgroundColor: '#0066FF', padding: 16, borderRadius: 14, alignItems: 'center' },
  mapConfirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  back: { color: '#0066FF', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700' },
  miniMapWrapper: { height: 180, position: 'relative', overflow: 'hidden' },
  miniMapBadge: {
    position: 'absolute', bottom: 10, left: 12, right: 60,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, elevation: 3,
  },
  miniMapBadgeText: { fontSize: 12, color: '#333', fontWeight: '500' },
  changeLocationBtn: {
    position: 'absolute', bottom: 10, right: 12,
    backgroundColor: '#0066FF', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, elevation: 3,
  },
  changeLocationText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 8, marginBottom: 12 },
  helpText: { fontSize: 13, color: '#666', marginBottom: 12 },
  vehicleOption: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    backgroundColor: '#F4F5F7', borderRadius: 12, marginBottom: 8,
    borderWidth: 2, borderColor: 'transparent', gap: 12,
  },
  vehicleOptionActive: { borderColor: '#0066FF', backgroundColor: '#E8F1FF' },
  vehicleEmoji: { fontSize: 28 },
  vehicleName: { fontSize: 15, fontWeight: '600' },
  vehiclePlate: { fontSize: 13, color: '#666', marginTop: 2 },
  washTypeCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    backgroundColor: '#F4F5F7', borderRadius: 12, marginBottom: 8,
    borderWidth: 2, borderColor: 'transparent', gap: 12,
  },
  washTypeCardActive: { borderColor: '#0066FF', backgroundColor: '#E8F1FF' },
  washTypeEmoji: { fontSize: 28 },
  washTypeLabel: { fontSize: 16, fontWeight: '700', color: '#333' },
  washTypeLabelActive: { color: '#0066FF' },
  washTypeDescription: { fontSize: 12, color: '#666', marginTop: 2 },
  washTypePrice: { fontSize: 16, fontWeight: '700', color: '#666' },
  washTypePriceActive: { color: '#0066FF' },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#999', justifyContent: 'center', alignItems: 'center',
  },
  radioActive: { borderColor: '#0066FF' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0066FF' },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#F4F5F7', borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0',
  },
  chipActive: { backgroundColor: '#0066FF', borderColor: '#0066FF' },
  chipText: { fontSize: 13, color: '#333' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  notesInput: {
    backgroundColor: '#F4F5F7', padding: 14, borderRadius: 10,
    fontSize: 14, minHeight: 80, textAlignVertical: 'top',
  },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12,
    paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#EEE',
  },
  totalLabel: { fontSize: 12, color: '#666' },
  totalPrice: { fontSize: 22, fontWeight: '700', color: '#0066FF' },
  ctaButton: { backgroundColor: '#0066FF', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 10 },
  ctaButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});