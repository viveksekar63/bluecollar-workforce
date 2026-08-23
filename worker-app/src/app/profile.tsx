import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { getMyWorkerProfile, updateMyWorkerProfile } from '@/api/worker';
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
      Alert.alert('Profile saved', 'Your basic profile has been updated.', [
        { text: 'Continue', onPress: () => router.replace('/address') },
      ]);
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert(
        'Unable to save',
        Array.isArray(message) ? message.join('\n') : message ?? 'Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
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
      <OptionGroup
        values={GENDER_VALUES}
        selected={form.gender}
        labels={{ MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' }}
        onSelect={(value) => setForm({ ...form, gender: value })}
      />

      <Text style={[styles.label, styles.optionLabel]}>Marital status</Text>
      <OptionGroup
        values={MARITAL_STATUS_VALUES}
        selected={form.maritalStatus}
        labels={{ SINGLE: 'Single', MARRIED: 'Married', OTHER: 'Other' }}
        onSelect={(value) => setForm({ ...form, maritalStatus: value })}
      />

      <Field label="Years of experience" value={form.experienceYears} placeholder="e.g. 5" keyboardType="number-pad" onChangeText={(value) => setForm({ ...form, experienceYears: value.replace(/[^0-9]/g, '') })} />
      <Field label="About you" value={form.bio} placeholder="Tell employers about your experience and strengths" multiline onChangeText={(value) => setForm({ ...form, bio: value })} />

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
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} multiline={multiline} keyboardType={keyboardType} style={[styles.input, multiline && styles.textArea]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F7F8FA', padding: 24, paddingTop: 56 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: '#2563EB', marginBottom: 10 },
  title: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#6B7280', marginBottom: 22 },
  progressCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 22 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontWeight: '700', color: '#374151' },
  progressValue: { fontWeight: '800', color: '#2563EB' },
  track: { height: 8, borderRadius: 8, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 8, backgroundColor: '#2563EB' },
  field: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 7 },
  optionLabel: { marginTop: 4 },
  optionRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  option: { flex: 1, minHeight: 50, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  optionSelected: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  optionText: { color: '#374151', fontSize: 15, fontWeight: '600' },
  optionTextSelected: { color: '#2563EB', fontWeight: '800' },
  input: { minHeight: 54, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, backgroundColor: '#fff', paddingHorizontal: 16, fontSize: 16, color: '#111827' },
  textArea: { minHeight: 110, paddingTop: 14, textAlignVertical: 'top' },
  primaryButton: { height: 54, borderRadius: 12, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
