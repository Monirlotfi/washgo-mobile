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
import { useColors, AppColors } from '../../src/theme/colors';

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
  const colors = useColors();
  const s = styles(colors);
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
      <SafeAreaView style={s.centered}>
        <Text style={s.errorText}>{locError}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={s.link}>Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!location) {
    return (
      <SafeAreaView style={s.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary }}>Récupération de votre position...</Text>
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
        <View style={s.mapOverlayTop}>
          <Pressable style={s.mapBackBtn} onPress={() => router.back()}>
            <Text style={s.mapBackText}>← Retour</Text>
          </Pressable>
          <View style={s.mapTitleCard}>
            <Text style={s.mapTitleText}>Confirmez votre position</Text>
          </View>
        </View>
        <View style={s.mapOverlayBottom}>
          <View style={s.mapAddressCard}>
            <Text style={s.mapAddressLabel}>📍 Adresse détectée</Text>
            <Text style={s.mapAddressValue}>{addressLabel}</Text>
          </View>
          <Pressable style={s.mapConfirmBtn} onPress={() => setLocationConfirmed(true)}>
            <Text style={s.mapConfirmBtnText}>✅ Confirmer cette position</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── ÉTAPE 2 : Formulaire avec mini map ───
  const currentPrice = pricing.data ? pricing.data[washType] : null;

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <View style={s.header}>
        <Pressable onPress={() => setLocationConfirmed(false)}>
          <Text style={s.back}>← Position</Text>
        </Pressable>
        <Text style={s.title}>Nouveau lavage</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }}>
        <View style={s.miniMapWrapper}>
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
          <View style={s.miniMapBadge}>
            <Text style={s.miniMapBadgeText}>📍 {addressLabel}</Text>
          </View>
          <Pressable style={s.changeLocationBtn} onPress={() => setLocationConfirmed(false)}>
            <Text style={s.changeLocationText}>Modifier</Text>
          </Pressable>
        </View>

        <View style={s.content}>
          <Text style={s.sectionTitle}>1. Choisissez votre véhicule</Text>
          {vehicles.data?.map((v) => (
            <Pressable
              key={v.id}
              style={[s.vehicleOption, selectedVehicle?.id === v.id && s.vehicleOptionActive]}
              onPress={() => setSelectedVehicle(v)}
            >
              <Text style={s.vehicleEmoji}>{categoryEmoji(v.category, v.size)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.vehicleName}>{v.brand} {v.model}</Text>
                <Text style={s.vehiclePlate}>{v.plate}</Text>
              </View>
              <View style={[s.radio, selectedVehicle?.id === v.id && s.radioActive]}>
                {selectedVehicle?.id === v.id && <View style={s.radioDot} />}
              </View>
            </Pressable>
          ))}

          <Text style={s.sectionTitle}>2. Type de lavage</Text>
          {pricing.isLoading ? <ActivityIndicator /> : (
            WASH_TYPES.map((w) => (
              <Pressable
                key={w.value}
                style={[s.washTypeCard, washType === w.value && s.washTypeCardActive]}
                onPress={() => setWashType(w.value)}
              >
                <Text style={s.washTypeEmoji}>{w.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.washTypeLabel, washType === w.value && s.washTypeLabelActive]}>
                    {w.label}
                  </Text>
                  <Text style={s.washTypeDescription}>{w.description}</Text>
                </View>
                <Text style={[s.washTypePrice, washType === w.value && s.washTypePriceActive]}>
                  {pricing.data ? `${pricing.data[w.value] / 100} DH` : '-'}
                </Text>
              </Pressable>
            ))
          )}

          <Text style={s.sectionTitle}>3. Détails (optionnel)</Text>
          <Text style={s.helpText}>Sélectionnez les options applicables ou écrivez votre demande spécifique.</Text>
          <View style={s.chipsContainer}>
            {NOTE_CHIPS.map((chip) => (
              <Pressable
                key={chip}
                style={[s.chip, isChipSelected(chip) && s.chipActive]}
                onPress={() => toggleChip(chip)}
              >
                <Text style={[s.chipText, isChipSelected(chip) && s.chipTextActive]}>
                  {isChipSelected(chip) ? '✓ ' : '+ '}{chip}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={s.notesInput}
            placeholder="Ajouter une demande spécifique..."
            placeholderTextColor={colors.textPlaceholder}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={500}
          />
        </View>
      </ScrollView>

      <View style={s.bottomBar}>
        <View>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalPrice}>{currentPrice ? `${currentPrice / 100} DH` : '-'}</Text>
        </View>
        <Pressable
          style={[s.ctaButton, (!selectedVehicle || createBooking.isPending) && { opacity: 0.5 }]}
          onPress={onConfirm}
          disabled={!selectedVehicle || createBooking.isPending}
        >
          <Text style={s.ctaButtonText}>
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

const styles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.danger, fontSize: 16, marginBottom: 12 },
  link: { color: colors.primary, fontWeight: '600' },
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
  mapBackText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  mapTitleCard: {
    backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 16,
    paddingVertical: 10, borderRadius: 12, alignSelf: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  mapTitleText: { fontSize: 15, fontWeight: '700', color: colors.text },
  mapOverlayBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 8,
  },
  mapAddressCard: { marginBottom: 16 },
  mapAddressLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  mapAddressValue: { fontSize: 16, fontWeight: '600', color: colors.text },
  mapConfirmBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, alignItems: 'center' },
  mapConfirmBtnText: { color: colors.textOnPrimary, fontSize: 16, fontWeight: '700' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  back: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700' },
  miniMapWrapper: { height: 180, position: 'relative', overflow: 'hidden' },
  miniMapBadge: {
    position: 'absolute', bottom: 10, left: 12, right: 60,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, elevation: 3,
  },
  miniMapBadgeText: { fontSize: 12, color: colors.text, fontWeight: '500' },
  changeLocationBtn: {
    position: 'absolute', bottom: 10, right: 12,
    backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, elevation: 3,
  },
  changeLocationText: { color: colors.textOnPrimary, fontSize: 12, fontWeight: '700' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 8, marginBottom: 12 },
  helpText: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  vehicleOption: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    backgroundColor: colors.inputBackground, borderRadius: 12, marginBottom: 8,
    borderWidth: 2, borderColor: 'transparent', gap: 12,
  },
  vehicleOptionActive: { borderColor: colors.primary, backgroundColor: '#E8F1FF' },
  vehicleEmoji: { fontSize: 28 },
  vehicleName: { fontSize: 15, fontWeight: '600' },
  vehiclePlate: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  washTypeCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    backgroundColor: colors.inputBackground, borderRadius: 12, marginBottom: 8,
    borderWidth: 2, borderColor: 'transparent', gap: 12,
  },
  washTypeCardActive: { borderColor: colors.primary, backgroundColor: '#E8F1FF' },
  washTypeEmoji: { fontSize: 28 },
  washTypeLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  washTypeLabelActive: { color: colors.primary },
  washTypeDescription: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  washTypePrice: { fontSize: 16, fontWeight: '700', color: colors.textSecondary },
  washTypePriceActive: { color: colors.primary },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.textPlaceholder, justifyContent: 'center', alignItems: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: colors.inputBackground, borderRadius: 20, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text },
  chipTextActive: { color: colors.textOnPrimary, fontWeight: '600' },
  notesInput: {
    backgroundColor: colors.inputBackground, padding: 14, borderRadius: 10,
    fontSize: 14, minHeight: 80, textAlignVertical: 'top',
  },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.background, paddingHorizontal: 16, paddingTop: 12,
    paddingBottom: 16, borderTopWidth: 1, borderTopColor: colors.border,
  },
  totalLabel: { fontSize: 12, color: colors.textSecondary },
  totalPrice: { fontSize: 22, fontWeight: '700', color: colors.primary },
  ctaButton: { backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 10 },
  ctaButtonText: { color: colors.textOnPrimary, fontSize: 16, fontWeight: '700' },
});