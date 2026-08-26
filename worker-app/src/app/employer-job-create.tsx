import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createEmployerJob } from '@/api/employer-jobs';
import { BrandColors } from '@/constants/theme';

export default function EmployerJobCreateScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryType, setSalaryType] = useState('MONTHLY');
  const [openings, setOpenings] = useState('1');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim() || !description.trim() || !city.trim()) {
      Alert.alert('Complete the job', 'Please enter job title, description and city.');
      return;
    }
    try {
      setSaving(true);
      const job = await createEmployerJob({
        title: title.trim(), description: description.trim(), city: city.trim(), state: state.trim(),
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        salaryType, openings: Math.max(1, Number(openings) || 1),
      });
      Alert.alert('Job created', 'Your job has been saved. You can publish it from My Jobs.', [{ text: 'View My Jobs', onPress: () => router.replace('/employer-jobs') }]);
    } catch (e: any) {
      Alert.alert('Unable to create job', e?.response?.data?.message ?? 'Please try again.');
    } finally { setSaving(false); }
  }

  return <SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><View><Text style={styles.eyebrow}>EMPLOYER</Text><Text style={styles.title}>Create Job</Text><Text style={styles.subtitle}>Add a practical opening for workers.</Text></View></View>
    <Field label="Job title" value={title} onChangeText={setTitle} placeholder="e.g. Experienced Parotta Master" />
    <Field label="Description" value={description} onChangeText={setDescription} placeholder="Describe work, timings and workplace." multiline />
    <View style={styles.row}><View style={styles.half}><Field label="City" value={city} onChangeText={setCity} placeholder="Thanjavur" /></View><View style={styles.half}><Field label="State" value={state} onChangeText={setState} placeholder="Tamil Nadu" /></View></View>
    <View style={styles.row}><View style={styles.half}><Field label="Minimum salary" value={salaryMin} onChangeText={setSalaryMin} placeholder="18000" keyboardType="numeric" /></View><View style={styles.half}><Field label="Maximum salary" value={salaryMax} onChangeText={setSalaryMax} placeholder="25000" keyboardType="numeric" /></View></View>
    <View style={styles.row}><View style={styles.half}><Field label="Salary type" value={salaryType} onChangeText={setSalaryType} placeholder="MONTHLY" /></View><View style={styles.half}><Field label="Workers required" value={openings} onChangeText={setOpenings} placeholder="1" keyboardType="numeric" /></View></View>
    <Pressable disabled={saving} style={styles.primary} onPress={save}><Text style={styles.primaryText}>{saving ? 'Saving...' : 'Create Job'}</Text></Pressable>
  </ScrollView></SafeAreaView>;
}

function Field({ label, ...props }: any) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} placeholderTextColor={BrandColors.muted} style={[styles.input, props.multiline && styles.multiline]} /></View>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background }, content: { padding: 18, paddingBottom: 32 },
  header: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 14 }, back: { color: BrandColors.gold, fontSize: 36, lineHeight: 32 },
  eyebrow: { color: BrandColors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 }, title: { color: BrandColors.text, fontSize: 28, fontWeight: '900', marginTop: 3 }, subtitle: { color: BrandColors.textSecondary, fontSize: 13, marginTop: 4 },
  row: { flexDirection: 'row', gap: 10 }, half: { flex: 1 }, field: { marginTop: 14 }, label: { color: BrandColors.text, fontSize: 12, fontWeight: '800', marginBottom: 6 }, input: { minHeight: 50, borderRadius: 13, borderWidth: 1, borderColor: BrandColors.slateBorder, backgroundColor: BrandColors.slate, paddingHorizontal: 12, color: BrandColors.text, fontSize: 14 }, multiline: { minHeight: 120, paddingTop: 12, textAlignVertical: 'top' },
  primary: { marginTop: 20, height: 54, borderRadius: 14, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: BrandColors.slate, fontWeight: '900', fontSize: 16 },
});
