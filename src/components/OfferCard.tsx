import { View, Text, StyleSheet, Pressable } from 'react-native';
import StarRating from './StarRating';
import { OfferWithWasher } from '../types/api.types';

interface Props {
  offer: OfferWithWasher;
  suggestedPriceMAD: number;
  onChoose: () => void;
  isLoading?: boolean;
}

export default function OfferCard({
  offer,
  suggestedPriceMAD,
  onChoose,
  isLoading,
}: Props) {
  const proposedDH = offer.proposedPriceMAD / 100;
  const suggestedDH = suggestedPriceMAD / 100;
  const diff = proposedDH - suggestedDH;
  const isCheaper = diff < 0;
  const isMoreExpensive = diff > 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.washerInfo}>
          <Text style={styles.washerName}>{offer.washer.user.fullName}</Text>
          <View style={styles.ratingRow}>
            {offer.washer.avgRating > 0 ? (
              <>
                <StarRating value={Math.round(offer.washer.avgRating)} size={12} readonly />
                <Text style={styles.ratingText}>
                  {offer.washer.avgRating.toFixed(1)}
                  {' · '}
                  {offer.washer.totalBookings} course
                  {offer.washer.totalBookings > 1 ? 's' : ''}
                </Text>
              </>
            ) : (
              <Text style={styles.newWasher}>🆕 Nouveau laveur</Text>
            )}
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceValue}>{proposedDH} DH</Text>
          {isCheaper && (
            <Text style={styles.priceCheaper}>{diff} DH</Text>
          )}
          {isMoreExpensive && (
            <Text style={styles.priceMoreExp}>+{diff} DH</Text>
          )}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>⏱ Arrive en</Text>
          <Text style={styles.statValue}>~{offer.estimatedEtaMin} min</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>💰 vs suggéré</Text>
          <Text
            style={[
              styles.statValue,
              isCheaper && styles.statValueCheaper,
              isMoreExpensive && styles.statValueMoreExp,
            ]}
          >
            {diff === 0 ? '= ' + suggestedDH : (diff > 0 ? '+' : '') + diff} DH
          </Text>
        </View>
      </View>

      <Pressable
        style={[styles.chooseBtn, isLoading && { opacity: 0.5 }]}
        onPress={onChoose}
        disabled={isLoading}
      >
        <Text style={styles.chooseBtnText}>
          {isLoading ? 'Sélection...' : 'Choisir ce laveur'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  washerInfo: { flex: 1, marginRight: 12 },
  washerName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: { fontSize: 12, color: '#666', fontWeight: '500' },
  newWasher: { fontSize: 12, color: '#0066FF', fontWeight: '600' },
  priceContainer: { alignItems: 'flex-end' },
  priceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0066FF',
  },
  priceCheaper: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '700',
    marginTop: 2,
  },
  priceMoreExp: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '700',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F4F5F7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: '#DDD' },
  statLabel: { fontSize: 11, color: '#666', marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '700', color: '#333' },
  statValueCheaper: { color: '#34C759' },
  statValueMoreExp: { color: '#FF9500' },
  chooseBtn: {
    backgroundColor: '#0066FF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  chooseBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});