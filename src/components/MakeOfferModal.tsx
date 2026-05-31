import { useEffect, useState } from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';

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
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <Text style={styles.title}>Faire une offre</Text>
            <Text style={styles.subtitle}>
              Prix suggéré : <Text style={styles.suggested}>{suggestedDH} DH</Text>
            </Text>
            <Text style={styles.helpText}>
              ⚠️ Une fois envoyée, l'offre est finale et ne peut pas être modifiée ni annulée jusqu'à expiration.
            </Text>

            <View style={styles.priceContainer}>
              <Pressable
                style={styles.adjustBtn}
                onPress={() => adjust(-10)}
                disabled={priceDH <= 10}
              >
                <Text style={styles.adjustBtnText}>-10</Text>
              </Pressable>
              <Pressable
                style={styles.adjustBtn}
                onPress={() => adjust(-5)}
                disabled={priceDH <= 10}
              >
                <Text style={styles.adjustBtnText}>-5</Text>
              </Pressable>

              <View style={styles.priceWrapper}>
                <TextInput
                  style={styles.priceInput}
                  value={String(priceDH)}
                  onChangeText={(v) => {
                    const num = parseInt(v.replace(/\D/g, '')) || 0;
                    setPriceDH(num);
                  }}
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <Text style={styles.priceUnit}>DH</Text>
              </View>

              <Pressable
                style={styles.adjustBtn}
                onPress={() => adjust(5)}
                disabled={priceDH >= 1000}
              >
                <Text style={styles.adjustBtnText}>+5</Text>
              </Pressable>
              <Pressable
                style={styles.adjustBtn}
                onPress={() => adjust(10)}
                disabled={priceDH >= 1000}
              >
                <Text style={styles.adjustBtnText}>+10</Text>
              </Pressable>
            </View>

            <Text
              style={[
                styles.diffLabel,
                diff > 0 ? styles.diffPositive : diff < 0 ? styles.diffNegative : styles.diffNeutral,
              ]}
            >
              {diffLabel}
            </Text>

            <View style={styles.actions}>
              <Pressable
                style={[styles.btnSecondary, isLoading && { opacity: 0.5 }]}
                onPress={onClose}
                disabled={isLoading}
              >
                <Text style={styles.btnSecondaryText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.btnPrimary,
                  (priceDH < 10 || priceDH > 1000 || isLoading) && { opacity: 0.5 },
                ]}
                onPress={handleConfirm}
                disabled={priceDH < 10 || priceDH > 1000 || isLoading}
              >
                <Text style={styles.btnPrimaryText}>
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  kav: { width: '100%' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  suggested: { color: '#0066FF', fontWeight: '700' },
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
    backgroundColor: '#F4F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustBtnText: { fontSize: 14, fontWeight: '700', color: '#333' },
  priceWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  priceInput: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    minWidth: 60,
    textAlign: 'center',
    padding: 0,
  },
  priceUnit: { fontSize: 18, fontWeight: '700', color: '#fff' },
  diffLabel: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 20,
  },
  diffNeutral: { color: '#666' },
  diffPositive: { color: '#34C759' },
  diffNegative: { color: '#FF3B30' },
  actions: { flexDirection: 'row', gap: 10 },
  btnSecondary: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
  },
  btnSecondaryText: { color: '#333', fontSize: 15, fontWeight: '600' },
  btnPrimary: {
    flex: 2,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#0066FF',
  },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});