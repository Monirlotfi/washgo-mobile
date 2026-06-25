import { View, Text, StyleSheet, Pressable } from 'react-native';
import StarRating from './StarRating';
import { OfferWithWasher } from '../types/api.types';
import { useColors, AppColors } from '../theme/colors';

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
  const colors = useColors();
  const s = styles(colors);
  const proposedDH = offer.proposedPriceMAD / 100;
  const suggestedDH = suggestedPriceMAD / 100;
  const diff = proposedDH - suggestedDH;
  const isCheaper = diff < 0;
  const isMoreExpensive = diff > 0;

  return (
    <View style={s.card}>
      <View style={s.header}>
        <View style={s.washerInfo}>
          <Text style={s.washerName}>{offer.washer.user.fullName}</Text>
          <View style={s.ratingRow}>
            {offer.washer.avgRating > 0 ? (
              <>
                <StarRating value={Math.round(offer.washer.avgRating)} size={12} readonly />
                <Text style={s.ratingText}>
                  {offer.washer.avgRating.toFixed(1)}
                  {' · '}
                  {offer.washer.totalBookings} course
                  {offer.washer.totalBookings > 1 ? 's' : ''}
                </Text>
              </>
            ) : (
              <Text style={s.newWasher}>🆕 Nouveau laveur</Text>
            )}
          </View>
        </View>
        <View style={s.priceContainer}>
          <Text style={s.priceValue}>{proposedDH} DH</Text>
          {isCheaper && (
            <Text style={s.priceCheaper}>{diff} DH</Text>
          )}
          {isMoreExpensive && (
            <Text style={s.priceMoreExp}>+{diff} DH</Text>
          )}
        </View>
      </View>

      <View style={s.statsRow}>
        <View style={s.stat}>
          <Text style={s.statLabel}>⏱ Arrive en</Text>
          <Text style={s.statValue}>~{offer.estimatedEtaMin} min</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.stat}>
          <Text style={s.statLabel}>💰 vs suggéré</Text>
          <Text
            style={[
              s.statValue,
              isCheaper && s.statValueCheaper,
              isMoreExpensive && s.statValueMoreExp,
            ]}
          >
            {diff === 0 ? '= ' + suggestedDH : (diff > 0 ? '+' : '') + diff} DH
          </Text>
        </View>
      </View>

      <Pressable
        style={[s.chooseBtn, isLoading && { opacity: 0.5 }]}
        onPress={onChoose}
        disabled={isLoading}
      >
        <Text style={s.chooseBtnText}>
          {isLoading ? 'Sélection...' : 'Choisir ce laveur'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = (colors: AppColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  washerInfo: { flex: 1, marginRight: 12 },
  washerName: { fontSize: 16, fontWeight: '700', marginBottom: 4, color: colors.text },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  newWasher: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  priceContainer: { alignItems: 'flex-end' },
  priceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
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
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  statValueCheaper: { color: '#34C759' },
  statValueMoreExp: { color: '#FF9500' },
  chooseBtn: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  chooseBtnText: { color: colors.textOnPrimary, fontSize: 15, fontWeight: '700' },
});