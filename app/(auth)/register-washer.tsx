import { useState } from 'react';
import { useColors, AppColors } from '../../src/theme/colors';
import {
  View, Text, TextInput, Pressable, StyleSheet, Alert,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../src/api/auth';
import { sendOtp } from '../../src/services/firebaseAuth';
import PhoneInput from '../../src/components/PhoneInput';

type EquipmentType = 'TRIPORTEUR' | 'MINIVAN' | 'MOBILE';

const EQUIPMENT_OPTIONS: { value: EquipmentType; label: string; emoji: string; desc: string }[] = [
  { value: 'TRIPORTEUR', label: 'Triporteur', emoji: '🛺', desc: 'Triporteur motorisé' },
  { value: 'MINIVAN', label: 'Mini Van', emoji: '🚐', desc: 'Mini van ou utilitaire' },
  { value: 'MOBILE', label: 'Mobile', emoji: '🧽', desc: 'Matériel portatif (moto, à pied...)' },
];

export default function RegisterWasherScreen() {
  const colors = useColors();
  const s = styles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ idToken?: string; step?: string; formDataJson?: string }>();

  const [step, setStep] = useState(params.step ? parseInt(params.step) : 1);

  const [form, setForm] = useState({ fullName: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const [equipmentType, setEquipmentType] = useState<EquipmentType | null>(null);
  const [licensePlate, setLicensePlate] = useState('');
  const [cinPhoto, setCinPhoto] = useState<string | null>(null);

  const savedForm = params.formDataJson ? JSON.parse(params.formDataJson) : null;
  const idToken = params.idToken;

  const mutation = useMutation({
    mutationFn: authApi.registerWasher,
    onSuccess: () => router.replace('/(auth)/washer-pending'),
    onError: (err: any) => {
      console.error('Washer registration error:', err.response?.status, err.response?.data, err.message);
      const msg = err.response?.data?.message;
      Alert.alert('Erreur', Array.isArray(msg) ? msg.join('\n') : msg ?? err.message ?? 'Inscription impossible');
    },
  });

  const handleStep1 = async () => {
    if (!form.fullName.trim()) return Alert.alert('Erreur', 'Entrez votre nom complet');
    if (!form.phone || form.phone.length < 8) return Alert.alert('Erreur', 'Entrez votre numéro de téléphone');
    if (form.password.length < 8) return Alert.alert('Erreur', 'Mot de passe minimum 8 caractères');

    setIsSendingOtp(true);
    try {
      const confirmation = await sendOtp(form.phone);
      router.push({
        pathname: '/(auth)/otp',
        params: {
          phone: form.phone,
          role: 'washer',
          confirmationJson: JSON.stringify(confirmation),
          formDataJson: JSON.stringify(form),
        },
      });
    } catch {
      Alert.alert('Erreur', "Impossible d'envoyer le SMS.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleStep2 = () => {
    if (!equipmentType) return Alert.alert('Erreur', "Choisissez un type d'équipement");
    if (equipmentType !== 'MOBILE' && !licensePlate.trim()) {
      return Alert.alert('Erreur', "Entrez la plaque d'immatriculation");
    }
    setStep(3);
  };

  const pickCinPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission requise', "Autorisez l'accès à la caméra");
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setCinPhoto(result.assets[0].uri);
  };

  const handleStep3 = () => {
    if (!cinPhoto) return Alert.alert('Erreur', 'Prenez une photo de votre CIN');
    const formData = savedForm ?? form;
    mutation.mutate({
      fullName: formData.fullName,
      phone: formData.phone,
      password: formData.password,
      equipmentType: equipmentType!,
      licensePlate: licensePlate || undefined,
      cinPhotoUri: cinPhoto,
      firebaseIdToken: idToken!,
    });
  };

  const currentStep = idToken ? Math.max(step, 2) : step;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.progressBar}>
        {[1, 2, 3].map((step) => (
          <View key={step} style={[s.progressStep, currentStep >= step && s.progressStepActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

        {/* ─── Étape 1 ─── */}
        {currentStep === 1 && (
          <>
            <Text style={s.title}>Devenir laveur</Text>
            <Text style={s.subtitle}>Étape 1 — Informations personnelles</Text>

            <TextInput
              style={s.input}
              placeholder="Nom complet"
              placeholderTextColor={colors.textPlaceholder}
              value={form.fullName}
              onChangeText={(v) => setForm({ ...form, fullName: v })}
            />

            <PhoneInput
              value=""
              onChangePhone={(fullPhone) => setForm({ ...form, phone: fullPhone })}
            />

            <View style={s.passwordWrapper}>
              <TextInput
                style={s.passwordInput}
                placeholder="Mot de passe (8 car. min)"
                placeholderTextColor={colors.textPlaceholder}
                value={form.password}
                onChangeText={(v) => setForm({ ...form, password: v })}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable style={s.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                <Text style={s.eyeText}>{showPassword ? 'Cacher' : 'Voir'}</Text>
              </Pressable>
            </View>

            <Pressable
              style={[s.button, isSendingOtp && { opacity: 0.6 }]}
              onPress={handleStep1}
              disabled={isSendingOtp}
            >
              {isSendingOtp
                ? <ActivityIndicator color={colors.textOnPrimary} />
                : <Text style={s.buttonText}>Continuer → Vérifier le téléphone</Text>}
            </Pressable>

            <Pressable onPress={() => router.back()} style={s.backBtn}>
              <Text style={s.backText}>← Retour</Text>
            </Pressable>
          </>
        )}

        {/* ─── Étape 2 ─── */}
        {currentStep === 2 && (
          <>
            <Text style={s.title}>Votre équipement</Text>
            <Text style={s.subtitle}>Étape 2 — Type d'équipement de lavage</Text>

            {EQUIPMENT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[s.equipCard, equipmentType === opt.value && s.equipCardActive]}
                onPress={() => setEquipmentType(opt.value)}
              >
                <Text style={s.equipEmoji}>{opt.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.equipLabel, equipmentType === opt.value && s.equipLabelActive]}>
                    {opt.label}
                  </Text>
                  <Text style={s.equipDesc}>{opt.desc}</Text>
                </View>
                <View style={[s.radio, equipmentType === opt.value && s.radioActive]}>
                  {equipmentType === opt.value && <View style={s.radioDot} />}
                </View>
              </Pressable>
            ))}

            {equipmentType && equipmentType !== 'MOBILE' && (
              <TextInput
                style={[s.input, { marginTop: 12 }]}
                placeholder="Plaque d'immatriculation"
                placeholderTextColor={colors.textPlaceholder}
                value={licensePlate}
                onChangeText={setLicensePlate}
                autoCapitalize="characters"
              />
            )}

            <Pressable style={s.button} onPress={handleStep2}>
              <Text style={s.buttonText}>Continuer →</Text>
            </Pressable>
          </>
        )}

        {/* ─── Étape 3 ─── */}
        {currentStep === 3 && (
          <>
            <Text style={s.title}>Pièce d'identité</Text>
            <Text style={s.subtitle}>Étape 3 — Photo de votre CIN</Text>

            <View style={s.cinInfo}>
              <Text style={s.cinInfoText}>
                📋 Prenez une photo claire de votre Carte d'Identité Nationale.{'\n'}
                Elle sera vérifiée par notre équipe dans les 24h.
              </Text>
            </View>

            {cinPhoto ? (
              <View style={s.cinPreview}>
                <Image source={{ uri: cinPhoto }} style={s.cinImage} resizeMode="cover" />
                <Pressable style={s.retakeBtn} onPress={pickCinPhoto}>
                  <Text style={s.retakeText}>📷 Reprendre la photo</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={s.cinBtn} onPress={pickCinPhoto}>
                <Text style={s.cinBtnEmoji}>📷</Text>
                <Text style={s.cinBtnText}>Prendre une photo de ma CIN</Text>
              </Pressable>
            )}

            <Pressable
              style={[s.button, (!cinPhoto || mutation.isPending) && { opacity: 0.6 }]}
              onPress={handleStep3}
              disabled={!cinPhoto || mutation.isPending}
            >
              {mutation.isPending
                ? <ActivityIndicator color={colors.textOnPrimary} />
                : <Text style={s.buttonText}>Envoyer ma demande ✅</Text>}
            </Pressable>

            <Pressable onPress={() => setStep(2)} style={s.backBtn}>
              <Text style={s.backText}>← Étape précédente</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (colors: AppColors) => StyleSheet.create({
  progressBar: { flexDirection: 'row', gap: 8, padding: 20, paddingBottom: 0 },
  progressStep: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  progressStepActive: { backgroundColor: colors.primary },
  container: { padding: 24, paddingTop: 24, flexGrow: 1 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
  input: {
    backgroundColor: colors.inputBackground, padding: 16,
    borderRadius: 12, marginBottom: 12, fontSize: 16,
  },
  passwordWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.inputBackground, borderRadius: 12,
    paddingRight: 4, marginBottom: 12,
  },
  passwordInput: { flex: 1, padding: 16, fontSize: 16 },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 12 },
  eyeText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  equipCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: colors.inputBackground, borderRadius: 14, marginBottom: 10,
    borderWidth: 2, borderColor: 'transparent', gap: 14,
  },
  equipCardActive: { borderColor: colors.primary, backgroundColor: '#E8F1FF' },
  equipEmoji: { fontSize: 32 },
  equipLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  equipLabelActive: { color: colors.primary },
  equipDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.textPlaceholder,
    justifyContent: 'center', alignItems: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  cinInfo: {
    backgroundColor: '#FFF8E1', padding: 16, borderRadius: 12,
    marginBottom: 20, borderWidth: 1, borderColor: '#FFE082',
  },
  cinInfoText: { color: '#664500', fontSize: 14, lineHeight: 20 },
  cinBtn: {
    backgroundColor: colors.inputBackground, padding: 32, borderRadius: 14,
    alignItems: 'center', marginBottom: 20,
    borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
  },
  cinBtnEmoji: { fontSize: 48, marginBottom: 12 },
  cinBtnText: { fontSize: 16, color: colors.text, fontWeight: '600' },
  cinPreview: { marginBottom: 20, borderRadius: 14, overflow: 'hidden' },
  cinImage: { width: '100%', height: 200 },
  retakeBtn: { backgroundColor: colors.inputBackground, padding: 12, alignItems: 'center' },
  retakeText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  button: {
    backgroundColor: colors.primary, padding: 16,
    borderRadius: 12, alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: colors.textOnPrimary, fontSize: 16, fontWeight: '600' },
  backBtn: { marginTop: 16, alignItems: 'center' },
  backText: { color: colors.textSecondary, fontSize: 14 },
});