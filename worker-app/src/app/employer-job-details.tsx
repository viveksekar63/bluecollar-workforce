import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmployerJob, getEmployerJobs, getEmployerJobApplications, publishEmployerJob, EmployerApplication } from '@/api/employer-jobs';
import { BrandColors } from '@/constants/theme';

export default function EmployerJobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<EmployerJob | null>(null);
  const [applications, setApplications] = useState<EmployerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [jobs, apps] = await Promise.all([getEmployerJobs(), getEmployerJobApplications(String(id))]);
      setJob(jobs.find((item) => item.id === id) ?? null);
      setApplications(Array.isArray(apps) ? apps : []);
    } catch (e: any) {
      Alert.alert('Unable to load job', e?.response?.data?.message ?? 'Please try again.');
    } finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function publish() {
    if (!id) return;
    try { setPublishing(true); await publishEmployerJob(String(id)); Alert.alert('Published', 'Your job is now open to workers.'); await load(); }
    catch (e: any) { Alert.alert('Unable to publish', e?.response?.data?.message ?? 'Please complete all required job details and skills.'); }
    finally { setPublishing(false); }
  }

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={BrandColors.gold} /></View></SafeAreaView>;
  if (!job) return <SafeAreaView style={styles.container}><View style={styles.center}><Text style={styles.emptyTitle}>Job not found</Text><Pressable onPress={() => router.back()} style={styles.primary}><Text style={styles.primaryText}>Go back</Text></Pressable></View></SafeAreaView>;

  return <SafeAreaView style={styles.container}><ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={BrandColors.gold} />} contentContainerStyle={styles.content}>
    <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><View style={styles.headerCopy}><Text style={styles.eyebrow}>JOB DETAILS</Text><Text style={styles.title}>{job.title}</Text><Text style={styles.subtitle}>Manage your opening and applicants.</Text></View></View>
    <View style={styles.statusRow}><View style={styles.badge}><Text style={styles.badgeText}>{job.status}</Text></View><Text style={styles.location}>📍 {job.city}, {job.state}</Text></View>
    <View style={styles.card}><Text style={styles.sectionTitle}>Job information</Text><Text style={styles.description}>{job.description}</Text><Text style={styles.meta}>₹{job.salaryMin ?? 0}{job.salaryMax ? ` - ₹${job.salaryMax}` : ''} / {job.salaryType}</Text><Text style={styles.meta}>{job.openings} opening{job.openings === 1 ? '' : 's'}</Text></View>
    {job.status !== 'OPEN' && <Pressable disabled={publishing} onPress={publish} style={styles.primary}><Text style={styles.primaryText}>{publishing ? 'Publishing...' : 'Publish Job'}</Text></Pressable>}
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Applicants ({applications.length})</Text><Pressable onPress={() => router.push({ pathname: '/employer-applications', params: { jobId: job.id } })}><Text style={styles.link}>View all</Text></Pressable></View>
    {applications.slice(0, 5).map((item) => <Pressable key={item.id} style={styles.application} onPress={() => router.push({ pathname: '/employer-application-details', params: { id: item.id } })}><Text style={styles.name}>{`${item.worker?.user?.firstName ?? 'Worker'} ${item.worker?.user?.lastName ?? ''}`.trim()}</Text><Text style={styles.appMeta}>{item.worker?.profession || 'Blue-collar worker'} • {item.status}</Text><Text style={styles.link}>Review ›</Text></Pressable>)}
    {applications.length === 0 && <Text style={styles.emptyText}>No applications yet.</Text>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background }, content: { padding: 18, paddingBottom: 30 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', gap: 10 }, back: { color: BrandColors.gold, fontSize: 36, lineHeight: 32 }, headerCopy: { flex: 1 }, eyebrow: { color: BrandColors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 }, title: { color: BrandColors.text, fontSize: 26, fontWeight: '900' }, subtitle: { color: BrandColors.textSecondary, marginTop: 4, fontSize: 13 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 15 }, badge: { borderWidth: 1, borderColor: BrandColors.gold, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }, badgeText: { color: BrandColors.gold, fontSize: 10, fontWeight: '900' }, location: { color: BrandColors.textSecondary, fontSize: 12 },
  card: { marginTop: 16, backgroundColor: BrandColors.slateSoft, borderColor: BrandColors.slateBorder, borderWidth: 1, borderRadius: 18, padding: 16 }, sectionTitle: { color: BrandColors.text, fontSize: 16, fontWeight: '900' }, description: { color: BrandColors.textSecondary, lineHeight: 21, marginTop: 8 }, meta: { color: BrandColors.textSecondary, fontSize: 12, marginTop: 8 }, primary: { marginTop: 14, height: 52, borderRadius: 14, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: BrandColors.slate, fontWeight: '900' },
  sectionHeader: { marginTop: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, link: { color: BrandColors.gold, fontWeight: '900', fontSize: 12 }, application: { marginTop: 10, backgroundColor: BrandColors.slate, borderWidth: 1, borderColor: BrandColors.slateBorder, borderRadius: 14, padding: 14 }, name: { color: BrandColors.text, fontWeight: '900', fontSize: 14 }, appMeta: { color: BrandColors.textSecondary, fontSize: 11, marginTop: 4 }, emptyText: { color: BrandColors.textSecondary, marginTop: 10 }, emptyTitle: { color: BrandColors.text, fontSize: 18, fontWeight: '900' },
});
