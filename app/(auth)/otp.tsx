import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { verifyOtp } from '../../src/services/firebaseAuth';

// Les params passés depuis l'écran précédent
type OtpParams = {
  phone: string;
  // Sérialisé en JSON string car expo-router ne passe que des strings
  confirmationJson: string;
  // 'client' | 'washer'
  role: string;
  // Données du formulaire sérialisées
  formDataJson: string;
};

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<OtpParams>();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const inputs = useRef<(TextInput | null)[]>([]);

  const confirmation: FirebaseAuthTypes.ConfirmationResult = JSON.parse(
    params.confirmationJson,
  );

  // Countdown pour renvoyer le code
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleChange = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus sur la case suivante
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit quand les 6 chiffres sont saisis
    if (newCode.every((c) => c !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (fullCode?: string) => {
    const otpCode = fullCode ?? code.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Erreur', 'Entrez les 6 chiffres du code');
      return;
    }

    setIsVerifying(true);
    try {
      const idToken = await verifyOtp(confirmation, otpCode);

      // Navigue vers la suite selon le rôle
      if (params.role === 'washer') {
        router.replace({
          pathname: '/(auth)/register-washer',
          params: {
            idToken,
            phone: params.phone,
            formDataJson: params.formDataJson,
            step: '2', // reprend à l'étape équipement
          },
        });
      } else {
        router.replace({
          pathname: '/(auth)/register',
          params: {
            idToken,
            phone: params.phone,
            formDataJson: params.formDataJson,
          },
        });
      }
    } catch (err: any) {
      Alert.alert('Code incorrect', 'Le code saisi est invalide ou expiré.');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Vérification</Text>
        <Text style={styles.subtitle}>
          Code envoyé au{'\n'}
          <Text style={styles.phone}>{params.phone}</Text>
        </Text>

        {/* Cases OTP */}
        <View style={styles.codeRow}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputs.current[index] = ref; }}
              style={[styles.codeInput, digit && styles.codeInputFilled]}
              value={digit}
              onChangeText={(v) => handleChange(v.slice(-1), index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              autoFocus={index === 0}
            />
          ))}
        </View>

        {isVerifying ? (
          <ActivityIndicator size="large" color="#0066FF" style={{ marginTop: 32 }} />
        ) : (
          <Pressable
            style={styles.button}
            onPress={() => handleVerify()}
          >
            <Text style={styles.buttonText}>Vérifier</Text>
          </Pressable>
        )}

        {/* Renvoi du code */}
        <Pressable
          style={styles.resendBtn}
          disabled={timeLeft > 0}
          onPress={() => {
            setTimeLeft(60);
            // TODO: renvoyer le code (rappeler sendOtp)
          }}
        >
          <Text style={[styles.resendText, timeLeft > 0 && styles.resendDisabled]}>
            {timeLeft > 0
              ? `Renvoyer dans ${timeLeft}s`
              : 'Renvoyer le code'}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Modifier le numéro</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40, lineHeight: 24 },
  phone: { fontWeight: '700', color: '#1A1A1A' },
  codeRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  codeInput: {
    width: 48, height: 56, borderRadius: 12,
    borderWidth: 2, borderColor: '#E0E0E0',
    textAlign: 'center', fontSize: 22, fontWeight: '700',
    backgroundColor: '#F4F5F7',
  },
  codeInputFilled: { borderColor: '#0066FF', backgroundColor: '#E8F1FF' },
  button: {
    backgroundColor: '#0066FF', padding: 16, borderRadius: 12,
    alignItems: 'center', width: '100%',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resendBtn: { marginTop: 20 },
  resendText: { color: '#0066FF', fontSize: 14, fontWeight: '600' },
  resendDisabled: { color: '#999' },
  backBtn: { marginTop: 16 },
  backText: { color: '#666', fontSize: 14 },
});