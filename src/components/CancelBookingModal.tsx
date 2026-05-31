import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CancellationReason } from '../types/api.types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: CancellationReason, customReason?: string) => void;
  isLoading?: boolean;
}

const REASONS: { value: CancellationReason; label: string }[] = [
  { value: 'CONFLICT_WITH_WASHER', label: 'Conflit avec le laveur' },
  { value: 'WASHER_LATE', label: 'Le laveur a tardé' },
  { value: 'CHANGED_MIND', label: "J'ai changé d'avis" },
  { value: 'OTHER', label: 'Autre' },
];

export default function CancelBookingModal({
  visible,
  onClose,
  onConfirm,
  isLoading,
}: Props) {
  const [selected, setSelected] = useState<CancellationReason | null>(null);
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected, selected === 'OTHER' ? customReason : undefined);
  };

  const reset = () => {
    setSelected(null);
    setCustomReason('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        reset();
        onClose();
      }}
    >
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.title}>Annuler la réservation</Text>
            <Text style={styles.subtitle}>
              Pourquoi annulez-vous cette réservation ?
            </Text>

            {REASONS.map((r) => (
              <Pressable
                key={r.value}
                style={[styles.option, selected === r.value && styles.optionSelected]}
                onPress={() => setSelected(r.value)}
              >
                <View
                  style={[
                    styles.radio,
                    selected === r.value && styles.radioSelected,
                  ]}
                >
                  {selected === r.value && <View style={styles.radioDot} />}
                </View>
                <Text
                  style={[
                    styles.optionLabel,
                    selected === r.value && styles.optionLabelSelected,
                  ]}
                >
                  {r.label}
                </Text>
              </Pressable>
            ))}

            {selected === 'OTHER' && (
              <TextInput
                style={styles.customInput}
                placeholder="Précisez le motif (optionnel)"
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                maxLength={500}
              />
            )}

            <View style={styles.actions}>
              <Pressable
                style={[styles.btnSecondary, isLoading && { opacity: 0.5 }]}
                onPress={() => {
                  reset();
                  onClose();
                }}
                disabled={isLoading}
              >
                <Text style={styles.btnSecondaryText}>Retour</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.btnDanger,
                  (!selected || isLoading) && { opacity: 0.5 },
                ]}
                onPress={handleConfirm}
                disabled={!selected || isLoading}
              >
                <Text style={styles.btnDangerText}>
                  {isLoading ? 'Annulation...' : 'Confirmer'}
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  kav: { width: '100%' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#DDD', alignSelf: 'center', marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F4F5F7',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: { backgroundColor: '#FFE5E5', borderColor: '#FF3B30' },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: '#999', marginRight: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  radioSelected: { borderColor: '#FF3B30' },
  radioDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF3B30',
  },
  optionLabel: { fontSize: 15, color: '#333', flex: 1 },
  optionLabelSelected: { color: '#C62828', fontWeight: '600' },
  customInput: {
    backgroundColor: '#F4F5F7', padding: 14, borderRadius: 10,
    fontSize: 15, marginTop: 4, marginBottom: 8, minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btnSecondary: {
    flex: 1, padding: 14, borderRadius: 10,
    alignItems: 'center', backgroundColor: '#F4F5F7',
  },
  btnSecondaryText: { color: '#333', fontSize: 15, fontWeight: '600' },
  btnDanger: {
    flex: 1, padding: 14, borderRadius: 10,
    alignItems: 'center', backgroundColor: '#FF3B30',
  },
  btnDangerText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});