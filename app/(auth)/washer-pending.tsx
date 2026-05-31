import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';

export default function WasherPendingScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>⏳</Text>
      <Text style={styles.title}>Demande envoyée !</Text>
      <Text style={styles.subtitle}>
        Notre équipe va vérifier votre identité et activer votre compte dans les{' '}
        <Text style={styles.bold}>24 heures</Text>.{'\n\n'}
        Vous recevrez une notification dès que votre compte sera activé.
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📋 Ce qui va se passer</Text>
        <Text style={styles.infoText}>1. Vérification de votre CIN</Text>
        <Text style={styles.infoText}>2. Validation de votre équipement</Text>
        <Text style={styles.infoText}>3. Activation de votre compte</Text>
        <Text style={styles.infoText}>4. Notification push sur votre téléphone</Text>
      </View>

      <Pressable
        style={styles.btn}
        onPress={async () => {
          await logout();
          router.replace('/(auth)/login');
        }}
      >
        <Text style={styles.btnText}>Retour à l'accueil</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#fff',
    padding: 24, justifyContent: 'center', alignItems: 'center',
  },
  emoji: { fontSize: 80, marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  subtitle: {
    fontSize: 15, color: '#666', textAlign: 'center',
    lineHeight: 22, marginBottom: 32,
  },
  bold: { fontWeight: '700', color: '#1A1A1A' },
  infoCard: {
    backgroundColor: '#F0F4FF', padding: 20, borderRadius: 14,
    width: '100%', marginBottom: 32, gap: 8,
  },
  infoTitle: { fontSize: 15, fontWeight: '700', color: '#0066FF', marginBottom: 4 },
  infoText: { fontSize: 14, color: '#333' },
  btn: {
    backgroundColor: '#0066FF', padding: 16,
    borderRadius: 12, alignItems: 'center', width: '100%',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});