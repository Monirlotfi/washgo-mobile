import { useState } from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { WasherCancellationReason } from '../types/api.types';
import { useColors, AppColors } from '../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: WasherCancellationReason, customReason?: string) => void;
  isLoading?: boolean;
}

const REASONS: { value: WasherCancellationReason; label: string; emoji: string }[] = [
  { value: 'MECHANICAL_ISSUE', label: 'Panne du triporteur', emoji: '🔧' },
  { value: 'PERSONAL_EMERGENCY', label: 'Urgence personnelle', emoji: '🆘' },
  { value: 'HEALTH_ISSUE', label: 'Problème de santé', emoji: '🤒' },
  { value: 'OTHER', label: 'Autre force majeure', emoji: '⚠️' },
];

export default function WasherCancelModal({
  visible, onClose, onConfirm, isLoading,
}: Props) {
  const colors = useColors();
  const s = styles(colors);
  const [selected, setSelected] = useState<WasherCancellationReason | null>(null);
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
      onRequestClose={() => { reset(); onClose(); }}
    >
      <View style={s.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.kav}
        >
          <View style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.title}>Annuler la course</Text>
            <Text style={s.subtitle}>
              ⚠️ Cette action notifiera le client. Choisissez bien votre motif.
            </Text>

            {REASONS.map((r) => (
              <Pressable
                key={r.value}
                style={[s.option, selected === r.value && s.optionSelected]}
                onPress={() => setSelected(r.value)}
              >
                <Text style={s.optionEmoji}>{r.emoji}</Text>
                <Text
                  style={[
                    s.optionLabel,
                    selected === r.value && s.optionLabelSelected,
                  ]}
                >
                  {r.label}
                </Text>
                <View style={[s.radio, selected === r.value && s.radioSelected]}>
                  {selected === r.value && <View style={s.radioDot} />}
                </View>
              </Pressable>
            ))}

            {selected === 'OTHER' && (
              <TextInput
                style={s.customInput}
                placeholder="Précisez le motif"
                placeholderTextColor={colors.textPlaceholder}
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                maxLength={500}
              />
            )}

            <View style={s.actions}>
              <Pressable
                style={[s.btnSecondary, isLoading && { opacity: 0.5 }]}
                onPress={() => { reset(); onClose(); }}
                disabled={isLoading}
              >
                <Text style={s.btnSecondaryText}>Retour</Text>
              </Pressable>
              <Pressable
                style={[
                  s.btnDanger,
                  (!selected || isLoading) && { opacity: 0.5 },
                ]}
                onPress={handleConfirm}
                disabled={!selected || isLoading}
              >
                <Text style={s.btnDangerText}>
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

const styles = (colors: AppColors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  kav: { width: '100%' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 6, color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },
  option: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, backgroundColor: colors.inputBackground, borderRadius: 12,
    marginBottom: 10, borderWidth: 2, borderColor: 'transparent',
    gap: 12,
  },
  optionSelected: { backgroundColor: '#FFE5E5', borderColor: colors.danger },
  optionEmoji: { fontSize: 22 },
  optionLabel: { fontSize: 15, color: colors.text, flex: 1 },
  optionLabelSelected: { color: '#C62828', fontWeight: '600' },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.textPlaceholder,
    justifyContent: 'center', alignItems: 'center',
  },
  radioSelected: { borderColor: colors.danger },
  radioDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger,
  },
  customInput: {
    backgroundColor: colors.inputBackground, padding: 14, borderRadius: 10,
    fontSize: 15, marginTop: 4, marginBottom: 8, minHeight: 80,
    textAlignVertical: 'top', color: colors.text,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btnSecondary: {
    flex: 1, padding: 14, borderRadius: 10,
    alignItems: 'center', backgroundColor: colors.inputBackground,
  },
  btnSecondaryText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  btnDanger: {
    flex: 1, padding: 14, borderRadius: 10,
    alignItems: 'center', backgroundColor: colors.danger,
  },
  btnDangerText: { color: colors.textOnPrimary, fontSize: 15, fontWeight: '700' },
});