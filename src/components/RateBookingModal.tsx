import { useState, useEffect } from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import StarRating from './StarRating';
import { useColors, AppColors } from '../theme/colors';

interface Props {
  visible: boolean;
  washerName: string;
  onClose: () => void;
  onSubmit: (score: number, comment?: string) => void;
  isLoading?: boolean;
}

export default function RateBookingModal({
  visible,
  washerName,
  onClose,
  onSubmit,
  isLoading,
}: Props) {
  const colors = useColors();
  const s = styles(colors);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (visible) {
      setScore(0);
      setComment('');
    }
  }, [visible]);

  const handleSubmit = () => {
    if (score === 0) {
      Alert.alert('Note manquante', 'Veuillez sélectionner une note.');
      return;
    }
    onSubmit(score, comment.trim() || undefined);
  };

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

            <Text style={s.title}>Comment s'est passé le lavage ?</Text>
            <Text style={s.subtitle}>
              Évaluez le service de <Text style={s.washerName}>{washerName}</Text>
            </Text>

            <View style={s.starsContainer}>
              <StarRating value={score} onChange={setScore} size={48} />
              {score > 0 && (
                <Text style={s.scoreLabel}>{scoreLabel(score)}</Text>
              )}
            </View>

            <TextInput
              style={s.commentInput}
              placeholder="Un commentaire pour le laveur ? (optionnel)"
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={500}
              placeholderTextColor={colors.textPlaceholder}
            />

            <View style={s.actions}>
              <Pressable
                style={[s.btnSecondary, isLoading && { opacity: 0.5 }]}
                onPress={onClose}
                disabled={isLoading}
              >
                <Text style={s.btnSecondaryText}>Plus tard</Text>
              </Pressable>
              <Pressable
                style={[
                  s.btnPrimary,
                  (score === 0 || isLoading) && { opacity: 0.5 },
                ]}
                onPress={handleSubmit}
                disabled={score === 0 || isLoading}
              >
                <Text style={s.btnPrimaryText}>
                  {isLoading ? 'Envoi...' : 'Envoyer'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function scoreLabel(score: number): string {
  return ({
    1: '😞 Très insatisfait',
    2: '🙁 Insatisfait',
    3: '😐 Correct',
    4: '🙂 Satisfait',
    5: '😍 Excellent !',
  } as Record<number, string>)[score] ?? '';
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  washerName: { color: colors.primary, fontWeight: '600' },
  starsContainer: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
  },
  commentInput: {
    backgroundColor: colors.inputBackground,
    padding: 14,
    borderRadius: 10,
    fontSize: 15,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 18,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  btnSecondary: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
  },
  btnSecondaryText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  btnPrimary: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  btnPrimaryText: {
    color: colors.textOnPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});