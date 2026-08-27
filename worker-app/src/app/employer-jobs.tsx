import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { closeEmployerJob, EmployerJob, getEmployerJobs, pauseEmployerJob, reopenEmployerJob, resumeEmployerJob } from '@/api/employer-jobs';
import { BrandColors } from '@/constants/theme';

const STATUS_FILTERS = ['ALL', 'DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

export default function EmployerJobsScreen() {
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);

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

  const counts = useMemo(() => ({
    all: jobs.length,
    draft: jobs.filter((job) => job.status === 'DRAFT').length,
    published: jobs.filter((job) => job.status === 'PUBLISHED').length,
    paused: jobs.filter((job) => job.status === 'PAUSED').length,
    closed: jobs.filter((job) => job.status === 'CLOSED').length,
  }), [jobs]);

  const visibleJobs = useMemo(
    () => filter === 'ALL' ? jobs : jobs.filter((job) => job.status === filter),
    [filter, jobs],
  );

  async function changeStatus(job: EmployerJob, action: 'pause' | 'resume' | 'close' | 'reopen') {
    if (busyJobId) return;
    const labels = { pause: 'Pause', resume: 'Resume', close: 'Close', reopen: 'Reopen' };
    const run = { pause: pauseEmployerJob, resume: resumeEmployerJob, close: closeEmployerJob, reopen: reopenEmployerJob }[action];

    setBusyJobId(job.id);
    try {
      await run(job.id);
      await load();
    } catch (e: any) {
      Alert.alert(`${labels[action]} failed`, e?.response?.data?.message ?? `Unable to ${action} this job.`);
    } finally {
      setBusyJobId(null);
    }
  }

  function confirmStatus(job: EmployerJob, action: 'pause' | 'resume' | 'close' | 'reopen') {
    const config = {
      pause: { title: 'Pause this job?', message: 'Workers will no longer see this opening until you resume it.', confirm: 'Pause' },
      resume: { title: 'Resume this job?', message: 'This will make the job visible to workers again.', confirm: 'Resume' },
      close: { title: 'Close this job?', message: 'Closed jobs are no longer available to workers. You can reopen them later.', confirm: 'Close' },
      reopen: { title: 'Reopen this job?', message: 'The job will become visible to workers again.', confirm: 'Reopen' },
    }[action];
    Alert.alert(config.title, config.message, [
      { text: 'Cancel', style: 'cancel' },
      { text: config.confirm, style: action === 'close' ? 'destructive' : 'default', onPress: () => { void changeStatus(job, action); } },
    ]);
  }

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={BrandColors.gold} /></View></SafeAreaView>;

  return <SafeAreaView style={styles.container}>
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={BrandColors.gold} />} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>EMPLOYER</Text><Text style={styles.title}>My Jobs</Text><Text style={styles.subtitle}>Create, publish and manage your job openings.</Text></View>
        <Pressable style={styles.createButton} onPress={() => router.push('/employer-job-create')}><Text style={styles.createText}>+ Create</Text></Pressable>
      </View>

      <View style={styles.statsRow}>
        <Stat value={counts.all} label="All" active={filter === 'ALL'} onPress={() => setFilter('ALL')} />
        <Stat value={counts.published} label="Live" active={filter === 'PUBLISHED'} onPress={() => setFilter('PUBLISHED')} />
        <Stat value={counts.draft} label="Drafts" active={filter === 'DRAFT'} onPress={() => setFilter('DRAFT')} />
        <Stat value={counts.closed} label="Closed" active={filter === 'CLOSED'} onPress={() => setFilter('CLOSED')} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {STATUS_FILTERS.map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}
      </ScrollView>

      {error && <View style={styles.error}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.retry}>Retry</Text></Pressable></View>}
      {!error && visibleJobs.length === 0 && <View style={styles.empty}><Text style={styles.emptyIcon}>📋</Text><Text style={styles.emptyTitle}>{filter === 'ALL' ? 'No jobs yet' : `No ${filter.toLowerCase()} jobs`}</Text><Text style={styles.emptyText}>{filter === 'ALL' ? 'Create your first job and start finding the right worker.' : 'Try another status filter or create a new job.'}</Text><Pressable style={styles.primary} onPress={() => router.push('/employer-job-create')}><Text style={styles.primaryText}>Create job</Text></Pressable></View>}

      {visibleJobs.map((job) => <JobCard key={job.id} job={job} busy={busyJobId === job.id} onOpen={() => router.push({ pathname: '/employer-job-details', params: { id: job.id } })} onAction={(action) => confirmStatus(job, action)} />)}
    </ScrollView>
  </SafeAreaView>;
}

function Stat({ value, label, active, onPress }: { value: number; label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.stat, active && styles.statActive]}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></Pressable>;
}

function JobCard({ job, busy, onOpen, onAction }: { job: EmployerJob; busy: boolean; onOpen: () => void; onAction: (action: 'pause' | 'resume' | 'close' | 'reopen') => void }) {
  const applications = job._count?.applications ?? 0;
  const status = job.status;
  const canEdit = status === 'DRAFT';
  const action = status === 'PUBLISHED' ? 'pause' : status === 'PAUSED' ? 'resume' : status === 'CLOSED' ? 'reopen' : null;
  const actionLabel = action === 'pause' ? 'Pause' : action === 'resume' ? 'Resume' : action === 'reopen' ? 'Reopen' : '';

  return <View style={styles.card}>
    <Pressable onPress={onOpen}>
      <View style={styles.cardTop}><Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text><StatusBadge status={status} /></View>
      <Text style={styles.location}>📍 {job.city}{job.state ? `, ${job.state}` : ''}</Text>
      <Text style={styles.meta}>₹{job.salaryMin ?? 0}{job.salaryMax ? ` - ₹${job.salaryMax}` : ''} / {job.salaryType} • {job.openings} opening{job.openings === 1 ? '' : 's'}</Text>
      <View style={styles.applicationSummary}><Text style={styles.applicationCount}>{applications}</Text><Text style={styles.applicationLabel}> application{applications === 1 ? '' : 's'}</Text><Text style={styles.viewLink}>View details ›</Text></View>
    </Pressable>
    <View style={styles.actions}>
      {canEdit && <Pressable style={styles.actionSecondary} onPress={() => router.push({ pathname: '/employer-job-create', params: { id: job.id } })}><Text style={styles.actionSecondaryText}>Edit</Text></Pressable>}
      {action && <Pressable disabled={busy} style={styles.actionSecondary} onPress={() => onAction(action)}><Text style={styles.actionSecondaryText}>{busy ? '...' : actionLabel}</Text></Pressable>}
      {(status === 'PUBLISHED' || status === 'PAUSED') && <Pressable disabled={busy} style={styles.actionDanger} onPress={() => onAction('close')}><Text style={styles.actionDangerText}>Close</Text></Pressable>}
    </View>
  </View>;
}

function StatusBadge({ status }: { status: string }) {
  return <View style={styles.badge}><Text style={styles.badgeText}>{status}</Text></View>;
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
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  stat: { flex: 1, minHeight: 68, borderRadius: 15, borderWidth: 1, borderColor: BrandColors.slateBorder, backgroundColor: BrandColors.slateSoft, padding: 10 },
  statActive: { borderColor: BrandColors.gold },
  statValue: { color: BrandColors.text, fontSize: 22, fontWeight: '900' },
  statLabel: { color: BrandColors.textSecondary, fontSize: 10, marginTop: 3 },
  filters: { gap: 8, paddingVertical: 14 },
  filter: { borderRadius: 999, borderWidth: 1, borderColor: BrandColors.slateBorder, paddingHorizontal: 13, paddingVertical: 8 },
  filterActive: { borderColor: BrandColors.gold, backgroundColor: '#2A2416' },
  filterText: { color: BrandColors.textSecondary, fontSize: 10, fontWeight: '800' },
  filterTextActive: { color: BrandColors.gold },
  error: { marginTop: 4, padding: 14, borderRadius: 14, backgroundColor: '#3b1919', borderWidth: 1, borderColor: '#6c3030' },
  errorText: { color: '#ffd2d2', fontWeight: '700' },
  retry: { color: BrandColors.gold, fontWeight: '900', marginTop: 9 },
  empty: { marginTop: 12, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: BrandColors.slateBorder, backgroundColor: BrandColors.slateSoft, alignItems: 'center' },
  emptyIcon: { fontSize: 34 },
  emptyTitle: { color: BrandColors.text, fontSize: 20, fontWeight: '900', marginTop: 10 },
  emptyText: { color: BrandColors.textSecondary, textAlign: 'center', lineHeight: 20, marginTop: 6 },
  primary: { marginTop: 16, backgroundColor: BrandColors.gold, borderRadius: 13, paddingHorizontal: 18, paddingVertical: 13 },
  primaryText: { color: BrandColors.slate, fontWeight: '900' },
  card: { marginTop: 12, backgroundColor: BrandColors.slateSoft, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BrandColors.slateBorder },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  jobTitle: { flex: 1, color: BrandColors.text, fontSize: 17, fontWeight: '900' },
  badge: { borderRadius: 999, borderWidth: 1, borderColor: BrandColors.gold, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { color: BrandColors.gold, fontSize: 9, fontWeight: '900' },
  location: { color: BrandColors.textSecondary, fontSize: 12, marginTop: 8 },
  meta: { color: BrandColors.textSecondary, fontSize: 12, marginTop: 6 },
  applicationSummary: { borderTopWidth: 1, borderTopColor: BrandColors.slateBorder, marginTop: 13, paddingTop: 12, flexDirection: 'row', alignItems: 'center' },
  applicationCount: { color: BrandColors.gold, fontSize: 15, fontWeight: '900' },
  applicationLabel: { color: BrandColors.textSecondary, fontSize: 11 },
  viewLink: { marginLeft: 'auto', color: BrandColors.gold, fontWeight: '900', fontSize: 11 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionSecondary: { minWidth: 74, height: 38, borderRadius: 11, borderWidth: 1, borderColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  actionSecondaryText: { color: BrandColors.gold, fontSize: 11, fontWeight: '900' },
  actionDanger: { minWidth: 68, height: 38, borderRadius: 11, borderWidth: 1, borderColor: '#7A4545', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  actionDangerText: { color: '#E9A6A6', fontSize: 11, fontWeight: '900' },
});
