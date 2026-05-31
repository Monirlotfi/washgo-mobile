import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useAuthStore } from '../../src/stores/auth.store';
import { useUpdateProfile, useChangePassword } from '../../src/hooks/useUser';

export default function ClientProfileScreen() {
  return <SharedProfileScreen />;
}

export function SharedProfileScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const onSaveProfile = () => {
    updateProfile.mutate(
      { fullName, email: email || undefined },
      {
        onSuccess: () => Alert.alert('Profil mis à jour ✅'),
        onError: (err: any) => {
          const msg = err.response?.data?.message;
          Alert.alert('Erreur', Array.isArray(msg) ? msg.join('\n') : msg ?? 'Erreur');
        },
      },
    );
  };

  const onChangePwd = () => {
    if (newPwd.length < 8) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit faire 8 caractères minimum');
      return;
    }
    if (currentPwd.length < 8) {
      Alert.alert('Erreur', 'Mot de passe actuel manquant');
      return;
    }
    changePassword.mutate(
      { currentPassword: currentPwd, newPassword: newPwd },
      {
        onSuccess: () => {
          setCurrentPwd('');
          setNewPwd('');
          setShowCurrentPwd(false);
          setShowNewPwd(false);
          Alert.alert('Mot de passe changé ✅');
        },
        onError: (err: any) => {
          const status = err.response?.status;
          const msg = err.response?.data?.message;
          if (status === 401) {
            Alert.alert('Mot de passe actuel incorrect', 'Vérifiez votre mot de passe actuel.');
          } else {
            Alert.alert('Erreur', Array.isArray(msg) ? msg.join('\n') : msg ?? 'Erreur');
          }
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>Mon profil</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Informations</Text>

          <Text style={styles.label}>Téléphone (non modifiable)</Text>
          <View style={[styles.input, styles.inputDisabled]}>
            <Text style={styles.disabledText}>{user?.phone}</Text>
          </View>

          <Text style={styles.label}>Nom complet</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Votre nom"
          />

          <Text style={styles.label}>Email (optionnel)</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="email@exemple.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Pressable
            style={[styles.btn, updateProfile.isPending && { opacity: 0.5 }]}
            onPress={onSaveProfile}
            disabled={updateProfile.isPending}
          >
            <Text style={styles.btnText}>
              {updateProfile.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Text>
          </Pressable>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Changer mon mot de passe</Text>

          <Text style={styles.label}>Mot de passe actuel</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              value={currentPwd}
              onChangeText={setCurrentPwd}
              secureTextEntry={!showCurrentPwd}
              autoCapitalize="none"
            />
            <Pressable
              style={styles.eyeBtn}
              onPress={() => setShowCurrentPwd(!showCurrentPwd)}
              hitSlop={10}
            >
              <Text style={styles.eyeText}>
                {showCurrentPwd ? 'Cacher' : 'Voir'}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Nouveau mot de passe</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              value={newPwd}
              onChangeText={setNewPwd}
              secureTextEntry={!showNewPwd}
              autoCapitalize="none"
              placeholder="8 caractères minimum"
            />
            <Pressable
              style={styles.eyeBtn}
              onPress={() => setShowNewPwd(!showNewPwd)}
              hitSlop={10}
            >
              <Text style={styles.eyeText}>
                {showNewPwd ? 'Cacher' : 'Voir'}
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={[
              styles.btn,
              (changePassword.isPending || !currentPwd || !newPwd) && { opacity: 0.5 },
            ]}
            onPress={onChangePwd}
            disabled={changePassword.isPending || !currentPwd || !newPwd}
          >
            <Text style={styles.btnText}>
              {changePassword.isPending ? 'Modification...' : 'Modifier le mot de passe'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 4,
    borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  menuIcon: { fontSize: 28, color: '#333' },
  topBarTitle: { fontSize: 17, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14 },
  label: { fontSize: 13, color: '#666', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#F4F5F7', padding: 14, borderRadius: 10, fontSize: 15,
  },
  inputDisabled: { opacity: 0.6, justifyContent: 'center' },
  disabledText: { fontSize: 15, color: '#666' },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
    borderRadius: 10,
    paddingRight: 4,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 15,
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  eyeText: {
    color: '#0066FF',
    fontSize: 13,
    fontWeight: '600',
  },
  btn: {
    backgroundColor: '#0066FF', padding: 14, borderRadius: 10,
    alignItems: 'center', marginTop: 20,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 30 },
});