import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { getMyWorkerProfile, updateMyWorkerProfile } from '@/api/worker';
import { useAuthStore } from '@/store/auth';

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const [form, setForm] = useState({ dateOfBirth: '', gender: '', maritalStatus: '', experienceYears: '', about: '' });
  const [completion, setCompletion] = useState(20);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyWorkerProfile()
      .then((worker) => {
        setCompletion(worker.profileCompletion ?? 20);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    try {
      setSaving(true);
      const worker = await updateMyWorkerProfile({
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        maritalStatus: form.maritalStatus || undefined,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
        about: form.about || undefined,
      });
      setCompletion(worker.profileCompletion ?? Math.max(completion, 40));
      Alert.alert('Profile saved', 'Your basic profile has been updated.', [{ text: 'Continue', onPress: () => router.replace('/home') }]);
    } catch (error: any) {
      Alert.alert('Unable to save', error?.response?.data?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>STEP 1 OF ONBOARDING</Text>
      <Text style={styles.title}>Complete your profile</Text>
      <Text style={styles.subtitle}>Hi {user?.firstName ?? 'there'}, add a few details to help employers understand your experience.</Text>

      <View style={styles.progressCard}>
        <View style={styles.progressRow}><Text style={styles.progressLabel}>Profile completion</Text><Text style={styles.progressValue}>{completion}%</Text></View>
        <View style={styles.track}><View style={[styles.fill, { width: `${Math.min(completion, 100)}%` }]} /></View>
      </View>

      <Field label="Date of birth" value={form.dateOfBirth} placeholder="YYYY-MM-DD" onChangeText={(value) => setForm({ ...form, dateOfBirth: value })} />
      <Field label="Gender" value={form.gender} placeholder="Male / Female / Other" onChangeText={(value) => setForm({ ...form, gender: value })} />
      <Field label="Marital status" value={form.maritalStatus} placeholder="Single / Married / Other" onChangeText={(value) => setForm({ ...form, maritalStatus: value })} />
      <Field label="Years of experience" value={form.experienceYears} placeholder="e.g. 5" keyboardType="number-pad" onChangeText={(value) => setForm({ ...form, experienceYears: value })} />
      <Field label="About you" value={form.about} placeholder="Tell employers about your experience and strengths" multiline onChangeText={(value) => setForm({ ...form, about: value })} />

      <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, saving && styles.disabled]} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save & Continue</Text>}
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, value, placeholder, onChangeText, multiline, keyboardType }: { label: string; value: string; placeholder: string; onChangeText: (value: string) => void; multiline?: boolean; keyboardType?: 'default' | 'number-pad' }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} multiline={multiline} keyboardType={keyboardType} style={[styles.input, multiline && styles.textArea]} /></View>;
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
  input: { minHeight: 54, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, backgroundColor: '#fff', paddingHorizontal: 16, fontSize: 16, color: '#111827' },
  textArea: { minHeight: 110, paddingTop: 14, textAlignVertical: 'top' },
  primaryButton: { height: 54, borderRadius: 12, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
