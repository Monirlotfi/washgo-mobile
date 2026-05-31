import { useState } from 'react';
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
      const msg = err.response?.data?.message;
      Alert.alert('Erreur', Array.isArray(msg) ? msg.join('\n') : msg ?? 'Inscription impossible');
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
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.progressBar}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={[styles.progressStep, currentStep >= s && styles.progressStepActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* ─── Étape 1 ─── */}
        {currentStep === 1 && (
          <>
            <Text style={styles.title}>Devenir laveur</Text>
            <Text style={styles.subtitle}>Étape 1 — Informations personnelles</Text>

            <TextInput
              style={styles.input}
              placeholder="Nom complet"
              value={form.fullName}
              onChangeText={(v) => setForm({ ...form, fullName: v })}
            />

            <PhoneInput
              value=""
              onChangePhone={(fullPhone) => setForm({ ...form, phone: fullPhone })}
            />

            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Mot de passe (8 car. min)"
                value={form.password}
                onChangeText={(v) => setForm({ ...form, password: v })}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeText}>{showPassword ? 'Cacher' : 'Voir'}</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.button, isSendingOtp && { opacity: 0.6 }]}
              onPress={handleStep1}
              disabled={isSendingOtp}
            >
              {isSendingOtp
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Continuer → Vérifier le téléphone</Text>}
            </Pressable>

            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Retour</Text>
            </Pressable>
          </>
        )}

        {/* ─── Étape 2 ─── */}
        {currentStep === 2 && (
          <>
            <Text style={styles.title}>Votre équipement</Text>
            <Text style={styles.subtitle}>Étape 2 — Type d'équipement de lavage</Text>

            {EQUIPMENT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.equipCard, equipmentType === opt.value && styles.equipCardActive]}
                onPress={() => setEquipmentType(opt.value)}
              >
                <Text style={styles.equipEmoji}>{opt.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.equipLabel, equipmentType === opt.value && styles.equipLabelActive]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.equipDesc}>{opt.desc}</Text>
                </View>
                <View style={[styles.radio, equipmentType === opt.value && styles.radioActive]}>
                  {equipmentType === opt.value && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            ))}

            {equipmentType && equipmentType !== 'MOBILE' && (
              <TextInput
                style={[styles.input, { marginTop: 12 }]}
                placeholder="Plaque d'immatriculation"
                value={licensePlate}
                onChangeText={setLicensePlate}
                autoCapitalize="characters"
              />
            )}

            <Pressable style={styles.button} onPress={handleStep2}>
              <Text style={styles.buttonText}>Continuer →</Text>
            </Pressable>
          </>
        )}

        {/* ─── Étape 3 ─── */}
        {currentStep === 3 && (
          <>
            <Text style={styles.title}>Pièce d'identité</Text>
            <Text style={styles.subtitle}>Étape 3 — Photo de votre CIN</Text>

            <View style={styles.cinInfo}>
              <Text style={styles.cinInfoText}>
                📋 Prenez une photo claire de votre Carte d'Identité Nationale.{'\n'}
                Elle sera vérifiée par notre équipe dans les 24h.
              </Text>
            </View>

            {cinPhoto ? (
              <View style={styles.cinPreview}>
                <Image source={{ uri: cinPhoto }} style={styles.cinImage} resizeMode="cover" />
                <Pressable style={styles.retakeBtn} onPress={pickCinPhoto}>
                  <Text style={styles.retakeText}>📷 Reprendre la photo</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.cinBtn} onPress={pickCinPhoto}>
                <Text style={styles.cinBtnEmoji}>📷</Text>
                <Text style={styles.cinBtnText}>Prendre une photo de ma CIN</Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.button, (!cinPhoto || mutation.isPending) && { opacity: 0.6 }]}
              onPress={handleStep3}
              disabled={!cinPhoto || mutation.isPending}
            >
              {mutation.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Envoyer ma demande ✅</Text>}
            </Pressable>

            <Pressable onPress={() => setStep(2)} style={styles.backBtn}>
              <Text style={styles.backText}>← Étape précédente</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  progressBar: { flexDirection: 'row', gap: 8, padding: 20, paddingBottom: 0 },
  progressStep: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0' },
  progressStepActive: { backgroundColor: '#0066FF' },
  container: { padding: 24, paddingTop: 24, flexGrow: 1 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  input: {
    backgroundColor: '#F4F5F7', padding: 16,
    borderRadius: 12, marginBottom: 12, fontSize: 16,
  },
  passwordWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F4F5F7', borderRadius: 12,
    paddingRight: 4, marginBottom: 12,
  },
  passwordInput: { flex: 1, padding: 16, fontSize: 16 },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 12 },
  eyeText: { color: '#0066FF', fontSize: 13, fontWeight: '600' },
  equipCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: '#F4F5F7', borderRadius: 14, marginBottom: 10,
    borderWidth: 2, borderColor: 'transparent', gap: 14,
  },
  equipCardActive: { borderColor: '#0066FF', backgroundColor: '#E8F1FF' },
  equipEmoji: { fontSize: 32 },
  equipLabel: { fontSize: 16, fontWeight: '700', color: '#333' },
  equipLabelActive: { color: '#0066FF' },
  equipDesc: { fontSize: 13, color: '#666', marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#999',
    justifyContent: 'center', alignItems: 'center',
  },
  radioActive: { borderColor: '#0066FF' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0066FF' },
  cinInfo: {
    backgroundColor: '#FFF8E1', padding: 16, borderRadius: 12,
    marginBottom: 20, borderWidth: 1, borderColor: '#FFE082',
  },
  cinInfoText: { color: '#664500', fontSize: 14, lineHeight: 20 },
  cinBtn: {
    backgroundColor: '#F4F5F7', padding: 32, borderRadius: 14,
    alignItems: 'center', marginBottom: 20,
    borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed',
  },
  cinBtnEmoji: { fontSize: 48, marginBottom: 12 },
  cinBtnText: { fontSize: 16, color: '#333', fontWeight: '600' },
  cinPreview: { marginBottom: 20, borderRadius: 14, overflow: 'hidden' },
  cinImage: { width: '100%', height: 200 },
  retakeBtn: { backgroundColor: '#F4F5F7', padding: 12, alignItems: 'center' },
  retakeText: { color: '#0066FF', fontWeight: '600', fontSize: 14 },
  button: {
    backgroundColor: '#0066FF', padding: 16,
    borderRadius: 12, alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backBtn: { marginTop: 16, alignItems: 'center' },
  backText: { color: '#666', fontSize: 14 },
});