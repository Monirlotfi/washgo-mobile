import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMyPendingOffers } from '../../src/hooks/useOffers';

export default function MyOffersScreen() {
  const router = useRouter();
  const offers = useMyPendingOffers();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.replace('/(washer)/dashboard')}>
          <Text style={styles.back}>← Dashboard</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>Mes offres en cours</Text>
        <View style={{ width: 80 }} />
      </View>

      {offers.isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (offers.data?.length ?? 0) === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>Aucune offre en attente</Text>
          <Text style={styles.emptySubtext}>
            Rendez-vous sur le dashboard pour faire des offres sur les courses disponibles.
          </Text>
        </View>
      ) : (
        <FlatList
          data={offers.data}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl refreshing={offers.isRefetching} onRefresh={() => offers.refetch()} />
          }
          renderItem={({ item }) => {
            const expiresIn = item.booking.expiresAt
              ? Math.max(
                  0,
                  Math.floor(
                    (new Date(item.booking.expiresAt).getTime() - Date.now()) / 1000,
                  ),
                )
              : 0;

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.client}>{item.booking.client.fullName}</Text>
                  <Text style={styles.priceProposed}>
                    {item.proposedPriceMAD / 100} DH
                  </Text>
                </View>
                <Text style={styles.detail}>📍 {item.booking.addressLabel}</Text>
                <Text style={styles.detail}>
                  🚗 {item.booking.vehicle.brand} {item.booking.vehicle.model}
                </Text>
                <Text style={styles.detail}>
                  Suggéré : {item.booking.priceMAD / 100} DH ·
                  Vous : {item.proposedPriceMAD / 100} DH
                </Text>
                <Text style={styles.eta}>
                  ⏱ ETA estimée : {item.estimatedEtaMin} min
                </Text>
                {expiresIn > 0 ? (
                  <Text style={styles.timer}>
                    ⏳ Expire dans {Math.floor(expiresIn / 60)}min {expiresIn % 60}s
                  </Text>
                ) : (
                  <Text style={styles.timerExpired}>⏱ Expiré</Text>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  back: { color: '#0066FF', fontSize: 15, fontWeight: '600' },
  topBarTitle: { fontSize: 17, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 60, marginBottom: 12 },
  emptyText: { color: '#333', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  emptySubtext: { color: '#666', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  card: {
    backgroundColor: '#fff', padding: 16, borderRadius: 14,
    marginBottom: 12, borderWidth: 1, borderColor: '#EEE',
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  client: { fontSize: 16, fontWeight: '700' },
  priceProposed: {
    fontSize: 18, fontWeight: '700', color: '#0066FF',
    backgroundColor: '#E8F1FF', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, overflow: 'hidden',
  },
  detail: { fontSize: 13, color: '#666', marginBottom: 4 },
  eta: { fontSize: 13, color: '#0066FF', marginTop: 4, fontWeight: '600' },
  timer: { fontSize: 13, color: '#996A00', marginTop: 8, fontWeight: '600' },
  timerExpired: { fontSize: 13, color: '#999', marginTop: 8, fontStyle: 'italic' },
});