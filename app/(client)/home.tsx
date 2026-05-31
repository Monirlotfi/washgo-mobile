import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuthStore } from '../../src/stores/auth.store';
import { useRouter, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerActions } from '@react-navigation/native';
import { useVehicles } from '../../src/hooks/useVehicles';
import { useActiveBooking } from '../../src/hooks/useBookings';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const navigation = useNavigation();
  const vehicles = useVehicles();
  const activeBooking = useActiveBooking();

  const onRefresh = () => {
    vehicles.refetch();
    activeBooking.refetch();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>Accueil</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.header}>
        <Text style={styles.welcome}>Bonjour,</Text>
        <Text style={styles.name}>{user?.fullName} 👋</Text>
      </View>

      {activeBooking.data && (
        <Pressable
          style={styles.activeBookingCard}
          onPress={() => router.push(`/(client)/booking/${activeBooking.data!.id}`)}
        >
          <Text style={styles.activeBookingLabel}>Réservation en cours</Text>
          <Text style={styles.activeBookingStatus}>
            {statusLabel(activeBooking.data.status)}
          </Text>
          <Text style={styles.activeBookingDetail}>
            {activeBooking.data.addressLabel}
          </Text>
          <Text style={styles.seeMore}>Voir le détail →</Text>
        </Pressable>
      )}

      {!activeBooking.data && (
        <Pressable
          style={styles.ctaButton}
          onPress={() => {
            if ((vehicles.data?.length ?? 0) === 0) {
              router.push('/(client)/add-vehicle');
            } else {
              router.push('/(client)/new-booking');
            }
          }}
        >
          <Text style={styles.ctaButtonText}>🧽 Commander un lavage</Text>
        </Pressable>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes véhicules</Text>
          <Pressable onPress={() => router.push('/(client)/add-vehicle')}>
            <Text style={styles.addLink}>+ Ajouter</Text>
          </Pressable>
        </View>

        {vehicles.isLoading ? (
          <ActivityIndicator />
        ) : (vehicles.data?.length ?? 0) === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Aucun véhicule enregistré. Ajoutez-en un pour commander un lavage.
            </Text>
          </View>
        ) : (
          <FlatList
            data={vehicles.data}
            keyExtractor={(v) => v.id}
            refreshControl={
              <RefreshControl refreshing={vehicles.isRefetching} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => (
              <View style={styles.vehicleCard}>
                <Text style={styles.vehicleTitle}>
                  {item.brand} {item.model}
                </Text>
                <Text style={styles.vehicleDetail}>
                  {item.plate} · {sizeLabel(item.size)}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "🔍 Recherche d'un laveur...",
    ACCEPTED: '✅ Laveur en route',
    ARRIVED: '📍 Laveur arrivé',
    IN_PROGRESS: '🧽 Lavage en cours',
    AWAITING_CLIENT_CONFIRMATION: '⏳ Confirmez la fin du lavage',
  };
  return map[status] ?? status;
}

function sizeLabel(size: string): string {
  const map: Record<string, string> = {
    SMALL: 'Citadine', MEDIUM: 'Berline', SUV: 'SUV', VAN: 'Utilitaire',
  };
  return map[size] ?? size;
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingBottom: 30, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, marginTop: 4,
  },
  menuIcon: { fontSize: 28, color: '#333' },
  topBarTitle: { fontSize: 17, fontWeight: '700' },
  header: { marginBottom: 20, marginTop: 4 },
  welcome: { fontSize: 16, color: '#666' },
  name: { fontSize: 26, fontWeight: '700', marginTop: 2 },
  activeBookingCard: {
    backgroundColor: '#0066FF', padding: 20, borderRadius: 16, marginBottom: 20,
  },
  activeBookingLabel: { color: '#B3CFFF', fontSize: 13, marginBottom: 4 },
  activeBookingStatus: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 6 },
  activeBookingDetail: { color: '#E0EBFF', fontSize: 14 },
  seeMore: { color: '#fff', fontSize: 13, marginTop: 12, fontWeight: '600' },
  ctaButton: {
    backgroundColor: '#0066FF', padding: 20, borderRadius: 16,
    alignItems: 'center', marginBottom: 20,
  },
  ctaButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  section: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  addLink: { color: '#0066FF', fontWeight: '600' },
  vehicleCard: { backgroundColor: '#F4F5F7', padding: 16, borderRadius: 12, marginBottom: 10 },
  vehicleTitle: { fontSize: 16, fontWeight: '600' },
  vehicleDetail: { color: '#666', marginTop: 4, fontSize: 14 },
  emptyState: {
    backgroundColor: '#F9FAFB', padding: 24, borderRadius: 12, alignItems: 'center',
  },
  emptyText: { color: '#666', textAlign: 'center', lineHeight: 20 },
});