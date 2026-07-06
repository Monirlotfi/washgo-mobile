import { useEffect, useState } from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { useColors, AppColors } from '../theme/colors';

interface Props {
  visible: boolean;
  suggestedPriceMAD: number; // en centimes
  onClose: () => void;
  onConfirm: (proposedPriceMAD: number) => void;
  isLoading?: boolean;
}

export default function MakeOfferModal({
  visible,
  suggestedPriceMAD,
  onClose,
  onConfirm,
  isLoading,
}: Props) {
  const colors = useColors();
  const s = styles(colors);
  const suggestedDH = suggestedPriceMAD / 100;
  const [priceDH, setPriceDH] = useState(suggestedDH);

  useEffect(() => {
    if (visible) {
      setPriceDH(suggestedDH);
    }
  }, [visible, suggestedDH]);

  const adjust = (delta: number) => {
    setPriceDH((prev) => Math.max(10, Math.min(1000, prev + delta)));
  };

  const handleConfirm = () => {
    if (priceDH < 10 || priceDH > 1000) return;
    onConfirm(Math.round(priceDH * 100)); // en centimes
  };

  const diff = priceDH - suggestedDH;
  const diffLabel =
    diff === 0
      ? '= prix suggéré'
      : diff > 0
      ? `+${diff} DH par rapport au prix suggéré`
      : `${diff} DH par rapport au prix suggéré`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={s.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.kav}
        >
          <View style={s.sheet}>
            <View style={s.handle} />

            <Text style={s.title}>Faire une offre</Text>
            <Text style={s.subtitle}>
              Prix suggéré : <Text style={s.suggested}>{suggestedDH} DH</Text>
            </Text>
            <Text style={s.helpText}>
              ⚠️ Une fois envoyée, l'offre est finale et ne peut pas être modifiée ni annulée jusqu'à expiration.
            </Text>

            <View style={s.priceContainer}>
              <Pressable
                style={s.adjustBtn}
                onPress={() => adjust(-10)}
                disabled={priceDH <= 10}
              >
                <Text style={s.adjustBtnText}>-10</Text>
              </Pressable>
              <Pressable
                style={s.adjustBtn}
                onPress={() => adjust(-5)}
                disabled={priceDH <= 10}
              >
                <Text style={s.adjustBtnText}>-5</Text>
              </Pressable>

              <View style={s.priceWrapper}>
                <TextInput
                  style={s.priceInput}
                  value={String(priceDH)}
                  onChangeText={(v) => {
                    const num = parseInt(v.replace(/\D/g, '')) || 0;
                    setPriceDH(num);
                  }}
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <Text style={s.priceUnit}>DH</Text>
              </View>

              <Pressable
                style={s.adjustBtn}
                onPress={() => adjust(5)}
                disabled={priceDH >= 1000}
              >
                <Text style={s.adjustBtnText}>+5</Text>
              </Pressable>
              <Pressable
                style={s.adjustBtn}
                onPress={() => adjust(10)}
                disabled={priceDH >= 1000}
              >
                <Text style={s.adjustBtnText}>+10</Text>
              </Pressable>
            </View>

            <Text
              style={[
                s.diffLabel,
                diff > 0 ? s.diffPositive : diff < 0 ? s.diffNegative : s.diffNeutral,
              ]}
            >
              {diffLabel}
            </Text>

            <View style={s.actions}>
              <Pressable
                style={[s.btnSecondary, isLoading && { opacity: 0.5 }]}
                onPress={onClose}
                disabled={isLoading}
              >
                <Text style={s.btnSecondaryText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[
                  s.btnPrimary,
                  (priceDH < 10 || priceDH > 1000 || isLoading) && { opacity: 0.5 },
                ]}
                onPress={handleConfirm}
                disabled={priceDH < 10 || priceDH > 1000 || isLoading}
              >
                <Text style={s.btnPrimaryText}>
                  {isLoading ? 'Envoi...' : `Envoyer offre (${priceDH} DH)`}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = (colors: AppColors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  kav: { width: '100%' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 4, color: colors.text },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  suggested: { color: colors.primary, fontWeight: '700' },
  helpText: {
    fontSize: 12,
    color: '#B45F06',
    textAlign: 'center',
    backgroundColor: '#FFF4E5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  adjustBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustBtnText: { fontSize: 14, fontWeight: '700', color: colors.text },
  priceWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  priceInput: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textOnPrimary,
    minWidth: 60,
    textAlign: 'center',
    padding: 0,
  },
  priceUnit: { fontSize: 18, fontWeight: '700', color: colors.textOnPrimary },
  diffLabel: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 20,
  },
  diffNeutral: { color: colors.textSecondary },
  diffPositive: { color: '#34C759' },
  diffNegative: { color: colors.danger },
  actions: { flexDirection: 'row', gap: 10 },
  btnSecondary: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
  },
  btnSecondaryText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  btnPrimary: {
    flex: 2,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  btnPrimaryText: { color: colors.textOnPrimary, fontSize: 15, fontWeight: '700' },
});