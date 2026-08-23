import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { getMyProfession, updateMyProfession } from '@/api/worker';
import { BrandColors } from '@/constants/theme';

const PROFESSION_GROUPS = [
  { category: 'Construction', icon: '🧱', professions: ['Mason', 'Carpenter', 'Painter', 'Tile Worker', 'Bar Bender', 'Shuttering Carpenter', 'Construction Helper'] },
  { category: 'Food & Hotel', icon: '🍳', professions: ['Parotta Master', 'Tea Master', 'Cook', 'Baker', 'Kitchen Helper', 'Hotel Server', 'Catering Worker'] },
  { category: 'Mechanic & Repair', icon: '🔧', professions: ['Mechanic', 'Bike Mechanic', 'Auto Mechanic', 'AC Technician', 'Refrigerator Technician', 'Machine Technician', 'Welder'] },
  { category: 'Electrical & Plumbing', icon: '⚡', professions: ['Electrician', 'Plumber', 'Electrical Helper', 'Plumbing Helper', 'AC Technician'] },
  { category: 'Driving & Delivery', icon: '🚚', professions: ['Driver', 'Auto Driver', 'Lorry Driver', 'Delivery Worker', 'Courier Worker', 'Loader'] },
  { category: 'Cleaning & Housekeeping', icon: '🧹', professions: ['Cleaner', 'Housekeeping Worker', 'Domestic Worker', 'Dishwasher', 'Laundry Worker', 'Gardener'] },
  { category: 'Factory & Warehouse', icon: '🏭', professions: ['Factory Worker', 'Machine Operator', 'Packing Worker', 'Warehouse Worker', 'Loading Worker', 'Production Helper'] },
  { category: 'Tailoring & Garments', icon: '🧵', professions: ['Tailor', 'Stitching Worker', 'Cutting Worker', 'Garment Worker', 'Ironing Worker'] },
  { category: 'Security', icon: '🛡️', professions: ['Security Guard', 'Watchman', 'Security Supervisor'] },
  { category: 'Farm & Agriculture', icon: '🌾', professions: ['Farm Worker', 'Harvest Worker', 'Gardener', 'Cattle Worker'] },
  { category: 'Shop & Retail', icon: '🛒', professions: ['Shop Assistant', 'Sales Worker', 'Cashier', 'Supermarket Worker', 'Store Helper'] },
  { category: 'General Labour', icon: '👷', professions: ['General Labour', 'Daily Wage Worker', 'Helper', 'Loading Worker', 'Site Helper'] },
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

  async function save() {
    const selectedProfession = profession.trim();
    if (!category) {
      Alert.alert('Choose your work', 'Please select the type of work you do.');
      return;
    }
    if (!selectedProfession) {
      Alert.alert('Choose your profession', 'Please select your main profession or enter your own.');
      return;
    }
    if (saving) return;

    try {
      setSaving(true);
      await updateMyProfession({ professionCategory: category, profession: selectedProfession });
      router.replace('/experience');
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert('Unable to save', Array.isArray(message) ? message.join('\n') : message ?? 'Please try again.');
      setSaving(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={BrandColors.burgundy} /></View>;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>STEP 4 OF ONBOARDING</Text>
      <Text style={styles.title}>What work do you do?</Text>
      <Text style={styles.subtitle}>Choose the work you know best. No degree is required — your practical skills and experience matter.</Text>

      <View style={styles.progressCard}>
        <View style={styles.progressRow}><Text style={styles.progressLabel}>Profile completion</Text><Text style={styles.progressValue}>85%</Text></View>
        <View style={styles.track}><View style={styles.fill} /></View>
      </View>

      <Text style={styles.sectionTitle}>Choose a work category</Text>
      <Text style={styles.helper}>Pick the category that best matches your daily work.</Text>
      <View style={styles.categoryGrid}>
        {PROFESSION_GROUPS.map((group) => {
          const selected = category === group.category;
          return <Pressable key={group.category} onPress={() => selectCategory(group.category)} style={({ pressed }) => [styles.category, selected && styles.categorySelected, pressed && styles.pressed]}>
            <Text style={styles.icon}>{group.icon}</Text>
            <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{group.category}</Text>
          </Pressable>;
        })}
      </View>

      {selectedGroup && <View style={styles.professionCard}>
        <Text style={styles.sectionTitle}>What is your main work?</Text>
        <Text style={styles.helper}>Tap one option. You can add more skills later.</Text>
        <View style={styles.options}>
          {selectedGroup.professions.map((item) => {
            const selected = profession === item;
            return <Pressable key={item} onPress={() => { setProfession(item); setCustomProfession(''); }} style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}>
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{selected ? '✓ ' : ''}{item}</Text>
            </Pressable>;
          })}
        </View>
      </View>}

      <View style={styles.customCard}>
        <Text style={styles.customTitle}>Can't find your work?</Text>
        <Text style={styles.customHelper}>Enter it in your own words.</Text>
        <View style={styles.customRow}>
          <TextInput value={customProfession} onChangeText={(value) => { setCustomProfession(value); setProfession(value); }} placeholder="e.g. Coconut Climber" placeholderTextColor={BrandColors.muted} style={styles.customInput} />
        </View>
      </View>

      {profession ? <View style={styles.selectedCard}><Text style={styles.selectedLabel}>Your selected work</Text><Text style={styles.selectedProfession}>{profession}</Text></View> : null}

      <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, saving && styles.disabled]} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Continue to Work Experience</Text>}
      </Pressable>
      <Pressable onPress={() => router.replace('/home')} style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]} disabled={saving}><Text style={styles.skipText}>Complete later</Text></Pressable>
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
  fill: { width: '85%', height: 8, borderRadius: 8, backgroundColor: BrandColors.burgundy },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: BrandColors.text, marginBottom: 6 },
  helper: { fontSize: 14, lineHeight: 20, color: BrandColors.textSecondary, marginBottom: 14 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  category: { width: '48%', minHeight: 92, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 16, backgroundColor: BrandColors.surface, padding: 14, justifyContent: 'center' },
  categorySelected: { borderColor: BrandColors.burgundy, backgroundColor: BrandColors.burgundySoft },
  icon: { fontSize: 26, marginBottom: 7 },
  categoryText: { fontSize: 14, fontWeight: '800', color: BrandColors.text },
  categoryTextSelected: { color: BrandColors.burgundy },
  professionCard: { backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 18, padding: 16, marginBottom: 18 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  option: { borderWidth: 1, borderColor: BrandColors.border, backgroundColor: BrandColors.background, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  optionSelected: { borderColor: BrandColors.burgundy, backgroundColor: BrandColors.burgundySoft },
  optionText: { color: BrandColors.text, fontSize: 14, fontWeight: '700' },
  optionTextSelected: { color: BrandColors.burgundy },
  customCard: { backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 16, padding: 16, marginBottom: 18 },
  customTitle: { fontSize: 15, fontWeight: '800', color: BrandColors.text, marginBottom: 4 },
  customHelper: { fontSize: 13, color: BrandColors.textSecondary, marginBottom: 10 },
  customRow: { flexDirection: 'row' },
  customInput: { flex: 1, minHeight: 50, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 14, backgroundColor: BrandColors.background, paddingHorizontal: 14, fontSize: 15, color: BrandColors.text },
  selectedCard: { backgroundColor: BrandColors.blushSoft, borderWidth: 1, borderColor: BrandColors.borderStrong, borderRadius: 16, padding: 16, marginBottom: 20 },
  selectedLabel: { color: BrandColors.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 5 },
  selectedProfession: { color: BrandColors.burgundy, fontSize: 18, fontWeight: '800' },
  primaryButton: { height: 54, borderRadius: 14, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: BrandColors.burgundy, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  skipButton: { alignItems: 'center', padding: 16 },
  skipText: { color: BrandColors.textSecondary, fontWeight: '700' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
