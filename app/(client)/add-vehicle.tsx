import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCreateVehicle } from '../../src/hooks/useVehicles';
import { VehicleCategory } from '../../src/types/api.types';

const CATEGORIES: {
  value: VehicleCategory;
  label: string;
  description: string;
  emoji: string;
}[] = [
  {
    value: 'CITY_CAR',
    label: 'Citadine / Berline / SUV simple',
    description: 'Petites et moyennes voitures',
    emoji: '🚗',
  },
  {
    value: 'LARGE_VEHICLE',
    label: 'Grande SUV / 4x4 / Pickup / Van',
    description: 'Gros véhicules et utilitaires',
    emoji: '🚙',
  },
  {
    value: 'MOTORCYCLE',
    label: 'Moto / Quad',
    description: 'Deux ou trois roues',
    emoji: '🏍️',
  },
];

export default function AddVehicleScreen() {
  const router = useRouter();
  const create = useCreateVehicle();
  const [form, setForm] = useState({ brand: '', model: '', plate: '' });
  const [category, setCategory] = useState<VehicleCategory>('CITY_CAR');

  const onSubmit = () => {
    create.mutate(
      { ...form, category },
      {
        onSuccess: () => router.back(),
        onError: (err: any) => {
          const msg = err.response?.data?.message;
          Alert.alert(
            'Erreur',
            Array.isArray(msg) ? msg.join('\n') : msg ?? 'Erreur inconnue',
          );
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Retour</Text>
        </Pressable>

        <Text style={styles.title}>Ajouter un véhicule</Text>

        <TextInput
          style={styles.input}
          placeholder="Marque (ex: Dacia)"
          value={form.brand}
          onChangeText={(v) => setForm({ ...form, brand: v })}
        />
        <TextInput
          style={styles.input}
          placeholder="Modèle (ex: Logan)"
          value={form.model}
          onChangeText={(v) => setForm({ ...form, model: v })}
        />
        <TextInput
          style={styles.input}
          placeholder="Plaque (ex: 12345-A-1)"
          value={form.plate}
          onChangeText={(v) => setForm({ ...form, plate: v })}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Catégorie</Text>
        <View style={styles.categoriesList}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.value}
              style={[
                styles.categoryCard,
                category === c.value && styles.categoryCardActive,
              ]}
              onPress={() => setCategory(c.value)}
            >
              <Text style={styles.categoryEmoji}>{c.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.categoryLabel,
                    category === c.value && styles.categoryLabelActive,
                  ]}
                >
                  {c.label}
                </Text>
                <Text style={styles.categoryDescription}>{c.description}</Text>
              </View>
              <View
                style={[
                  styles.radio,
                  category === c.value && styles.radioActive,
                ]}
              >
                {category === c.value && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[
            styles.button,
            (create.isPending || !form.brand || !form.model || !form.plate) && {
              opacity: 0.5,
            },
          ]}
          onPress={onSubmit}
          disabled={
            create.isPending || !form.brand || !form.model || !form.plate
          }
        >
          <Text style={styles.buttonText}>
            {create.isPending ? 'Ajout...' : 'Ajouter le véhicule'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 30 },
  back: { color: '#0066FF', fontSize: 16, fontWeight: '600', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 24 },
  input: {
    backgroundColor: '#F4F5F7', padding: 16, borderRadius: 12,
    marginBottom: 12, fontSize: 16,
  },
  label: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 12 },
  categoriesList: { gap: 10, marginBottom: 24 },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  categoryCardActive: { borderColor: '#0066FF', backgroundColor: '#E8F1FF' },
  categoryEmoji: { fontSize: 32 },
  categoryLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
  categoryLabelActive: { color: '#0066FF' },
  categoryDescription: { fontSize: 12, color: '#666', marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: { borderColor: '#0066FF' },
  radioDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#0066FF',
  },
  button: {
    backgroundColor: '#0066FF', padding: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});