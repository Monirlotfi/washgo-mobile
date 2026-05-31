import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../src/api/auth';
import { useAuthStore } from '../../src/stores/auth.store';
import { registerForPushNotifications } from '../../src/services/pushNotifications';
import PhoneInput from '../../src/components/PhoneInput';

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      await setAuth(data.user, data.accessToken);
      registerForPushNotifications().catch((err) => {
        console.error('Erreur push token:', err);
      });
      if (data.user.role === 'WASHER') {
        router.replace('/(washer)/dashboard');
      } else {
        router.replace('/(client)/home');
      }
    },
    onError: (err: any) => {
      Alert.alert('Erreur', err.response?.data?.message ?? 'Impossible de se connecter');
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>WashGo</Text>
        <Text style={styles.subtitle}>Lavage auto à domicile</Text>

        <PhoneInput
          value=""
          onChangePhone={(fullPhone) => setPhone(fullPhone)}
        />

        <View style={styles.passwordWrapper}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <Pressable
            style={styles.eyeBtn}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={10}
          >
            <Text style={styles.eyeText}>{showPassword ? 'Cacher' : 'Voir'}</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.button, mutation.isPending && styles.buttonDisabled]}
          onPress={() => mutation.mutate({ phone, password })}
          disabled={mutation.isPending}
        >
          <Text style={styles.buttonText}>
            {mutation.isPending ? 'Connexion...' : 'Se connecter'}
          </Text>
        </Pressable>

        <Link href="/(auth)/register" asChild>
          <Pressable>
            <Text style={styles.link}>
              Pas de compte ? <Text style={styles.linkBold}>Créer un compte</Text>
            </Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 40, fontWeight: '800', textAlign: 'center', color: '#0066FF' },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 40 },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
    borderRadius: 12,
    paddingRight: 4,
    marginBottom: 12,
  },
  passwordInput: { flex: 1, padding: 16, fontSize: 16 },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 12 },
  eyeText: { color: '#0066FF', fontSize: 13, fontWeight: '600' },
  button: {
    backgroundColor: '#0066FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', marginTop: 20, color: '#666', fontSize: 14 },
  linkBold: { color: '#0066FF', fontWeight: '600' },
});