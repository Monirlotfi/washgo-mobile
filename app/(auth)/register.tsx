import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Alert,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter, Link, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../src/api/auth';
import { useAuthStore } from '../../src/stores/auth.store';
import { registerForPushNotifications } from '../../src/services/pushNotifications';
import { sendOtp } from '../../src/services/firebaseAuth';
import PhoneInput from '../../src/components/PhoneInput';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ idToken?: string; phone?: string; formDataJson?: string }>();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  useEffect(() => {
    if (params.idToken && params.formDataJson) {
      const formData = JSON.parse(params.formDataJson);
      mutation.mutate({ ...formData, firebaseIdToken: params.idToken });
    }
  }, [params.idToken]);

  const mutation = useMutation({
    mutationFn: authApi.registerClient,
    onSuccess: async (data) => {
      await setAuth(data.user, data.accessToken);
      registerForPushNotifications().catch(console.error);
      router.replace('/(client)/home');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      Alert.alert('Erreur', Array.isArray(msg) ? msg.join('\n') : msg ?? 'Inscription impossible');
    },
  });

  const handleSendOtp = async () => {
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
          role: 'client',
          confirmationJson: JSON.stringify(confirmation),
          formDataJson: JSON.stringify({
            fullName: form.fullName,
            phone: form.phone,
            email: form.email || undefined,
            password: form.password,
          }),
        },
      });
    } catch {
      Alert.alert('Erreur', "Impossible d'envoyer le SMS. Vérifiez le numéro.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Client</Text>

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

        <TextInput
          style={styles.input}
          placeholder="Email (optionnel)"
          value={form.email}
          onChangeText={(v) => setForm({ ...form, email: v })}
          keyboardType="email-address"
          autoCapitalize="none"
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
          <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
            <Text style={styles.eyeText}>{showPassword ? 'Cacher' : 'Voir'}</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.button, (isSendingOtp || mutation.isPending) && { opacity: 0.6 }]}
          onPress={handleSendOtp}
          disabled={isSendingOtp || mutation.isPending}
        >
          {isSendingOtp
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Continuer → Vérifier le téléphone</Text>}
        </Pressable>

        <Link href="/(auth)/login" asChild>
          <Pressable>
            <Text style={styles.link}>
              Déjà un compte ? <Text style={styles.linkBold}>Se connecter</Text>
            </Text>
          </Pressable>
        </Link>

        <Link href="/(auth)/register-washer" asChild>
          <Pressable style={styles.washerLink}>
            <Text style={styles.washerLinkText}>
              🧽 Vous êtes laveur ? <Text style={styles.linkBold}>Rejoindre en tant que laveur</Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 80, flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 24 },
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
  button: {
    backgroundColor: '#0066FF', padding: 16,
    borderRadius: 12, alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', marginTop: 20, color: '#666', fontSize: 14 },
  linkBold: { color: '#0066FF', fontWeight: '600' },
  washerLink: { marginTop: 12 },
  washerLinkText: { textAlign: 'center', color: '#666', fontSize: 14 },
});