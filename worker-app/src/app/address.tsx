import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { getMyWorkerProfile, updateMyOnboarding } from '@/api/worker';

const initialForm = { addressLine1: '', addressLine2: '', city: '', district: '', state: '', pincode: '', emergencyName: '', emergencyRelationship: '', emergencyPhone: '' };

export default function AddressScreen() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyWorkerProfile()
      .then((worker) => {
        const address = worker.addresses?.[0];
        const emergency = worker.emergencyContacts?.[0];
        setForm({
          addressLine1: address?.addressLine1 ?? '',
          addressLine2: address?.addressLine2 ?? '',
          city: address?.city ?? '',
          district: address?.district ?? '',
          state: address?.state ?? '',
          pincode: address?.pincode ?? '',
          emergencyName: emergency?.name ?? '',
          emergencyRelationship: emergency?.relationship ?? '',
          emergencyPhone: emergency?.phone ?? '',
        });
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  function setField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save() {
    const required = [
      ['Address', form.addressLine1], ['City', form.city], ['State', form.state], ['Pincode', form.pincode],
      ['Emergency contact name', form.emergencyName], ['Relationship', form.emergencyRelationship], ['Emergency phone', form.emergencyPhone],
    ];
    const missing = required.find(([, value]) => !value.trim());
    if (missing) {
      Alert.alert('Missing information', `Please enter ${missing[0]}.`);
      return;
    }
    if (!/^\d{6}$/.test(form.pincode)) {
      Alert.alert('Invalid pincode', 'Please enter a valid 6-digit pincode.');
      return;
    }

    try {
      setSaving(true);
      await updateMyOnboarding({
        addressType: 'CURRENT',
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim() || undefined,
        city: form.city.trim(),
        district: form.district.trim() || undefined,
        state: form.state.trim(),
        pincode: form.pincode,
        emergencyName: form.emergencyName.trim(),
        emergencyRelationship: form.emergencyRelationship.trim(),
        emergencyPhone: form.emergencyPhone.trim(),
      });

      Alert.alert('Saved', 'Address and emergency contact have been saved.', [
        {
          text: 'Continue',
          onPress: () => router.replace('/skills'),
        }
      ]);
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert('Unable to save', Array.isArray(message) ? message.join('\n') : message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>STEP 2 OF ONBOARDING</Text>
      <Text style={styles.title}>Address & emergency contact</Text>
      <Text style={styles.subtitle}>Add your current address and someone we can contact in an emergency.</Text>

      <View style={styles.progressCard}>
        <View style={styles.progressRow}><Text style={styles.progressLabel}>Profile completion</Text><Text style={styles.progressValue}>40%</Text></View>
        <View style={styles.track}><View style={styles.fill} /></View>
      </View>

      <Text style={styles.sectionTitle}>Current address</Text>
      <Field label="Address line 1" value={form.addressLine1} placeholder="House / door number and street" onChangeText={(v) => setField('addressLine1', v)} />
      <Field label="Address line 2" value={form.addressLine2} placeholder="Area, landmark (optional)" onChangeText={(v) => setField('addressLine2', v)} />
      <Field label="City" value={form.city} placeholder="City" onChangeText={(v) => setField('city', v)} />
      <Field label="District" value={form.district} placeholder="District (optional)" onChangeText={(v) => setField('district', v)} />
      <Field label="State" value={form.state} placeholder="State" onChangeText={(v) => setField('state', v)} />
      <Field label="Pincode" value={form.pincode} placeholder="6-digit pincode" keyboardType="number-pad" onChangeText={(v) => setField('pincode', v.replace(/[^0-9]/g, '').slice(0, 6))} />

      <Text style={styles.sectionTitle}>Emergency contact</Text>
      <Field label="Full name" value={form.emergencyName} placeholder="Emergency contact name" onChangeText={(v) => setField('emergencyName', v)} />
      <Field label="Relationship" value={form.emergencyRelationship} placeholder="e.g. Father, Mother, Spouse" onChangeText={(v) => setField('emergencyRelationship', v)} />
      <Field label="Phone number" value={form.emergencyPhone} placeholder="Emergency contact phone" keyboardType="phone-pad" onChangeText={(v) => setField('emergencyPhone', v)} />

      <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, saving && styles.disabled]} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save & Continue</Text>}
      </Pressable>
      <Pressable onPress={() => router.replace('/home')} style={styles.skipButton} disabled={saving}><Text style={styles.skipText}>Complete later</Text></Pressable>
    </ScrollView>
  );
}

function Field({ label, value, placeholder, onChangeText, keyboardType }: { label: string; value: string; placeholder: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'number-pad' | 'phone-pad' }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} keyboardType={keyboardType} style={styles.input} /></View>;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F7F8FA', padding: 24, paddingTop: 56 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: '#2563EB', marginBottom: 10 },
  title: { fontSize: 30, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#6B7280', marginBottom: 22 },
  progressCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 24 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontWeight: '700', color: '#374151' },
  progressValue: { fontWeight: '800', color: '#2563EB' },
  track: { height: 8, borderRadius: 8, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  fill: { width: '60%', height: 8, borderRadius: 8, backgroundColor: '#2563EB' },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: '#111827', marginBottom: 14, marginTop: 2 },
  field: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 7 },
  input: { minHeight: 54, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, backgroundColor: '#fff', paddingHorizontal: 16, fontSize: 16, color: '#111827' },
  primaryButton: { height: 54, borderRadius: 12, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  skipButton: { alignItems: 'center', padding: 16 },
  skipText: { color: '#6B7280', fontWeight: '700' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
