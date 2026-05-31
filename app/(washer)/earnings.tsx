import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useEarnings, useEarningsMonths } from '../../src/hooks/useEarnings';

export default function EarningsScreen() {
  const navigation = useNavigation();
  const months = useEarningsMonths();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // Auto-sélectionne le mois le plus récent dispo si on n'a rien pour le mois actuel
  useEffect(() => {
    if (months.data && months.data.length > 0) {
      const hasCurrent = months.data.some(
        (m) => m.year === year && m.month === month,
      );
      if (!hasCurrent) {
        setYear(months.data[0].year);
        setMonth(months.data[0].month);
      }
    }
  }, [months.data]);

  const earnings = useEarnings(year, month);

  const goPrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };
  const goNext = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>Mes gains</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.monthSelector}>
        <Pressable onPress={goPrev} style={styles.arrowBtn}>
          <Text style={styles.arrow}>←</Text>
        </Pressable>
        <Text style={styles.monthLabel}>{monthName(month)} {year}</Text>
        <Pressable onPress={goNext} style={styles.arrowBtn}>
          <Text style={styles.arrow}>→</Text>
        </Pressable>
      </View>

      {earnings.isLoading ? (
        <ActivityIndicator style={{ marginTop: 30 }} />
      ) : (
        <>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{(earnings.data?.kpi.totalEarnedMAD ?? 0) / 100} DH</Text>
              <Text style={styles.kpiLabel}>Gains</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{earnings.data?.kpi.completedCount ?? 0}</Text>
              <Text style={styles.kpiLabel}>Courses</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>
                {(earnings.data?.kpi.averagePerCourseMAD ?? 0) / 100} DH
              </Text>
              <Text style={styles.kpiLabel}>Moy./course</Text>
            </View>
          </View>

          {(earnings.data?.kpi.cancelledCount ?? 0) > 0 && (
            <View style={styles.lostCard}>
              <Text style={styles.lostText}>
                ❌ {earnings.data?.kpi.cancelledCount} course(s) annulée(s) ·{' '}
                {(earnings.data?.kpi.lostMAD ?? 0) / 100} DH perdus
              </Text>
            </View>
          )}

          {(earnings.data?.bookings.length ?? 0) === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>Aucune course ce mois-ci</Text>
            </View>
          ) : (
            <FlatList
              data={earnings.data?.bookings}
              keyExtractor={(b) => b.id}
              contentContainerStyle={{ padding: 20, paddingTop: 0 }}
              renderItem={({ item }) => (
                <View
                  style={[styles.card, item.status === 'CANCELLED' && styles.cardCancelled]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                    <Text
                      style={[
                        styles.badge,
                        item.status === 'COMPLETED' ? styles.badgeOk : styles.badgeKo,
                      ]}
                    >
                      {item.status === 'COMPLETED' ? '✅ Terminé' : '❌ Annulé'}
                    </Text>
                  </View>
                  <Text style={styles.client}>{item.clientName}</Text>
                  <Text style={styles.detail}>📍 {item.addressLabel}</Text>
                  <Text style={styles.detail}>
                    🚗 {item.vehicleLabel} · {item.vehiclePlate}
                  </Text>
                  <Text
                    style={[
                      styles.amount,
                      item.status === 'CANCELLED' && styles.amountLost,
                    ]}
                  >
                    {item.priceMAD / 100} DH
                  </Text>
                  {item.status === 'CANCELLED' && item.cancellationReason && (
                    <Text style={styles.cancelReason}>
                      Motif : {item.cancellationReason}
                    </Text>
                  )}
                </View>
              )}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

function monthName(m: number): string {
  return ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'][m - 1];
}
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
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
  monthSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 30, paddingVertical: 14,
  },
  arrowBtn: { padding: 8 },
  arrow: { fontSize: 24, color: '#0066FF', fontWeight: '700' },
  monthLabel: { fontSize: 18, fontWeight: '700' },
  kpiRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16,
  },
  kpiCard: {
    flex: 1, backgroundColor: '#0066FF', padding: 14, borderRadius: 12, alignItems: 'center',
  },
  kpiValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  kpiLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 },
  lostCard: {
    marginHorizontal: 20, marginBottom: 14, backgroundColor: '#FFF5F5',
    padding: 12, borderRadius: 10,
  },
  lostText: { color: '#C62828', fontSize: 13, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 60, marginBottom: 12 },
  emptyText: { color: '#666', fontSize: 15 },
  card: {
    backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#EEE',
  },
  cardCancelled: { backgroundColor: '#FFF5F5' },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  date: { fontSize: 13, color: '#666' },
  badge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  badgeOk: { backgroundColor: '#D4F4DD', color: '#1B7B3A' },
  badgeKo: { backgroundColor: '#FFE0E0', color: '#C62828' },
  client: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  detail: { fontSize: 13, color: '#666', marginBottom: 2 },
  amount: { fontSize: 18, fontWeight: '700', color: '#0066FF', marginTop: 6, textAlign: 'right' },
  amountLost: { color: '#C62828', textDecorationLine: 'line-through' },
  cancelReason: { fontSize: 12, color: '#999', marginTop: 4, fontStyle: 'italic' },
});