import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { getMyWorkerProfile, updateMyWorkerProfile } from '@/api/worker';
import { BrandColors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

const GENDER_VALUES = ['MALE', 'FEMALE', 'OTHER'] as const;
const MARITAL_STATUS_VALUES = ['SINGLE', 'MARRIED', 'OTHER'] as const;

type Gender = (typeof GENDER_VALUES)[number];
type MaritalStatus = (typeof MARITAL_STATUS_VALUES)[number];

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const [form, setForm] = useState({
    dateOfBirth: '',
    gender: '' as Gender | '',
    maritalStatus: '' as MaritalStatus | '',
    experienceYears: '',
    bio: '',
  });
  const [completion, setCompletion] = useState(20);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyWorkerProfile()
      .then((worker) => {
        setCompletion(worker.profileCompletion ?? 20);
        setForm({
          dateOfBirth: worker.dateOfBirth?.slice(0, 10) ?? '',
          gender: (worker.gender as Gender | null | undefined) ?? '',
          maritalStatus: (worker.maritalStatus as MaritalStatus | null | undefined) ?? '',
          experienceYears: worker.experienceYears != null ? String(worker.experienceYears) : '',
          bio: worker.bio ?? '',
        });
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    if (form.gender && !GENDER_VALUES.includes(form.gender)) {
      Alert.alert('Invalid gender', 'Please select Male, Female, or Other.');
      return;
    }

    if (form.maritalStatus && !MARITAL_STATUS_VALUES.includes(form.maritalStatus)) {
      Alert.alert('Invalid marital status', 'Please select Single, Married, or Other.');
      return;
    }

    try {
      setSaving(true);
      await updateMyWorkerProfile({
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        maritalStatus: form.maritalStatus || undefined,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
        bio: form.bio || undefined,
      });

      setCompletion(40);
      router.replace('/address');
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert('Unable to save', Array.isArray(message) ? message.join('\n') : message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BrandColors.burgundy} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>STEP 1 OF ONBOARDING</Text>
      <Text style={styles.title}>Complete your profile</Text>
      <Text style={styles.subtitle}>
        Hi {user?.firstName ?? 'there'}, add a few details to help employers understand your experience.
      </Text>

      <View style={styles.progressCard}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Profile completion</Text>
          <Text style={styles.progressValue}>{completion}%</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.min(completion, 100)}%` }]} />
        </View>
      </View>

      <Field label="Date of birth" value={form.dateOfBirth} placeholder="YYYY-MM-DD" onChangeText={(value) => setForm({ ...form, dateOfBirth: value })} />

      <Text style={styles.label}>Gender</Text>
      <OptionGroup values={GENDER_VALUES} selected={form.gender} labels={{ MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' }} onSelect={(value) => setForm({ ...form, gender: value })} />

      <Text style={[styles.label, styles.optionLabel]}>Marital status</Text>
      <OptionGroup values={MARITAL_STATUS_VALUES} selected={form.maritalStatus} labels={{ SINGLE: 'Single', MARRIED: 'Married', OTHER: 'Other' }} onSelect={(value) => setForm({ ...form, maritalStatus: value })} />

      <Field label="Years of experience" value={form.experienceYears} placeholder="e.g. 5" keyboardType="number-pad" onChangeText={(value) => setForm({ ...form, experienceYears: value.replace(/[^0-9]/g, '') })} />
      <Field label="About you" value={form.bio} placeholder="Tell employers about your experience and strengths" multiline onChangeText={(value) => setForm({ ...form, bio: value })} />

      <Pressable onPress={() => router.push('/work-preferences')} style={({ pressed }) => [styles.mobilityCard, pressed && styles.pressed]}>
        <View style={styles.mobilityIcon}><Text style={styles.mobilityIconText}>↗</Text></View>
        <View style={styles.mobilityCopy}><Text style={styles.mobilityTitle}>Work location preferences</Text><Text style={styles.mobilitySubtitle}>Tell employers if you are willing to travel or relocate anywhere in India.</Text></View>
        <Text style={styles.mobilityChevron}>›</Text>
      </Pressable>

      <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, saving && styles.disabled]} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save & Continue</Text>}
      </Pressable>
    </ScrollView>
  );
}

function OptionGroup<T extends string>({ values, selected, labels, onSelect }: { values: readonly T[]; selected: T | ''; labels: Record<T, string>; onSelect: (value: T) => void }) {
  return (
    <View style={styles.optionRow}>
      {values.map((value) => (
        <Pressable key={value} onPress={() => onSelect(value)} style={[styles.option, selected === value && styles.optionSelected]}>
          <Text style={[styles.optionText, selected === value && styles.optionTextSelected]}>{labels[value]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Field({ label, value, placeholder, onChangeText, multiline, keyboardType }: { label: string; value: string; placeholder: string; onChangeText: (value: string) => void; multiline?: boolean; keyboardType?: 'default' | 'number-pad' }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={BrandColors.muted} multiline={multiline} keyboardType={keyboardType} style={[styles.input, multiline && styles.textArea]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: BrandColors.background, padding: 24, paddingTop: 56, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BrandColors.background },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: BrandColors.rose, marginBottom: 10 },
  title: { fontSize: 32, fontWeight: '800', color: BrandColors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, color: BrandColors.textSecondary, marginBottom: 22 },
  progressCard: { backgroundColor: BrandColors.surface, borderRadius: 16, borderWidth: 1, borderColor: BrandColors.border, padding: 16, marginBottom: 22 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontWeight: '700', color: BrandColors.text },
  progressValue: { fontWeight: '800', color: BrandColors.burgundy },
  track: { height: 8, borderRadius: 8, backgroundColor: '#EEE5E7', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 8, backgroundColor: BrandColors.burgundy },
  field: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '700', color: BrandColors.text, marginBottom: 7 },
  optionLabel: { marginTop: 4 },
  optionRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  option: { flex: 1, minHeight: 50, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 14, backgroundColor: BrandColors.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  optionSelected: { borderColor: BrandColors.burgundy, backgroundColor: BrandColors.burgundySoft },
  optionText: { color: BrandColors.text, fontSize: 15, fontWeight: '600' },
  optionTextSelected: { color: BrandColors.burgundy, fontWeight: '800' },
  input: { minHeight: 54, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 14, backgroundColor: BrandColors.surface, paddingHorizontal: 16, fontSize: 16, color: BrandColors.text },
  textArea: { minHeight: 110, paddingTop: 14, textAlignVertical: 'top' },
  mobilityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 16, padding: 14, marginTop: 2, marginBottom: 12 },
  mobilityIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  mobilityIconText: { color: '#2563EB', fontSize: 22, fontWeight: '900' },
  mobilityCopy: { flex: 1 },
  mobilityTitle: { color: BrandColors.text, fontSize: 13, fontWeight: '900' },
  mobilitySubtitle: { color: BrandColors.textSecondary, fontSize: 10, lineHeight: 15, marginTop: 3 },
  mobilityChevron: { color: '#2563EB', fontSize: 28, marginLeft: 6 },
  primaryButton: { height: 54, borderRadius: 14, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: BrandColors.burgundy, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
