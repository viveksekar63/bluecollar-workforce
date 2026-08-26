import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  createEmployerPaymentMethod,
  EmployerPaymentMethod,
  getEmployerPaymentMethods,
  publishEmployerJob,
} from '@/api/employer-jobs';
import { BrandColors } from '@/constants/theme';

const TYPES: Array<{ key: EmployerPaymentMethod['type']; title: string; hint: string }> = [
  { key: 'UPI', title: 'UPI', hint: 'Recommended for quick payments' },
  { key: 'CARD', title: 'Card', hint: 'Credit or debit card' },
  { key: 'BANK_ACCOUNT', title: 'Bank', hint: 'Business bank account' },
];

export default function EmployerPaymentMethodScreen() {
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  const [methods, setMethods] = useState<EmployerPaymentMethod[]>([]);
  const [type, setType] = useState<EmployerPaymentMethod['type']>('UPI');
  const [label, setLabel] = useState('Primary payment method');
  const [last4, setLast4] = useState('');
  const [upiId, setUpiId] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setMethods(await getEmployerPaymentMethods());
    } catch (e: any) {
      Alert.alert('Unable to load payment methods', e?.response?.data?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function save() {
    try {
      setSaving(true);
      await createEmployerPaymentMethod({
        type,
        label: label.trim(),
        provider: 'WorkTrust',
        last4: type === 'UPI' ? undefined : last4.trim(),
        upiId: type === 'UPI' ? upiId.trim() : undefined,
      });

      if (jobId) {
        await publishEmployerJob(String(jobId));
        Alert.alert('Job published', 'Your payment method is ready and the job is now open to workers.', [
          { text: 'View job', onPress: () => router.replace({ pathname: '/employer-job-details', params: { id: String(jobId) } }) },
        ]);
        return;
      }

      setLast4('');
      setUpiId('');
      await load();
      Alert.alert('Payment method added', 'Your payment method is ready for job publishing.');
    } catch (e: any) {
      Alert.alert('Unable to continue', e?.response?.data?.message ?? 'Please check the details and try again.');
    } finally {
      setSaving(false);
    }
  }

  return <SafeAreaView style={styles.container}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>EMPLOYER</Text>
          <Text style={styles.title}>Payment method</Text>
          <Text style={styles.subtitle}>Add a secure payment method before publishing a job.</Text>
        </View>
      </View>

      {loading ? <ActivityIndicator color={BrandColors.gold} /> : <>
        {methods.length > 0 && <View style={styles.savedCard}>
          <Text style={styles.sectionTitle}>Saved methods</Text>
          {methods.map((method) => <View key={method.id} style={styles.methodRow}>
            <View style={styles.methodIcon}><Text style={styles.methodIconText}>{method.type === 'UPI' ? '₹' : method.type === 'CARD' ? '▣' : '⌂'}</Text></View>
            <View style={styles.methodCopy}>
              <Text style={styles.methodLabel}>{method.label}</Text>
              <Text style={styles.methodMeta}>{method.type === 'UPI' ? method.upiId : `•••• ${method.last4}`}</Text>
            </View>
            {method.isDefault && <Text style={styles.default}>DEFAULT</Text>}
          </View>)}
        </View>}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Add payment method</Text>
          <Text style={styles.note}>For security, WorkTrust does not store full card numbers or CVV.</Text>

          <View style={styles.typeRow}>
            {TYPES.map((item) => <Pressable key={item.key} onPress={() => setType(item.key)} style={[styles.typeButton, type === item.key && styles.typeButtonActive]}>
              <Text style={[styles.typeTitle, type === item.key && styles.typeTitleActive]}>{item.title}</Text>
              <Text style={styles.typeHint}>{item.hint}</Text>
            </Pressable>)}
          </View>

          <Field label="Payment method name" value={label} onChangeText={setLabel} placeholder="Primary payment method" />
          {type === 'UPI' ? <Field label="UPI ID" value={upiId} onChangeText={setUpiId} placeholder="business@upi" autoCapitalize="none" /> : <Field label={type === 'CARD' ? 'Last 4 digits' : 'Account last 4 digits'} value={last4} onChangeText={setLast4} placeholder="1234" keyboardType="number-pad" maxLength={4} />}

          <Pressable disabled={saving} style={styles.primary} onPress={save}>
            <Text style={styles.primaryText}>{saving ? 'Saving...' : jobId ? 'Save & Publish Job' : 'Save payment method'}</Text>
          </Pressable>
        </View>
      </>}
    </ScrollView>
  </SafeAreaView>;
}

function Field({ label, ...props }: any) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} placeholderTextColor={BrandColors.muted} style={styles.input} /></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background },
  content: { padding: 18, paddingBottom: 32 },
  header: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 18 },
  back: { color: BrandColors.gold, fontSize: 36, lineHeight: 32 },
  headerCopy: { flex: 1 },
  eyebrow: { color: BrandColors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: BrandColors.text, fontSize: 27, fontWeight: '900', marginTop: 3 },
  subtitle: { color: BrandColors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 5 },
  savedCard: { backgroundColor: BrandColors.slateSoft, borderColor: BrandColors.slateBorder, borderWidth: 1, borderRadius: 18, padding: 15, marginBottom: 14 },
  card: { backgroundColor: BrandColors.slateSoft, borderColor: BrandColors.slateBorder, borderWidth: 1, borderRadius: 18, padding: 15 },
  sectionTitle: { color: BrandColors.text, fontSize: 16, fontWeight: '900' },
  note: { color: BrandColors.textSecondary, fontSize: 11, lineHeight: 17, marginTop: 6 },
  methodRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: BrandColors.slateBorder },
  methodIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#2A2416', alignItems: 'center', justifyContent: 'center' },
  methodIconText: { color: BrandColors.gold, fontWeight: '900', fontSize: 16 },
  methodCopy: { flex: 1, marginLeft: 10 },
  methodLabel: { color: BrandColors.text, fontWeight: '800', fontSize: 13 },
  methodMeta: { color: BrandColors.textSecondary, fontSize: 11, marginTop: 3 },
  default: { color: BrandColors.gold, fontSize: 9, fontWeight: '900' },
  typeRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  typeButton: { flex: 1, minHeight: 70, borderRadius: 13, borderWidth: 1, borderColor: BrandColors.slateBorder, padding: 10 },
  typeButtonActive: { borderColor: BrandColors.gold, backgroundColor: '#2A2416' },
  typeTitle: { color: BrandColors.text, fontWeight: '900', fontSize: 13 },
  typeTitleActive: { color: BrandColors.gold },
  typeHint: { color: BrandColors.textSecondary, fontSize: 9, lineHeight: 13, marginTop: 4 },
  field: { marginTop: 14 },
  label: { color: BrandColors.text, fontSize: 12, fontWeight: '800', marginBottom: 6 },
  input: { minHeight: 50, borderRadius: 13, borderWidth: 1, borderColor: BrandColors.slateBorder, backgroundColor: BrandColors.slate, paddingHorizontal: 12, color: BrandColors.text, fontSize: 14 },
  primary: { marginTop: 18, height: 54, borderRadius: 14, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: BrandColors.slate, fontWeight: '900', fontSize: 15 },
});
