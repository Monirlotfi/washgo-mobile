import { useEffect, useState, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, Alert, ActivityIndicator,
  ScrollView, TextInput, Animated, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
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

const CAR_IMG = require('../../assets/1.jpg');
const SUV_IMG = require('../../assets/2.jpg');
const MOTO_IMG = require('../../assets/3.jpg');

const WASH_SERVICES: Record<WashType, { icon: string; services: string[]; duration: string; cardBg: string; accent: string }> = {
  BASIC: {
    icon: '💧',
    services: ['Lavage extérieur', 'Nettoyage roues', 'Séchage'],
    duration: '20-30 min',
    cardBg: '#FFFFFF',
    accent: '#4A90D9',
  },
  PREMIUM: {
    icon: '✨',
    services: ['Lavage extérieur', 'Aspirateur intérieur', 'Tableau de bord', 'Vitres', 'Pneus brillants'],
    duration: '40-50 min',
    cardBg: '#FFFFFF',
    accent: '#2563EB',
  },
  VIP: {
    icon: '👑',
    services: ['Tout inclus', 'Cire protectrice', 'Traitement cuir', 'Intérieur profond', 'Parfum', 'Détailing'],
    duration: '60-90 min',
    cardBg: '#FFFFFF',
    accent: '#D4AF37',
  },
};

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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const vehicleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 500, useNativeDriver: true,
    }).start();
  }, []);

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

  // ─── STEP 1: Full-screen map ───
  if (!locationConfirmed) {
    return (
      <View style={{ flex: 1 }}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: location.lat,
            longitude: location.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{ latitude: location.lat, longitude: location.lng }}
            title="Votre position"
          />
        </MapView>
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
            <Text style={s.mapConfirmBtnText}>✅ Confirmer</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── STEP 2: Booking form ───
  const currentPrice = pricing.data ? pricing.data[washType] : null;
  const svc = (w: WashType) => WASH_SERVICES[w];

  const animateVehicleSelect = (v: Vehicle) => {
    Animated.sequence([
      Animated.timing(vehicleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(vehicleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    setSelectedVehicle(v);
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={s.header}>
            <Pressable onPress={() => setLocationConfirmed(false)}>
              <Text style={s.backBtn}>← Retour</Text>
            </Pressable>
            <Text style={s.headerTitle}>Réserver un Lavage</Text>
          </View>
          <Text style={s.headerSubtitle}>Choisissez votre véhicule et votre forfait.</Text>

          {/* ── Top Image ── */}
          <Image source={getCarImage(selectedVehicle?.category ?? null, selectedVehicle?.size ?? '')} style={s.topImage} resizeMode="cover" />

          {/* ── Main content ── */}
          <View style={s.mainContent}>
            {/* ── Location Card ── */}
            <Animated.View style={s.card}>
              <View style={s.cardRow}>
                <View style={s.cardIconCircle}>
                  <Text style={s.cardIconText}>📍</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardLabel}>Adresse</Text>
                  <Text style={s.cardValue}>{addressLabel}</Text>
                </View>
                <View style={s.confirmedBadge}>
                  <Text style={s.confirmedBadgeText}>✓ Confirmé</Text>
                </View>
              </View>
              <View style={s.miniMapContainer}>
                <MapView
                  style={StyleSheet.absoluteFillObject}
                  initialRegion={{
                    latitude: location.lat,
                    longitude: location.lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Marker coordinate={{ latitude: location.lat, longitude: location.lng }} />
                </MapView>
              </View>
              <Pressable style={s.cardChangeBtn} onPress={() => setLocationConfirmed(false)}>
                <Text style={s.cardChangeBtnText}>Changer d'adresse</Text>
              </Pressable>
            </Animated.View>

            {/* ── Vehicle Section ── */}
            <Text style={s.sectionTitle}>Véhicule</Text>
            {vehicles.data?.map((v) => {
              const isSelected = selectedVehicle?.id === v.id;
              return (
                <Pressable key={v.id} onPress={() => animateVehicleSelect(v)}>
                  <Animated.View style={[
                    s.vehicleCard,
                    isSelected && s.vehicleCardActive,
                    { transform: [{ scale: vehicleAnim }] },
                  ]}>
                    <View style={s.vehicleCardLeft}>
                      <View style={[s.vehicleEmojiCircle, isSelected && s.vehicleEmojiCircleActive]}>
                        <Text style={s.vehicleEmoji}>{categoryEmoji(v.category, v.size)}</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.vehicleName}>{v.brand} {v.model}</Text>
                      <Text style={s.vehicleSub}>{v.category ? v.category.replace('_', ' ') : v.size}</Text>
                      <Text style={s.vehiclePlate}>{v.plate}</Text>
                    </View>
                    <View style={[s.vehicleCheck, isSelected && s.vehicleCheckActive]}>
                      {isSelected && <Text style={s.vehicleCheckIcon}>✓</Text>}
                    </View>
                  </Animated.View>
                </Pressable>
              );
            })}
            <Pressable style={s.addVehicleBtn} onPress={() => router.push('/(client)/add-vehicle')}>
              <Text style={s.addVehicleBtnText}>+ Ajouter</Text>
            </Pressable>

            {/* ── Wash Packages ── */}
            <Text style={s.sectionTitle}>Forfaits</Text>
            {pricing.isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
            ) : (
              WASH_TYPES.map((w) => {
                const isSelected = washType === w.value;
                const data = svc(w.value);
                const price = pricing.data ? pricing.data[w.value] / 100 : 0;
                return (
                  <Pressable key={w.value} onPress={() => setWashType(w.value)}>
                    <Animated.View style={[s.packageCard, isSelected && s.packageCardActive]}>
                      {w.value === 'PREMIUM' && (
                        <View style={s.popularBadge}>
                          <Text style={s.popularBadgeText}>Le plus populaire</Text>
                        </View>
                      )}
                      <View style={s.packageHeader}>
                        <View style={s.packageIconCircle}>
                          <Text style={s.packageIcon}>{data.icon}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={[s.packageTitle, isSelected && s.packageTitleActive]}>
                            {w.label}
                          </Text>
                          <Text style={s.packageDesc}>{w.description}</Text>
                          <Text style={s.packageDuration}>⏱ {data.duration}</Text>
                        </View>
                        <View style={[s.packageRadio, isSelected && s.packageRadioActive]}>
                          {isSelected && <View style={s.packageRadioDot} />}
                        </View>
                      </View>
                      <View style={s.packageServices}>
                        {data.services.map((svc) => (
                          <View key={svc} style={s.serviceRow}>
                            <Text style={s.serviceCheck}>✓</Text>
                            <Text style={s.serviceText}>{svc}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={s.packageDivider} />
                      <Text style={[s.packagePrice, isSelected && s.packagePriceActive]}>
                        {price} DH
                      </Text>
                    </Animated.View>
                  </Pressable>
                );
              })
            )}

            {/* ── Notes ── */}
            <Text style={s.sectionTitle}>Notes (optionnel)</Text>
            <Text style={s.helpText}>Ajoutez des instructions pour le lavage.</Text>
            <View style={s.chipsContainer}>
              {NOTE_CHIPS.map((chip) => (
                <Pressable
                  key={chip}
                  style={[s.chip, isChipSelected(chip) && s.chipActive]}
                  onPress={() => toggleChip(chip)}
                >
                  <Text style={[s.chipText, isChipSelected(chip) && s.chipTextActive]}>
                    {chip}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={s.notesInput}
              placeholder="Écrivez votre demande..."
              placeholderTextColor={colors.textPlaceholder}
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={500}
            />

            {/* ── Summary ── */}
            <Animated.View style={s.summaryCard}>
              <Text style={s.summaryTitle}>Résumé</Text>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Forfait</Text>
                <Text style={s.summaryValue}>
                  {pricing.data ? `${pricing.data[washType] / 100} DH` : '-'}
                </Text>
              </View>
              {selectedVehicle && (
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Véhicule</Text>
                  <Text style={s.summaryValue}>{selectedVehicle.brand} {selectedVehicle.model}</Text>
                </View>
              )}
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Déplacement</Text>
                <Text style={s.summaryValue}>Gratuit</Text>
              </View>
              <View style={s.summaryDivider} />
              <View style={s.summaryRow}>
                <Text style={s.summaryTotalLabel}>Total</Text>
                <Text style={s.summaryTotalPrice}>
                  {currentPrice ? `${currentPrice / 100} DH` : '-'}
                </Text>
              </View>
            </Animated.View>

            <View style={{ height: 20 }} />
          </View>
        </ScrollView>

        {/* ── Bottom Bar ── */}
        <View style={s.bottomBar}>
          <View>
            <Text style={s.bottomTotalLabel}>Total</Text>
            <Text style={s.bottomTotalPrice}>{currentPrice ? `${currentPrice / 100} DH` : '-'}</Text>
            <Text style={s.bottomTaxNote}>TTC</Text>
          </View>
          <Pressable
            style={[s.confirmBtn, (!selectedVehicle || createBooking.isPending) && { opacity: 0.5 }]}
            onPress={onConfirm}
            disabled={!selectedVehicle || createBooking.isPending}
          >
            <Text style={s.confirmBtnText}>
              {createBooking.isPending ? 'Réservation...' : 'Réserver'}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
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

function getCarImage(category: string | null, size: string): any {
  if (category === 'MOTORCYCLE') return MOTO_IMG;
  if (category === 'LARGE_VEHICLE' || size === 'SUV' || size === 'VAN') return SUV_IMG;
  return CAR_IMG;
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
  },
  mapAddressCard: { marginBottom: 16 },
  mapAddressLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  mapAddressValue: { fontSize: 16, fontWeight: '600', color: colors.text },
  mapConfirmBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, alignItems: 'center' },
  mapConfirmBtnText: { color: colors.textOnPrimary, fontSize: 16, fontWeight: '700' },
  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    color: colors.primary, fontSize: 16, fontWeight: '600',
    paddingVertical: 4, paddingRight: 4,
  },
  headerTitle: {
    fontSize: 17, fontWeight: '700', color: colors.text, marginLeft: 12, flex: 1,
  },
  headerSubtitle: {
    fontSize: 13, color: colors.textSecondary, marginBottom: 14, marginTop: 4,
  },
  topImage: {
    height: 150, borderRadius: 14, overflow: 'hidden', marginBottom: 16,
    width: '100%',
  },
  // ── Main content ──
  mainContent: {},
  // ── Card (shared) ──
  card: {
    backgroundColor: colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardIconCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F1FF',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  cardIconText: { fontSize: 16 },
  cardLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  cardValue: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 2 },
  confirmedBadge: {
    backgroundColor: '#E8F8E8', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  confirmedBadgeText: { color: '#34C759', fontSize: 10, fontWeight: '700' },
  miniMapContainer: { height: 90, borderRadius: 10, overflow: 'hidden', marginBottom: 10 },
  cardChangeBtn: { alignItems: 'center', paddingVertical: 6 },
  cardChangeBtnText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  // ── Section title ──
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 20, marginBottom: 10,
  },
  helpText: { fontSize: 13, color: colors.textSecondary, marginBottom: 10 },
  // ── Vehicle ──
  vehicleCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  vehicleCardActive: {
    borderColor: colors.primary, backgroundColor: colors.primary + '08',
  },
  vehicleCardLeft: { marginRight: 10 },
  vehicleEmojiCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  vehicleEmojiCircleActive: { backgroundColor: colors.primary + '15' },
  vehicleEmoji: { fontSize: 20 },
  vehicleName: { fontSize: 14, fontWeight: '600', color: colors.text },
  vehicleSub: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  vehiclePlate: { fontSize: 11, color: colors.textSecondary, marginTop: 1, fontFamily: 'monospace' },
  vehicleCheck: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  vehicleCheckActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  vehicleCheckIcon: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  addVehicleBtn: {
    paddingVertical: 8, borderRadius: 12, borderWidth: 1,
    borderColor: colors.primary, borderStyle: 'dashed', alignItems: 'center',
  },
  addVehicleBtnText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  // ── Package cards ──
  packageCard: {
    backgroundColor: colors.card, borderRadius: 14, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  packageCardActive: {
    borderColor: colors.primary, backgroundColor: colors.primary + '06',
  },
  popularBadge: {
    alignSelf: 'flex-start', marginBottom: 6,
  },
  popularBadgeText: { color: colors.primary, fontSize: 10, fontWeight: '600' },
  packageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  packageIconCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F1FF',
    justifyContent: 'center', alignItems: 'center',
  },
  packageIcon: { fontSize: 18 },
  packageTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  packageTitleActive: { color: colors.primary },
  packageDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  packageDuration: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  packageRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  packageRadioActive: { borderColor: colors.primary },
  packageRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  packageServices: { marginBottom: 6 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  serviceCheck: { color: colors.textSecondary, fontSize: 11, marginRight: 6, width: 12 },
  serviceText: { fontSize: 12, color: colors.textSecondary },
  packageDivider: { height: 1, backgroundColor: colors.border, marginBottom: 6 },
  packagePrice: { fontSize: 16, fontWeight: '800', color: colors.text },
  packagePriceActive: { color: colors.primary },
  // ── Chips & Notes ──
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: colors.inputBackground, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },
  chipText: { fontSize: 12, color: colors.text, fontWeight: '500' },
  chipTextActive: { color: colors.textOnPrimary, fontWeight: '600' },
  notesInput: {
    backgroundColor: colors.inputBackground, padding: 14, borderRadius: 12,
    fontSize: 14, minHeight: 70, textAlignVertical: 'top',
    borderWidth: 1, borderColor: colors.border,
  },
  // ── Summary Card ──
  summaryCard: {
    backgroundColor: colors.card, borderRadius: 14, padding: 14, marginTop: 20,
    borderWidth: 1, borderColor: colors.border,
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 10 },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: { fontSize: 13, color: colors.textSecondary },
  summaryValue: { fontSize: 13, fontWeight: '600', color: colors.text },
  summaryDivider: {
    height: 1, backgroundColor: colors.border, marginVertical: 6,
  },
  summaryTotalLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  summaryTotalPrice: { fontSize: 18, fontWeight: '800', color: colors.primary },
  // ── Bottom Bar ──
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.background, paddingHorizontal: 16, paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  bottomTotalLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  bottomTotalPrice: { fontSize: 20, fontWeight: '800', color: colors.text },
  bottomTaxNote: { fontSize: 10, color: colors.textSecondary, marginTop: 1 },
  confirmBtn: {
    backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14,
  },
  confirmBtnText: { color: colors.textOnPrimary, fontSize: 15, fontWeight: '700' },
});