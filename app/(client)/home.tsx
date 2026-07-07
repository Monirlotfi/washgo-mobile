import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { useAuthStore } from '../../src/stores/auth.store';
import { useRouter, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerActions } from '@react-navigation/native';
import { useColors, AppColors } from '../../src/theme/colors';
import { useVehicles } from '../../src/hooks/useVehicles';
import { useActiveBooking, useBookingsHistory } from '../../src/hooks/useBookings';
import { useCarousel } from '../../src/hooks/useCarousel';

const { width } = Dimensions.get('window');
const CAROUSEL_WIDTH = width - 40;
const CAROUSEL_HEIGHT = 180;
const AUTO_SCROLL_INTERVAL = 4000;

const QUICK_ACTIONS = [
  { id: 'booking', title: 'Réserver', icon: '🧽', route: '/(client)/new-booking' as const },
  { id: 'history', title: 'Historique', icon: '📖', route: '/(client)/history' as const },
  { id: 'vehicles', title: 'Véhicules', icon: '🚗', route: '/(client)/add-vehicle' as const },
  { id: 'profile', title: 'Profil', icon: '👤', route: '/(client)/profile' as const },
];

const PKG_META = [
  { id: 'basic', title: 'Lavage Simple', price: '50 DH', emoji: '🚗', desc: 'Extérieur complet' },
  { id: 'standard', title: 'Lavage Complet', price: '80 DH', emoji: '✨', desc: 'Extérieur + intérieur', popular: true },
  { id: 'premium', title: 'Lavage Premium', price: '120 DH', emoji: '🌟', desc: 'Complet + cire + polissage' },
];

const STEPS = [
  { icon: '📍', title: 'Position', desc: "Indique où tu veux être lavé" },
  { icon: '🚗', title: 'Véhicule', desc: "Sélectionne ton véhicule" },
  { icon: '🧽', title: 'Lavage', desc: "Un pro arrive en un clin d'œil" },
];

export default function HomeScreen() {
  const clr = useColors();
  const s = createStyles(clr);
  const { user } = useAuthStore();
  const router = useRouter();
  const navigation = useNavigation();
  const vehicles = useVehicles();
  const activeBooking = useActiveBooking();
  const { data: history } = useBookingsHistory();
  const { data: slides, refetch: refetchCarousel } = useCarousel();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const lastBooking = history && history.length > 0 ? history[0] : null;
  const initials = user?.fullName
    ? user.fullName.split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase()
    : 'WG';

  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % slides.length;
        const offset = next * (CAROUSEL_WIDTH + 16);
        flatListRef.current?.scrollToOffset({ offset, animated: true });
        return next;
      });
    }, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(timer);
  }, [slides?.length]);

  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: { viewAreaCoveragePercentThreshold: 50 },
      onViewableItemsChanged: ({ viewableItems }: any) => {
        if (viewableItems.length > 0) setCurrentIndex(viewableItems[0].index);
      },
    },
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([vehicles.refetch(), activeBooking.refetch(), refetchCarousel()]);
    setRefreshing(false);
  }, [vehicles, activeBooking, refetchCarousel]);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: true },
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: clr.background }} edges={['top']}>
      <View style={s.topBar}>
        <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={s.menuBtn}>
          <Text style={s.menuIcon}>☰</Text>
        </Pressable>
        <View style={s.brandWrap}>
          <View style={s.brandDot} />
          <Text style={s.topBarTitle}>WashGo</Text>
        </View>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={clr.primary} />}
      >
        <View style={s.hero}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={s.heroHi}>Bonjour,</Text>
            <Text style={s.heroName}>{user?.fullName || 'Client'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <Text style={s.heroTag}>Prêt pour un lavage ?</Text>
              <Text style={{ fontSize: 14 }}>✨</Text>
            </View>
          </View>
          <View style={{ position: 'relative', width: 80, height: 80 }}>
            <Text style={{ fontSize: 52 }}>🚗</Text>
            <View style={s.heroBubble}><Text style={{ fontSize: 15 }}>🧽</Text></View>
            <View style={s.heroDot1} />
            <View style={s.heroDot2} />
          </View>
        </View>

        {slides && slides.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Animated.FlatList
              ref={flatListRef}
              data={slides}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CAROUSEL_WIDTH + 16}
              snapToAlignment="start"
              decelerationRate="normal"
              keyExtractor={(s) => s.id}
              onScroll={onScroll}
              scrollEventThrottle={16}
              viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
              onScrollToIndexFailed={(info) => {
                flatListRef.current?.scrollToOffset({
                  offset: info.averageItemLength * info.index,
                  animated: true,
                });
              }}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
              renderItem={({ item, index }) => {
                const inputRange = [
                  (index - 1) * (CAROUSEL_WIDTH + 16),
                  index * (CAROUSEL_WIDTH + 16),
                  (index + 1) * (CAROUSEL_WIDTH + 16),
                ];
                const scale = scrollX.interpolate({
                  inputRange, outputRange: [0.92, 1, 0.92], extrapolate: 'clamp',
                });
                return (
                  <Animated.View style={[s.slideWrap, { width: CAROUSEL_WIDTH, transform: [{ scale }] }]}>
                    <View style={s.slide}>
                      <Image source={{ uri: item.imageUrl }} style={s.slideImg} />
                      <View style={s.slideOverlay}>
                        <Text style={s.slideTitle}>{item.title}</Text>
                        {item.subtitle && <Text style={s.slideSub}>{item.subtitle}</Text>}
                      </View>
                    </View>
                  </Animated.View>
                );
              }}
            />
            {slides.length > 1 && (
              <View style={s.dotsRow}>
                {slides.map((_, i) => (
                  <View key={i} style={[s.dot, i === currentIndex && s.dotActive]} />
                ))}
              </View>
            )}
          </View>
        )}

        {activeBooking.data ? (
          <Pressable style={s.card} onPress={() => router.push(`/(client)/booking/${activeBooking.data!.id}`)}>
            <View style={[s.cardIllu, { backgroundColor: clr.surface }]}>
              <Text style={{ fontSize: 26 }}>🧽</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: clr.success }} />
                <Text style={s.cardLabel}>Réservation en cours</Text>
              </View>
              <Text style={s.cardTitle}>{statusLabel(activeBooking.data.status)}</Text>
              <Text style={s.cardMeta}>{activeBooking.data.addressLabel}</Text>
            </View>
            <Text style={s.cardArrow}>→</Text>
          </Pressable>
        ) : (
          <Pressable style={s.card} onPress={() => {
            if ((vehicles.data?.length ?? 0) === 0) router.push('/(client)/add-vehicle');
            else router.push('/(client)/new-booking');
          }}>
            <View style={[s.cardIllu, { backgroundColor: clr.surface }]}>
              <Text style={{ fontSize: 26 }}>🚗</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Un petit lavage ?</Text>
              <Text style={s.cardMeta}>Trouvez un pro près de chez vous</Text>
            </View>
            <View style={s.cardBtn}>
              <Text style={s.cardBtnText}>→</Text>
            </View>
          </Pressable>
        )}

        <View style={s.cardSection}>
          <Text style={s.sectionCenterTitle}>Hop, qu'on fait ?</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {QUICK_ACTIONS.map((a) => (
              <Pressable key={a.id} style={{ flex: 1, alignItems: 'center' }} onPress={() => router.push(a.route)}>
                <View style={s.quickIconBg}><Text style={{ fontSize: 22 }}>{a.icon}</Text></View>
                <Text style={s.quickLabel}>{a.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={s.cardSection}>
          <View style={s.stepsHeader}>
            <Text style={s.steptitle}>Comment ça marche ?</Text>
            <Text style={s.stepSub}>3 étapes simples</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {STEPS.map((step, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', position: 'relative' }}>
                <View style={s.stepCircle}><Text style={{ fontSize: 24 }}>{step.icon}</Text></View>
                <Text style={s.stepLabel}>{step.title}</Text>
                <Text style={s.stepDesc}>{step.desc}</Text>
                {i < STEPS.length - 1 && <Text style={s.stepDash}>···</Text>}
              </View>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={s.rowHdr}>
            <Text style={s.hdrTitle}>Nos forfaits</Text>
            <Pressable onPress={() => router.push('/(client)/new-booking')}>
              <Text style={s.hdrLink}>Voir tout →</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {PKG_META.map((pkg) => (
              <Pressable key={pkg.id} style={s.pkgCard} onPress={() => router.push('/(client)/new-booking')}>
                {pkg.popular && (
                  <View style={[s.popTag, { backgroundColor: clr.primary + '15' }]}>
                    <Text style={s.popText}>POPULAIRE</Text>
                  </View>
                )}
                <View style={[s.pkgEmoji, { backgroundColor: clr.primary + '10' }]}>
                  <Text style={{ fontSize: 20 }}>{pkg.emoji}</Text>
                </View>
                <Text style={s.pkgTitle}>{pkg.title}</Text>
                <Text style={s.pkgDesc}>{pkg.desc}</Text>
                <Text style={s.pkgPrice}>{pkg.price}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {lastBooking && (
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <View style={s.rowHdr}>
              <Text style={s.hdrTitle}>Dernier lavage</Text>
              <Pressable onPress={() => router.push('/(client)/history')}>
                <Text style={s.hdrLink}>Voir tout →</Text>
              </Pressable>
            </View>
            <Pressable style={s.recentCard} onPress={() => router.push(`/(client)/booking/${lastBooking.id}`)}>
              <View style={[s.recentIcon, { backgroundColor: clr.surface }]}>
                <Text style={{ fontSize: 22 }}>🧽</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.recentVehicle}>{lastBooking.vehicle?.brand} {lastBooking.vehicle?.model}</Text>
                <Text style={s.recentDate}>{formatDate(lastBooking.scheduledAt)}</Text>
              </View>
              <Text style={s.recentPrice}>{lastBooking.priceMAD} DH</Text>
            </Pressable>
          </View>
        )}

        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <Text style={{ fontSize: 11, color: clr.textSecondary }}>WashGo · © 2026</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function statusLabel(status: string): string {
  const m: Record<string, string> = {
    PENDING: "Recherche d'un laveur...",
    ACCEPTED: 'Laveur en route',
    ARRIVED: 'Laveur arrivé',
    IN_PROGRESS: 'Lavage en cours',
    AWAITING_CLIENT_CONFIRMATION: 'Confirme la fin du lavage',
  };
  return m[status] ?? status;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  } catch {
    return dateStr;
  }
}

const createStyles = (clr: AppColors) =>
  StyleSheet.create({
    topBar: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: clr.border,
      backgroundColor: clr.background,
    },
    menuBtn: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: clr.surface,
      alignItems: 'center', justifyContent: 'center',
    },
    menuIcon: { fontSize: 18, color: clr.text },
    brandWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    brandDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: clr.primary },
    topBarTitle: { fontSize: 17, fontWeight: '700', color: clr.text },
    avatar: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: clr.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: clr.textOnPrimary, fontSize: 13, fontWeight: '700' },
    hero: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    },
    heroHi: { fontSize: 15, color: clr.textSecondary, fontWeight: '500' },
    heroName: { fontSize: 24, fontWeight: '700', color: clr.text, marginTop: 2 },
    heroTag: { fontSize: 14, color: clr.textSecondary, fontWeight: '500' },
    heroBubble: {
      position: 'absolute', top: -4, right: -8,
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: clr.card, borderWidth: 1, borderColor: clr.border,
      alignItems: 'center', justifyContent: 'center',
    },
    heroDot1: {
      position: 'absolute', bottom: 4, left: -4,
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: clr.primary + '30',
    },
    heroDot2: {
      position: 'absolute', bottom: 16, left: 6,
      width: 4, height: 4, borderRadius: 2,
      backgroundColor: clr.primary + '50',
    },
    slideWrap: { height: CAROUSEL_HEIGHT + 8, justifyContent: 'center' },
    slide: {
      height: CAROUSEL_HEIGHT, borderRadius: 14,
      overflow: 'hidden', backgroundColor: '#000',
    },
    slideImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    slideOverlay: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: 14, paddingTop: 48,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    slideTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    slideSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
    dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 12, gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: clr.border },
    dotActive: { width: 24, height: 6, borderRadius: 3, backgroundColor: clr.primary },
    card: {
      marginHorizontal: 20, marginBottom: 16,
      borderRadius: 14, backgroundColor: clr.card,
      borderWidth: 1, borderColor: clr.border,
      flexDirection: 'row', alignItems: 'center',
      padding: 14,
    },
    cardIllu: {
      width: 52, height: 52, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center',
      marginRight: 14,
    },
    cardLabel: { fontSize: 12, fontWeight: '600', color: clr.textSecondary },
    cardTitle: { fontSize: 16, fontWeight: '700', color: clr.text, marginBottom: 2 },
    cardMeta: { fontSize: 13, color: clr.textSecondary },
    cardArrow: { fontSize: 16, color: clr.textSecondary, marginLeft: 8 },
    cardBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: clr.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    cardBtnText: { color: clr.textOnPrimary, fontSize: 16, fontWeight: '700' },
    cardSection: {
      marginHorizontal: 20, marginBottom: 16,
      borderRadius: 14, backgroundColor: clr.card,
      borderWidth: 1, borderColor: clr.border,
      padding: 16,
    },
    sectionCenterTitle: { fontSize: 16, fontWeight: '700', color: clr.text, marginBottom: 16, textAlign: 'center' },
    quickIconBg: {
      width: 48, height: 48, borderRadius: 14,
      backgroundColor: clr.surface,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 8,
    },
    quickLabel: { fontSize: 11, fontWeight: '700', color: clr.text },
    stepsHeader: { alignItems: 'center', marginBottom: 16 },
    steptitle: { fontSize: 16, fontWeight: '700', color: clr.text },
    stepSub: { fontSize: 12, color: clr.textSecondary, marginTop: 2 },
    stepCircle: {
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: clr.surface,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 8,
    },
    stepLabel: { fontSize: 11, fontWeight: '700', color: clr.text, textAlign: 'center', marginBottom: 2 },
    stepDesc: { fontSize: 10, color: clr.textSecondary, textAlign: 'center', lineHeight: 13, paddingHorizontal: 2 },
    stepDash: { position: 'absolute', top: 20, right: -10, fontSize: 12, color: clr.border, letterSpacing: 2 },
    rowHdr: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 14,
    },
    hdrTitle: { fontSize: 16, fontWeight: '700', color: clr.text },
    hdrLink: { fontSize: 13, fontWeight: '600', color: clr.textSecondary },
    pkgCard: {
      width: 144, borderRadius: 14, position: 'relative',
      backgroundColor: clr.card, borderWidth: 1, borderColor: clr.border,
      paddingBottom: 14,
    },
    popTag: {
      position: 'absolute', top: 10, right: 10,
      paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
    },
    popText: { fontSize: 8, fontWeight: '800', color: clr.primary, letterSpacing: 0.8 },
    pkgEmoji: {
      width: 40, height: 40, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center',
      marginTop: 14, marginLeft: 14, marginBottom: 10,
    },
    pkgTitle: { fontSize: 13, fontWeight: '700', color: clr.text, paddingHorizontal: 14, marginBottom: 4 },
    pkgDesc: { fontSize: 11, color: clr.textSecondary, paddingHorizontal: 14, marginBottom: 10, lineHeight: 14 },
    pkgPrice: { fontSize: 16, fontWeight: '800', color: clr.primary, paddingHorizontal: 14 },
    recentCard: {
      padding: 14, borderRadius: 14,
      backgroundColor: clr.card, borderWidth: 1, borderColor: clr.border,
      flexDirection: 'row', alignItems: 'center',
    },
    recentIcon: {
      width: 48, height: 48, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center',
      marginRight: 14,
    },
    recentVehicle: { fontSize: 14, fontWeight: '700', color: clr.text, marginBottom: 2 },
    recentDate: { fontSize: 13, color: clr.textSecondary },
    recentPrice: { fontSize: 15, fontWeight: '800', color: clr.primary },
  });
