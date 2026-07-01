import auth from '@react-native-firebase/auth';

// Silence Firebase v24 namespaced API deprecation warnings
if (!globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS) {
  globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
}

let confirmationResult: any = null;

/**
 * Normalise le numéro en format E.164
 * +212 662778299 → +212662778299
 * 0662778299 → +212662778299 (fallback Maroc)
 */
export function normalizePhone(dialCode: string, localNumber: string): string {
  const cleaned = localNumber.replace(/[^0-9]/g, '').replace(/^0+/, '');
  return `${dialCode}${cleaned}`;
}

export async function sendOtp(fullPhone: string) {
  console.log('📱 Envoi OTP vers:', fullPhone);
  try {
    confirmationResult = await auth().signInWithPhoneNumber(fullPhone);
    console.log('✅ OTP envoyé');
    return confirmationResult;
  } catch (err: any) {
    console.error('❌ Erreur Firebase OTP:', err.code, err.message);
    throw err;
  }
}

export async function verifyOtp(code: string): Promise<string> {
  if (!confirmationResult) {
    throw new Error("Aucune session d'authentification OTP trouvée.");
  }
  const credential = await confirmationResult.confirm(code);
  if (!credential?.user) throw new Error('Vérification échouée');
  const idToken = await credential.user.getIdToken();
  await auth().signOut();
  return idToken;
}