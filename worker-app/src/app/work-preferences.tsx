import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { BrandColors } from '@/constants/theme';
import { getMyWorkPreferences, PreferredWorkLocation, updateMyWorkPreferences, WorkMobility } from '@/api/worker';

const MOBILITIES: Array<{ value: WorkMobility; title: string; subtitle: string }> = [
  { value: 'LOCAL', title: 'Local only', subtitle: 'Work near my current location' },
  { value: 'WITHIN_RADIUS', title: 'Nearby', subtitle: 'Willing to travel for nearby jobs' },
  { value: 'WITHIN_STATE', title: 'Anywhere in my state', subtitle: 'Open to jobs across my state' },
  { value: 'SPECIFIC_LOCATIONS', title: 'Specific locations', subtitle: 'Choose the cities where I want to work' },
  { value: 'ANYWHERE_INDIA', title: 'Anywhere in India', subtitle: 'Open to work anywhere in India' },
];

export default function WorkPreferencesScreen() {
  const [mobility, setMobility] = useState<WorkMobility>('LOCAL');
  const [relocate, setRelocate] = useState(false);
  const [travel, setTravel] = useState(false);
  const [locations, setLocations] = useState<PreferredWorkLocation[]>([]);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyWorkPreferences()
      .then((data) => {
        setMobility(data.mobility);
        setRelocate(data.willingToRelocate);
        setTravel(data.willingToTravel);
        setLocations(data.preferredLocations ?? []);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const showLocations = mobility === 'SPECIFIC_LOCATIONS';
  const locationSummary = useMemo(() => locations.map((item) => `${item.city}, ${item.state}`).join(' • '), [locations]);

  function addLocation() {
    const nextCity = city.trim();
    const nextState = state.trim();
    if (!nextCity || !nextState) {
      Alert.alert('Add a location', 'Enter both city and state.');
      return;
    }
    if (locations.some((item) => item.city.toLowerCase() === nextCity.toLowerCase() && item.state.toLowerCase() === nextState.toLowerCase())) {
      return;
    }
    setLocations([...locations, { city: nextCity, state: nextState, country: 'India' }]);
    setCity('');
    setState('');
  }

  async function save() {
    if (showLocations && locations.length === 0) {
      Alert.alert('Add preferred locations', 'Choose at least one city where you are willing to work.');
      return;
    }
    try {
      setSaving(true);
      await updateMyWorkPreferences({ mobility, willingToRelocate: relocate, willingToTravel: travel, preferredLocations: locations });
      Alert.alert('Saved', 'Your work location preferences are now visible to employers.', [{ text: 'Done', onPress: () => router.back() }]);
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert('Unable to save', Array.isArray(message) ? message.join('\n') : message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={BrandColors.indigo} /></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹ Back</Text></Pressable>
      <Text style={styles.eyebrow}>WORK LOCATION</Text>
      <Text style={styles.title}>Where can you work?</Text>
      <Text style={styles.subtitle}>Employers can find you outside your current city when you are willing to travel or relocate.</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>📍</Text>
        <View style={styles.infoCopy}>
          <Text style={styles.infoTitle}>Your current address stays separate</Text>
          <Text style={styles.infoText}>We show employers where you are based and where you are willing to work.</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Work preference</Text>
      {MOBILITIES.map((item) => (
        <Pressable key={item.value} onPress={() => setMobility(item.value)} style={[styles.mobilityCard, mobility === item.value && styles.mobilitySelected]}>
          <View style={[styles.radio, mobility === item.value && styles.radioSelected]}>{mobility === item.value && <View style={styles.radioDot} />}</View>
          <View style={styles.mobilityCopy}>
            <Text style={styles.mobilityTitle}>{item.title}</Text>
            <Text style={styles.mobilitySubtitle}>{item.subtitle}</Text>
          </View>
        </Pressable>
      ))}

      {showLocations && (
        <View style={styles.locationSection}>
          <Text style={styles.sectionTitle}>Preferred cities</Text>
          {!!locationSummary && <View style={styles.chipWrap}>{locations.map((item) => <View key={`${item.city}-${item.state}`} style={styles.locationChip}><Text style={styles.locationChipText}>{item.city}, {item.state}</Text><Pressable onPress={() => setLocations(locations.filter((location) => location !== item))}><Text style={styles.remove}>×</Text></Pressable></View>)}</View>}
          <View style={styles.locationInputs}>
            <TextInput value={city} onChangeText={setCity} placeholder="City" placeholderTextColor="#7B8BA6" style={styles.input} />
            <TextInput value={state} onChangeText={setState} placeholder="State" placeholderTextColor="#7B8BA6" style={styles.input} />
          </View>
          <Pressable onPress={addLocation} style={styles.addButton}><Text style={styles.addButtonText}>+ Add location</Text></Pressable>
        </View>
      )}

      <Text style={styles.sectionTitle}>Mobility</Text>
      <Toggle label="I am willing to relocate" value={relocate} onPress={() => setRelocate(!relocate)} />
      <Toggle label="I am willing to travel for work" value={travel} onPress={() => setTravel(!travel)} />

      <View style={styles.previewCard}>
        <Text style={styles.previewEyebrow}>WHAT EMPLOYERS WILL SEE</Text>
        <Text style={styles.previewTitle}>{mobility === 'ANYWHERE_INDIA' ? '🇮🇳 Willing to work anywhere in India' : mobility === 'SPECIFIC_LOCATIONS' ? `📌 Preferred: ${locationSummary || 'Add locations'}` : MOBILITIES.find((item) => item.value === mobility)?.title}</Text>
        {relocate && <Text style={styles.previewMeta}>✈️ Ready to relocate</Text>}
        {travel && <Text style={styles.previewMeta}>🚗 Willing to travel</Text>}
      </View>

      <Pressable onPress={save} disabled={saving} style={[styles.saveButton, saving && styles.disabled]}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Work Preferences</Text>}
      </Pressable>
    </ScrollView>
  );
}

function Toggle({ label, value, onPress }: { label: string; value: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.toggle}><View style={styles.toggleCopy}><Text style={styles.toggleTitle}>{label}</Text></View><View style={[styles.switch, value && styles.switchOn]}><View style={[styles.switchThumb, value && styles.switchThumbOn]} /></View></Pressable>;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: BrandColors.background, padding: 20, paddingTop: 38, paddingBottom: 50 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BrandColors.background },
  back: { marginBottom: 10 },
  backText: { color: BrandColors.indigo, fontSize: 16, fontWeight: '800' },
  eyebrow: { color: BrandColors.indigo, fontSize: 11, fontWeight: '900', letterSpacing: 1.8, marginBottom: 7 },
  title: { color: BrandColors.navy, fontSize: 29, fontWeight: '900', marginBottom: 8 },
  subtitle: { color: BrandColors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 18 },
  infoCard: { flexDirection: 'row', backgroundColor: '#EEF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 18, padding: 14, marginBottom: 22 },
  infoIcon: { fontSize: 24, marginRight: 10 },
  infoCopy: { flex: 1 },
  infoTitle: { color: BrandColors.navy, fontSize: 13, fontWeight: '900', marginBottom: 3 },
  infoText: { color: BrandColors.textSecondary, fontSize: 11, lineHeight: 17 },
  sectionTitle: { color: BrandColors.navy, fontSize: 16, fontWeight: '900', marginBottom: 10, marginTop: 4 },
  mobilityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D6E5FA', borderRadius: 16, padding: 14, marginBottom: 9 },
  mobilitySelected: { borderColor: BrandColors.indigo, backgroundColor: '#EFF6FF' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#A9BDD8', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  radioSelected: { borderColor: BrandColors.indigo },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: BrandColors.indigo },
  mobilityCopy: { flex: 1 },
  mobilityTitle: { color: BrandColors.navy, fontSize: 14, fontWeight: '900' },
  mobilitySubtitle: { color: BrandColors.textSecondary, fontSize: 11, marginTop: 3 },
  locationSection: { marginTop: 8, marginBottom: 16 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 10 },
  locationChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F3FF', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 11, gap: 8 },
  locationChipText: { color: BrandColors.indigo, fontSize: 11, fontWeight: '800' },
  remove: { color: BrandColors.indigo, fontSize: 17, fontWeight: '900' },
  locationInputs: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, minHeight: 48, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D6E5FA', borderRadius: 13, paddingHorizontal: 13, color: BrandColors.navy, fontSize: 13 },
  addButton: { height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#93C5FD', alignItems: 'center', justifyContent: 'center', marginTop: 8, backgroundColor: '#F8FBFF' },
  addButtonText: { color: BrandColors.indigo, fontSize: 12, fontWeight: '900' },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D6E5FA', borderRadius: 15, padding: 14, marginBottom: 9 },
  toggleCopy: { flex: 1 },
  toggleTitle: { color: BrandColors.navy, fontSize: 13, fontWeight: '800' },
  switch: { width: 48, height: 28, borderRadius: 14, backgroundColor: '#D7E2F0', padding: 3, justifyContent: 'center' },
  switchOn: { backgroundColor: BrandColors.indigo },
  switchThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' },
  switchThumbOn: { alignSelf: 'flex-end' },
  previewCard: { marginTop: 15, backgroundColor: BrandColors.navy, borderRadius: 18, padding: 16 },
  previewEyebrow: { color: '#93C5FD', fontSize: 9, fontWeight: '900', letterSpacing: 1.4, marginBottom: 7 },
  previewTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', lineHeight: 20 },
  previewMeta: { color: '#BFDBFE', fontSize: 11, marginTop: 6 },
  saveButton: { height: 54, borderRadius: 15, backgroundColor: BrandColors.indigo, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  disabled: { opacity: 0.6 },
});
