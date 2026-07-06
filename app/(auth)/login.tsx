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
import { useColors, AppColors } from '../../src/theme/colors';

export default function LoginScreen() {
  const colors = useColors();
  const s = styles(colors);
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
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.inner}>
        <Text style={s.title}>WashGo</Text>
        <Text style={s.subtitle}>Lavage auto à domicile</Text>

        <PhoneInput
          value=""
          onChangePhone={(fullPhone) => setPhone(fullPhone)}
        />

        <View style={s.passwordWrapper}>
          <TextInput
            style={s.passwordInput}
            placeholder="Mot de passe"
            placeholderTextColor={colors.textPlaceholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <Pressable
            style={s.eyeBtn}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={10}
          >
            <Text style={s.eyeText}>{showPassword ? 'Cacher' : 'Voir'}</Text>
          </Pressable>
        </View>

        <Pressable
          style={[s.button, mutation.isPending && s.buttonDisabled]}
          onPress={() => mutation.mutate({ phone, password })}
          disabled={mutation.isPending}
        >
          <Text style={s.buttonText}>
            {mutation.isPending ? 'Connexion...' : 'Se connecter'}
          </Text>
        </Pressable>

        <Link href="/(auth)/register" asChild>
          <Pressable>
            <Text style={s.link}>
              Pas de compte ? <Text style={s.linkBold}>Créer un compte</Text>
            </Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 40, fontWeight: '800', textAlign: 'center', color: colors.primary },
  subtitle: { fontSize: 16, textAlign: 'center', color: colors.textSecondary, marginBottom: 40 },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingRight: 4,
    marginBottom: 12,
  },
  passwordInput: { flex: 1, padding: 16, fontSize: 16, color: colors.text },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 12 },
  eyeText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.textOnPrimary, fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', marginTop: 20, color: colors.textSecondary, fontSize: 14 },
  linkBold: { color: colors.primary, fontWeight: '600' },
});