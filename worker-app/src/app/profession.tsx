import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { getMyProfession, updateMyProfession } from '@/api/worker';
import { BrandColors } from '@/constants/theme';

const PROFESSION_GROUPS = [
  {
    category: 'Construction & Skilled Trades',
    professions: ['Mason', 'Carpenter', 'Electrician', 'Plumber', 'Painter', 'Welder', 'Tile Worker', 'Bar Bender', 'Shuttering Carpenter', 'Construction Helper'],
  },
  {
    category: 'Food & Hospitality',
    professions: ['Parota Master', 'Cook', 'Baker', 'Tea Master', 'Kitchen Helper', 'Hotel Server', 'Catering Worker'],
  },
  {
    category: 'Repair & Maintenance',
    professions: ['Mechanic', 'Bike Mechanic', 'Auto Mechanic', 'AC Technician', 'Refrigerator Technician', 'Mobile Repair Technician', 'Machine Technician'],
  },
  {
    category: 'Delivery & Logistics',
    professions: ['Delivery Worker', 'Delivery Executive', 'Driver', 'Auto Driver', 'Lorry Driver', 'Courier Worker', 'Warehouse Worker', 'Loader'],
  },
  {
    category: 'Cleaning & Home Services',
    professions: ['Housekeeping', 'Cleaner', 'Domestic Worker', 'Cook', 'Babysitter', 'Caretaker', 'Gardener'],
  },
  {
    category: 'Retail & Sales',
    professions: ['Shop Assistant', 'Cashier', 'Sales Executive', 'Supermarket Worker', 'Store Keeper'],
  },
  {
    category: 'Beauty & Personal Care',
    professions: ['Barber', 'Hair Stylist', 'Beautician', 'Makeup Artist'],
  },
  {
    category: 'Office & Professional',
    professions: ['Accountant', 'Computer Operator', 'Software Developer', 'Designer', 'Teacher', 'Office Assistant', 'Customer Support'],
  },
];

export default function ProfessionScreen() {
  const [category, setCategory] = useState('');
  const [profession, setProfession] = useState('');
  const [customProfession, setCustomProfession] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    getMyProfession()
      .then((value) => {
        if (!mounted) return;
        setCategory(value.professionCategory ?? '');
        setProfession(value.profession ?? '');
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const selectedGroup = useMemo(
    () => PROFESSION_GROUPS.find((group) => group.category === category),
    [category],
  );

  function selectCategory(value: string) {
    setCategory(value);
    setProfession('');
    setCustomProfession('');
  }

  function selectProfession(value: string) {
    setProfession(value);
    setCustomProfession('');
  }

  function addCustomProfession() {
    const value = customProfession.trim();
    if (!value) return;
    setProfession(value);
  }

  async function save() {
    const selectedProfession = profession.trim();
    if (!category) {
      Alert.alert('Choose a work category', 'Select the type of work you do.');
      return;
    }
    if (!selectedProfession) {
      Alert.alert('Choose your profession', 'Select your main profession or enter your own.');
      return;
    }
    if (saving) return;

    try {
      setSaving(true);
      await updateMyProfession({
        professionCategory: category,
        profession: selectedProfession,
      });
      router.replace('/experience');
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert('Unable to save', Array.isArray(message) ? message.join('\n') : message ?? 'Please try again.');
      setSaving(false);
    }
  }

  function completeLater() {
    if (!saving) router.replace('/home');
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={BrandColors.burgundy} /></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>STEP 4 OF ONBOARDING</Text>
      <Text style={styles.title}>What work do you do?</Text>
      <Text style={styles.subtitle}>Choose the work you want employers to find you for. Education is optional — practical skills and experience matter too.</Text>

      <View style={styles.progressCard}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Profile completion</Text>
          <Text style={styles.progressValue}>100%</Text>
        </View>
        <View style={styles.track}><View style={styles.fill} /></View>
      </View>

      <Text style={styles.sectionTitle}>Work category</Text>
      <Text style={styles.helper}>Pick the category that best matches your work.</Text>
      <View style={styles.options}>
        {PROFESSION_GROUPS.map((group) => {
          const selected = category === group.category;
          return (
            <Pressable
              key={group.category}
              onPress={() => selectCategory(group.category)}
              style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{group.category}</Text>
            </Pressable>
          );
        })}
      </View>

      {selectedGroup && (
        <>
          <Text style={styles.sectionTitle}>Your main profession</Text>
          <Text style={styles.helper}>Select one main profession. You can add more skills in the previous step.</Text>
          <View style={styles.options}>
            {selectedGroup.professions.map((item) => {
              const selected = profession === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => selectProfession(item)}
                  style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      <View style={styles.customCard}>
        <Text style={styles.customTitle}>Can't find your profession?</Text>
        <Text style={styles.customHelper}>Add any work, trade or occupation in your own words.</Text>
        <View style={styles.customRow}>
          <TextInput
            value={customProfession}
            onChangeText={setCustomProfession}
            placeholder="e.g. Laundry Worker"
            placeholderTextColor={BrandColors.muted}
            style={styles.customInput}
            onSubmitEditing={addCustomProfession}
            returnKeyType="done"
          />
          <Pressable onPress={addCustomProfession} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <Text style={styles.addButtonText}>Use</Text>
          </Pressable>
        </View>
      </View>

      {profession ? (
        <View style={styles.selectedCard}>
          <Text style={styles.selectedLabel}>Selected profession</Text>
          <Text style={styles.selectedProfession}>{profession}</Text>
        </View>
      ) : null}

      <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, saving && styles.disabled]} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Continue to Work Experience</Text>}
      </Pressable>
      <Pressable onPress={completeLater} style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]} disabled={saving}>
        <Text style={styles.skipText}>Complete later</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: BrandColors.background, padding: 24, paddingTop: 56, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BrandColors.background },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: BrandColors.rose, marginBottom: 10 },
  title: { fontSize: 30, fontWeight: '800', color: BrandColors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, color: BrandColors.textSecondary, marginBottom: 22 },
  progressCard: { backgroundColor: BrandColors.surface, borderRadius: 16, borderWidth: 1, borderColor: BrandColors.border, padding: 16, marginBottom: 24 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontWeight: '700', color: BrandColors.text },
  progressValue: { fontWeight: '800', color: BrandColors.burgundy },
  track: { height: 8, borderRadius: 8, backgroundColor: '#EEE5E7', overflow: 'hidden' },
  fill: { width: '100%', height: 8, borderRadius: 8, backgroundColor: BrandColors.burgundy },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: BrandColors.text, marginTop: 4, marginBottom: 6 },
  helper: { fontSize: 14, lineHeight: 20, color: BrandColors.textSecondary, marginBottom: 14 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  option: { borderWidth: 1, borderColor: BrandColors.border, backgroundColor: BrandColors.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  optionSelected: { borderColor: BrandColors.burgundy, backgroundColor: BrandColors.burgundySoft },
  optionText: { color: BrandColors.text, fontSize: 14, fontWeight: '700' },
  optionTextSelected: { color: BrandColors.burgundy },
  customCard: { backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 16, padding: 16, marginBottom: 18 },
  customTitle: { fontSize: 15, fontWeight: '800', color: BrandColors.text, marginBottom: 4 },
  customHelper: { fontSize: 13, lineHeight: 19, color: BrandColors.textSecondary, marginBottom: 12 },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  customInput: { flex: 1, minHeight: 50, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 14, backgroundColor: BrandColors.background, paddingHorizontal: 14, fontSize: 15, color: BrandColors.text },
  addButton: { height: 50, paddingHorizontal: 20, borderRadius: 14, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  selectedCard: { backgroundColor: BrandColors.blushSoft, borderWidth: 1, borderColor: BrandColors.borderStrong, borderRadius: 16, padding: 16, marginBottom: 20 },
  selectedLabel: { color: BrandColors.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 5 },
  selectedProfession: { color: BrandColors.burgundy, fontSize: 18, fontWeight: '800' },
  primaryButton: { height: 54, borderRadius: 14, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: BrandColors.burgundy, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  skipButton: { alignItems: 'center', padding: 16 },
  skipText: { color: BrandColors.textSecondary, fontWeight: '700' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
