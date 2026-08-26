import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { BrandColors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

export default function EmployerHomeScreen() {
  const employer = useAuthStore((state) => state.employer);
  const user = useAuthStore((state) => state.user);
  const setActiveRole = useAuthStore((state) => state.setActiveRole);

  return <View style={styles.container}>
    <Text style={styles.eyebrow}>EMPLOYER</Text>
    <Text style={styles.title}>Welcome, {user?.firstName || employer?.companyName || 'Employer'}</Text>
    <Text style={styles.subtitle}>Manage your jobs and find the right workers.</Text>
    <View style={styles.grid}>
      <Pressable style={styles.card} onPress={() => router.push('/employer-jobs')}><Text style={styles.icon}>📋</Text><Text style={styles.cardTitle}>My Jobs</Text><Text style={styles.cardText}>Create and manage jobs</Text></Pressable>
      <Pressable style={styles.card} onPress={() => router.push('/employer-applications')}><Text style={styles.icon}>👷</Text><Text style={styles.cardTitle}>Applications</Text><Text style={styles.cardText}>Review applicants</Text></Pressable>
    </View>
    <Pressable style={styles.create} onPress={() => router.push('/employer-job-create')}><Text style={styles.createText}>+ Create New Job</Text></Pressable>
    <Pressable style={styles.subscription} onPress={() => router.push('/employer-subscription')}><Text style={styles.subscriptionTitle}>💳 Job Posting Subscription</Text><Text style={styles.subscriptionText}>Choose a monthly plan and publish jobs without paying for each job.</Text></Pressable>
    <Pressable style={styles.switch} onPress={() => { setActiveRole('WORKER'); router.replace('/home'); }}><Text style={styles.switchText}>Switch to Worker</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background, padding: 24, paddingTop: 60 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 2, color: BrandColors.gold },
  title: { marginTop: 10, fontSize: 30, fontWeight: '800', color: BrandColors.text },
  subtitle: { marginTop: 8, fontSize: 15, lineHeight: 22, color: BrandColors.textSecondary },
  grid: { flexDirection: 'row', gap: 12, marginTop: 28 },
  card: { flex: 1, minHeight: 140, backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 16, padding: 16 },
  icon: { fontSize: 25, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: BrandColors.text },
  cardText: { marginTop: 5, fontSize: 12, lineHeight: 18, color: BrandColors.textSecondary },
  create: { marginTop: 16, height: 52, borderRadius: 14, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center' },
  createText: { color: BrandColors.slate, fontSize: 15, fontWeight: '900' },
  subscription: { marginTop: 12, padding: 14, borderRadius: 14, backgroundColor: BrandColors.slateSoft, borderWidth: 1, borderColor: BrandColors.gold },
  subscriptionTitle: { color: BrandColors.gold, fontSize: 14, fontWeight: '900' },
  subscriptionText: { color: BrandColors.textSecondary, fontSize: 11, lineHeight: 17, marginTop: 5 },
  switch: { marginTop: 14, height: 52, borderRadius: 14, borderWidth: 1, borderColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center' },
  switchText: { color: BrandColors.gold, fontSize: 15, fontWeight: '800' },
});
