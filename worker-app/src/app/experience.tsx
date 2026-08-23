import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { createMyEmploymentHistory, getMyEmploymentHistory, type WorkerEmployment, type WorkerEmploymentInput } from '@/api/worker';
import { BrandColors } from '@/constants/theme';

const EXPERIENCE_OPTIONS = [
  ['No experience', 0], ['Less than 1 year', 0.5], ['1 – 3 years', 2], ['3 – 5 years', 4], ['5 – 10 years', 7], ['10+ years', 10],
] as const;
const WORK_TYPES = ['Full time', 'Part time', 'Daily wage', 'Contract', 'Self employed'];

export default function ExperienceScreen() {
  const [history, setHistory] = useState<WorkerEmployment[]>([]);
  const [experience, setExperience] = useState<number | null>(null);
  const [workplace, setWorkplace] = useState('');
  const [workType, setWorkType] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getMyEmploymentHistory().then((items) => { if (mounted) setHistory(items); }).catch(() => undefined).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  async function continueToVerification() {
    if (experience === null) {
      Alert.alert('Choose your experience', 'Tell us how much experience you have.');
      return;
    }
    if (experience === 0) { router.replace('/verification'); return; }
    if (!workplace.trim()) { Alert.alert('Workplace required', 'Enter the place where you worked.'); return; }
    if (!workType) { Alert.alert('Choose work type', 'Select how you usually work.'); return; }

    try {
      setSaving(true);
      const now = new Date();
      const start = new Date(now);
      start.setFullYear(now.getFullYear() - Math.max(1, Math.round(experience)));
      const input: WorkerEmploymentInput = {
        companyName: workplace.trim(),
        designation: 'Previous work',
        startDate: start.toISOString().slice(0, 10),
        employmentType: workType.toUpperCase().replace(/ /g, '_'),
      };
      const created = await createMyEmploymentHistory(input);
      setHistory((current) => [created, ...current]);
      router.replace('/verification');
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert('Unable to save', Array.isArray(message) ? message.join('\n') : message ?? 'Please try again.');
    } finally { setSaving(false); }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={BrandColors.burgundy} /></View>;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>STEP 5 OF ONBOARDING</Text>
      <Text style={styles.title}>Tell us about your experience</Text>
      <Text style={styles.subtitle}>No certificates are required. Your practical work experience matters.</Text>

      <View style={styles.progressCard}>
        <View style={styles.progressRow}><Text style={styles.progressLabel}>Profile completion</Text><Text style={styles.progressValue}>90%</Text></View>
        <View style={styles.track}><View style={styles.fill} /></View>
      </View>

      <Text style={styles.sectionTitle}>How long have you been doing this work?</Text>
      <Text style={styles.helper}>Choose the closest option. You don't need an exact number.</Text>
      <View style={styles.options}>
        {EXPERIENCE_OPTIONS.map(([label, value]) => {
          const selected = experience === value;
          return <Pressable key={label} onPress={() => setExperience(value)} style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}>
            <Text style={styles.optionIcon}>{selected ? '✓' : '○'}</Text><Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
          </Pressable>;
        })}
      </View>

      {experience !== null && experience > 0 && <>
        <View style={styles.infoCard}><Text style={styles.infoTitle}>No exact dates needed</Text><Text style={styles.infoText}>We'll use your experience range to help employers find workers with the right experience.</Text></View>
        <Text style={styles.sectionTitle}>Where have you worked?</Text>
        <Text style={styles.helper}>Hotel, shop, company, workshop, house, farm or any other workplace.</Text>
        <TextInput value={workplace} onChangeText={setWorkplace} placeholder="e.g. Sri Lakshmi Hotel" placeholderTextColor={BrandColors.muted} style={styles.input} />
        <Text style={styles.sectionTitle}>How do you usually work?</Text>
        <View style={styles.chipWrap}>{WORK_TYPES.map((item) => { const selected = workType === item; return <Pressable key={item} onPress={() => setWorkType(item)} style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{item}</Text></Pressable>; })}</View>
      </>}

      {experience === 0 && <View style={styles.fresherCard}><Text style={styles.fresherIcon}>🌱</Text><View style={styles.fresherContent}><Text style={styles.fresherTitle}>Starting your first job?</Text><Text style={styles.fresherText}>That's completely okay. You can create your profile and apply for jobs that accept new workers.</Text></View></View>}
      {history.length > 0 && <View style={styles.savedCard}><Text style={styles.savedTitle}>Experience already added</Text><Text style={styles.savedText}>{history.length} previous workplace{history.length === 1 ? '' : 's'} saved.</Text></View>}

      <Pressable onPress={continueToVerification} disabled={saving} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, saving && styles.disabled]}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Continue to Verification</Text>}</Pressable>
      <Pressable onPress={() => router.replace('/home')} disabled={saving} style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}><Text style={styles.skipText}>Complete later</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: BrandColors.background, padding: 24, paddingTop: 56, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BrandColors.background },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: BrandColors.rose, marginBottom: 10 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: BrandColors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, color: BrandColors.textSecondary, marginBottom: 22 },
  progressCard: { backgroundColor: BrandColors.surface, borderRadius: 16, borderWidth: 1, borderColor: BrandColors.border, padding: 16, marginBottom: 24 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontWeight: '700', color: BrandColors.text },
  progressValue: { fontWeight: '800', color: BrandColors.burgundy },
  track: { height: 8, borderRadius: 8, backgroundColor: '#EEE5E7', overflow: 'hidden' },
  fill: { width: '90%', height: 8, borderRadius: 8, backgroundColor: BrandColors.burgundy },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: BrandColors.text, marginTop: 10, marginBottom: 6 },
  helper: { fontSize: 14, lineHeight: 20, color: BrandColors.textSecondary, marginBottom: 14 },
  options: { gap: 10, marginBottom: 18 },
  option: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BrandColors.border, backgroundColor: BrandColors.surface, borderRadius: 15, paddingHorizontal: 16 },
  optionSelected: { borderColor: BrandColors.burgundy, backgroundColor: BrandColors.burgundySoft },
  optionIcon: { width: 28, fontSize: 18, color: BrandColors.burgundy, fontWeight: '800' },
  optionText: { color: BrandColors.text, fontSize: 16, fontWeight: '700' },
  optionTextSelected: { color: BrandColors.burgundy },
  infoCard: { backgroundColor: BrandColors.blushSoft, borderRadius: 15, borderWidth: 1, borderColor: BrandColors.borderStrong, padding: 16, marginBottom: 6 },
  infoTitle: { color: BrandColors.burgundy, fontSize: 15, fontWeight: '800', marginBottom: 5 },
  infoText: { color: BrandColors.textSecondary, fontSize: 13, lineHeight: 19 },
  input: { minHeight: 54, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 15, backgroundColor: BrandColors.surface, paddingHorizontal: 16, fontSize: 16, color: BrandColors.text, marginBottom: 14 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  chip: { borderWidth: 1, borderColor: BrandColors.border, backgroundColor: BrandColors.surface, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12 },
  chipSelected: { backgroundColor: BrandColors.burgundySoft, borderColor: BrandColors.burgundy },
  chipText: { color: BrandColors.text, fontWeight: '700' },
  chipTextSelected: { color: BrandColors.burgundy },
  fresherCard: { flexDirection: 'row', backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 16, padding: 18, marginBottom: 20 },
  fresherIcon: { fontSize: 28, marginRight: 14 },
  fresherContent: { flex: 1 },
  fresherTitle: { fontSize: 16, fontWeight: '800', color: BrandColors.text, marginBottom: 4 },
  fresherText: { fontSize: 14, lineHeight: 20, color: BrandColors.textSecondary },
  savedCard: { backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 15, padding: 15, marginBottom: 20 },
  savedTitle: { color: BrandColors.text, fontWeight: '800', marginBottom: 4 },
  savedText: { color: BrandColors.textSecondary, fontSize: 13 },
  primaryButton: { height: 54, borderRadius: 14, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  skipButton: { alignItems: 'center', padding: 16 },
  skipText: { color: BrandColors.textSecondary, fontWeight: '700' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
