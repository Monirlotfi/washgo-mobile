import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Modal,
  FlatList, TextInput as SearchInput,
} from 'react-native';

const COUNTRIES = [
  { code: '+212', flag: '🇲🇦', name: 'Maroc' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+34', flag: '🇪🇸', name: 'Espagne' },
  { code: '+32', flag: '🇧🇪', name: 'Belgique' },
  { code: '+41', flag: '🇨🇭', name: 'Suisse' },
  { code: '+39', flag: '🇮🇹', name: 'Italie' },
  { code: '+49', flag: '🇩🇪', name: 'Allemagne' },
  { code: '+31', flag: '🇳🇱', name: 'Pays-Bas' },
  { code: '+1', flag: '🇺🇸', name: 'États-Unis / Canada' },
  { code: '+44', flag: '🇬🇧', name: 'Royaume-Uni' },
  { code: '+971', flag: '🇦🇪', name: 'Émirats Arabes Unis' },
  { code: '+966', flag: '🇸🇦', name: 'Arabie Saoudite' },
  { code: '+213', flag: '🇩🇿', name: 'Algérie' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisie' },
  { code: '+20', flag: '🇪🇬', name: 'Égypte' },
  { code: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
];

interface Props {
  value: string;
  onChangePhone: (fullPhone: string, localNumber: string, dialCode: string) => void;
  placeholder?: string;
}

export default function PhoneInput({ value, onChangePhone, placeholder = '6XXXXXXXX' }: Props) {
  const [dialCode, setDialCode] = useState('+212');
  const [localNumber, setLocalNumber] = useState(value.replace(/^\+\d+/, '') || '');
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search),
  );

  const handleNumberChange = (text: string) => {
    // Retire le 0 initial si l'utilisateur le tape (ex: 0612... → 612...)
    const cleaned = text.replace(/^0+/, '').replace(/[^0-9]/g, '');
    setLocalNumber(cleaned);
    onChangePhone(`${dialCode}${cleaned}`, cleaned, dialCode);
  };

  const handleDialCodeSelect = (code: string) => {
    setDialCode(code);
    setShowPicker(false);
    setSearch('');
    onChangePhone(`${code}${localNumber}`, localNumber, code);
  };

  return (
    <View style={styles.container}>
      {/* Sélecteur indicatif */}
      <Pressable style={styles.dialCodeBtn} onPress={() => setShowPicker(true)}>
        <Text style={styles.dialCodeText}>
          {COUNTRIES.find((c) => c.code === dialCode)?.flag ?? '🌍'} {dialCode}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <View style={styles.divider} />

      {/* Champ numéro */}
      <TextInput
        style={styles.numberInput}
        placeholder={placeholder}
        value={localNumber}
        onChangeText={handleNumberChange}
        keyboardType="phone-pad"
        autoCapitalize="none"
        placeholderTextColor="#999"
      />

      {/* Modal sélection pays */}
      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir l'indicatif</Text>
              <Pressable onPress={() => { setShowPicker(false); setSearch(''); }}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            <SearchInput
              style={styles.searchInput}
              placeholder="Rechercher un pays..."
              value={search}
              onChangeText={setSearch}
              autoFocus
            />

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.countryItem,
                    item.code === dialCode && styles.countryItemActive,
                  ]}
                  onPress={() => handleDialCodeSelect(item.code)}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <Text style={styles.countryName}>{item.name}</Text>
                  <Text style={styles.countryCode}>{item.code}</Text>
                  {item.code === dialCode && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  dialCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 4,
  },
  dialCodeText: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  chevron: { fontSize: 11, color: '#666', marginTop: 2 },
  divider: { width: 1, height: 24, backgroundColor: '#DDD' },
  numberInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalClose: { fontSize: 20, color: '#666', padding: 4 },
  searchInput: {
    margin: 16,
    backgroundColor: '#F4F5F7',
    padding: 12,
    borderRadius: 10,
    fontSize: 15,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5F7',
    gap: 12,
  },
  countryItemActive: { backgroundColor: '#E8F1FF' },
  countryFlag: { fontSize: 24 },
  countryName: { flex: 1, fontSize: 15, color: '#333' },
  countryCode: { fontSize: 15, fontWeight: '600', color: '#0066FF' },
  checkmark: { color: '#0066FF', fontWeight: '700', fontSize: 16 },
});