import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useBookingsHistory } from '../../src/hooks/useBookings';
import StarRating from '../../src/components/StarRating';

export default function HistoryScreen() {
  const navigation = useNavigation();
  const history = useBookingsHistory();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>Mes lavages</Text>
        <View style={{ width: 32 }} />
      </View>

      {history.isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (history.data?.length ?? 0) === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>Aucun lavage dans votre historique</Text>
        </View>
      ) : (
        <FlatList
          data={history.data}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl refreshing={history.isRefetching} onRefresh={() => history.refetch()} />
          }
          renderItem={({ item }) => (
            <View style={[styles.card, item.status === 'CANCELLED' && styles.cardCancelled]}>
              <View style={styles.cardHeader}>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                <Text style={[styles.statusBadge, statusStyle(item.status)]}>
                  {statusLabel(item.status)}
                </Text>
              </View>
              <Text style={styles.vehicle}>
                🚗 {item.vehicle?.brand} {item.vehicle?.model} · {item.vehicle?.plate}
              </Text>
              <Text style={styles.address}>📍 {item.addressLabel}</Text>
              {item.washer && (
                <Text style={styles.washer}>
                  🧽 Laveur : {item.washer.user.fullName}
                </Text>
              )}
              <View style={styles.cardFooter}>
                <Text style={styles.price}>{item.priceMAD / 100} DH</Text>
              </View>
              {item.status === 'CANCELLED' && item.cancellationReason && (
                <View style={styles.cancelReason}>
                  <Text style={styles.cancelReasonLabel}>Motif :</Text>
                  <Text style={styles.cancelReasonText}>
                    {item.cancellationReason}
                    {item.cancelledBy ? ` (par ${cancelledByLabel(item.cancelledBy)})` : ''}
                  </Text>
                </View>
              )}
              {item.status === 'COMPLETED' && item.rating && (
                <View style={styles.ratingBadge}>
                  <StarRating value={item.rating.score} size={14} readonly />
                  <Text style={styles.ratingBadgeText}>
                    Vous avez noté {item.rating.score}/5
                  </Text>
                </View>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
function statusLabel(s: string): string {
  return s === 'COMPLETED' ? '✅ Terminé' : s === 'CANCELLED' ? '❌ Annulé' : s;
}
function statusStyle(s: string) {
  return s === 'COMPLETED' ? styles.badgeCompleted : styles.badgeCancelled;
}
function cancelledByLabel(by: string): string {
  return by === 'CLIENT' ? 'vous' : by === 'WASHER' ? 'le laveur' : 'le système';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 4,
    borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  menuIcon: { fontSize: 28, color: '#333' },
  topBarTitle: { fontSize: 17, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 60, marginBottom: 12 },
  emptyText: { color: '#666', fontSize: 15, textAlign: 'center' },
  card: {
    backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#EEE',
  },
  cardCancelled: { backgroundColor: '#FFF5F5' },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  date: { fontSize: 13, color: '#666', fontWeight: '500' },
  statusBadge: {
    fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    overflow: 'hidden',
  },
  badgeCompleted: { backgroundColor: '#D4F4DD', color: '#1B7B3A' },
  badgeCancelled: { backgroundColor: '#FFE0E0', color: '#C62828' },
  vehicle: { fontSize: 14, marginBottom: 4, color: '#333' },
  address: { fontSize: 13, color: '#666', marginBottom: 4 },
  washer: { fontSize: 13, color: '#666', marginBottom: 4 },
  cardFooter: { marginTop: 8, alignItems: 'flex-end' },
  price: { fontSize: 16, fontWeight: '700', color: '#0066FF' },
  cancelReason: {
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#FCC',
  },
  cancelReasonLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
  cancelReasonText: { fontSize: 13, color: '#333' },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  ratingBadgeText: { fontSize: 12, color: '#666', fontWeight: '500' },
});