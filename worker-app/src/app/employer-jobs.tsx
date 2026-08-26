import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmployerJob, getEmployerJobs } from '@/api/employer-jobs';
import { BrandColors } from '@/constants/theme';

export default function EmployerJobsScreen() {
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getEmployerJobs();
      setJobs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Unable to load your jobs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const refresh = () => { setRefreshing(true); void load(); };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={BrandColors.gold} /></View></SafeAreaView>;

  return <SafeAreaView style={styles.container}>
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={BrandColors.gold} />} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>EMPLOYER</Text><Text style={styles.title}>My Jobs</Text><Text style={styles.subtitle}>Create and manage your job openings.</Text></View>
        <Pressable style={styles.createButton} onPress={() => router.push('/employer-job-create')}><Text style={styles.createText}>+ Create</Text></Pressable>
      </View>

      {error && <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View>}
      {!error && jobs.length === 0 && <View style={styles.empty}><Text style={styles.emptyIcon}>📋</Text><Text style={styles.emptyTitle}>No jobs yet</Text><Text style={styles.emptyText}>Create your first job and start finding the right worker.</Text><Pressable style={styles.primary} onPress={() => router.push('/employer-job-create')}><Text style={styles.primaryText}>Create your first job</Text></Pressable></View>}

      {jobs.map((job) => <Pressable key={job.id} style={styles.card} onPress={() => router.push({ pathname: '/employer-job-details', params: { id: job.id } })}>
        <View style={styles.cardTop}><Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text><View style={[styles.badge, job.status === 'OPEN' && styles.openBadge]}><Text style={styles.badgeText}>{job.status}</Text></View></View>
        <Text style={styles.location}>📍 {job.city}{job.state ? `, ${job.state}` : ''}</Text>
        <Text style={styles.meta}>₹{job.salaryMin ?? 0}{job.salaryMax ? ` - ₹${job.salaryMax}` : ''} / {job.salaryType} • {job.openings} opening{job.openings === 1 ? '' : 's'}</Text>
        <View style={styles.cardBottom}><Text style={styles.cardLink}>View details</Text><Text style={styles.cardLink}>›</Text></View>
      </Pressable>)}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background },
  content: { padding: 18, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  back: { color: BrandColors.gold, fontSize: 36, lineHeight: 32 },
  headerCopy: { flex: 1 },
  eyebrow: { color: BrandColors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: BrandColors.text, fontSize: 28, fontWeight: '900', marginTop: 3 },
  subtitle: { color: BrandColors.textSecondary, fontSize: 13, marginTop: 4 },
  createButton: { backgroundColor: BrandColors.gold, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  createText: { color: BrandColors.slate, fontWeight: '900' },
  error: { marginTop: 18, padding: 14, borderRadius: 14, backgroundColor: '#3b1919', borderWidth: 1, borderColor: '#6c3030' },
  errorText: { color: '#ffd2d2', fontWeight: '700' },
  empty: { marginTop: 28, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: BrandColors.slateBorder, backgroundColor: BrandColors.slateSoft, alignItems: 'center' },
  emptyIcon: { fontSize: 34 },
  emptyTitle: { color: BrandColors.text, fontSize: 20, fontWeight: '900', marginTop: 10 },
  emptyText: { color: BrandColors.textSecondary, textAlign: 'center', lineHeight: 20, marginTop: 6 },
  primary: { marginTop: 16, backgroundColor: BrandColors.gold, borderRadius: 13, paddingHorizontal: 18, paddingVertical: 13 },
  primaryText: { color: BrandColors.slate, fontWeight: '900' },
  card: { marginTop: 14, backgroundColor: BrandColors.slateSoft, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BrandColors.slateBorder },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  jobTitle: { flex: 1, color: BrandColors.text, fontSize: 17, fontWeight: '900' },
  badge: { borderRadius: 999, borderWidth: 1, borderColor: BrandColors.slateBorder, paddingHorizontal: 10, paddingVertical: 5 },
  openBadge: { borderColor: BrandColors.gold },
  badgeText: { color: BrandColors.gold, fontSize: 10, fontWeight: '900' },
  location: { color: BrandColors.textSecondary, fontSize: 12, marginTop: 8 },
  meta: { color: BrandColors.textSecondary, fontSize: 12, marginTop: 6 },
  cardBottom: { borderTopWidth: 1, borderTopColor: BrandColors.slateBorder, marginTop: 13, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  cardLink: { color: BrandColors.gold, fontWeight: '900' },
});
