import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Modal,
  FlatList, TextInput as SearchInput,
} from 'react-native';
import { useColors, AppColors } from '../theme/colors';

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
  const colors = useColors();
  const s = styles(colors);
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
    <View style={s.container}>
      {/* Sélecteur indicatif */}
      <Pressable style={s.dialCodeBtn} onPress={() => setShowPicker(true)}>
        <Text style={s.dialCodeText}>
          {COUNTRIES.find((c) => c.code === dialCode)?.flag ?? '🌍'} {dialCode}
        </Text>
        <Text style={s.chevron}>▾</Text>
      </Pressable>

      <View style={s.divider} />

      {/* Champ numéro */}
      <TextInput
        style={s.numberInput}
        placeholder={placeholder}
        value={localNumber}
        onChangeText={handleNumberChange}
        keyboardType="phone-pad"
        autoCapitalize="none"
        placeholderTextColor={colors.textPlaceholder}
      />

      {/* Modal sélection pays */}
      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Choisir l'indicatif</Text>
              <Pressable onPress={() => { setShowPicker(false); setSearch(''); }}>
                <Text style={s.modalClose}>✕</Text>
              </Pressable>
            </View>

            <SearchInput
              style={s.searchInput}
              placeholder="Rechercher un pays..."
              placeholderTextColor={colors.textPlaceholder}
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
                    s.countryItem,
                    item.code === dialCode && s.countryItemActive,
                  ]}
                  onPress={() => handleDialCodeSelect(item.code)}
                >
                  <Text style={s.countryFlag}>{item.flag}</Text>
                  <Text style={s.countryName}>{item.name}</Text>
                  <Text style={s.countryCode}>{item.code}</Text>
                  {item.code === dialCode && (
                    <Text style={s.checkmark}>✓</Text>
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

const styles = (colors: AppColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
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
  dialCodeText: { fontSize: 15, fontWeight: '600', color: colors.text },
  chevron: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  divider: { width: 1, height: 24, backgroundColor: colors.border },
  numberInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
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
  modalClose: { fontSize: 20, color: colors.textSecondary, padding: 4 },
  searchInput: {
    margin: 16,
    backgroundColor: colors.inputBackground,
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
    borderBottomColor: colors.inputBackground,
    gap: 12,
  },
  countryItemActive: { backgroundColor: '#E8F1FF' },
  countryFlag: { fontSize: 24 },
  countryName: { flex: 1, fontSize: 15, color: colors.text },
  countryCode: { fontSize: 15, fontWeight: '600', color: colors.primary },
  checkmark: { color: colors.primary, fontWeight: '700', fontSize: 16 },
});