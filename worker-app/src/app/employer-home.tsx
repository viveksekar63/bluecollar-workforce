import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getEmployerApplications, getEmployerJobs, EmployerApplication, EmployerJob } from '@/api/employer-jobs';
import { getCurrentSubscription } from '@/api/subscriptions';
import { BrandColors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

export default function EmployerHomeScreen() {
  const employer = useAuthStore((state) => state.employer);
  const user = useAuthStore((state) => state.user);
  const setActiveRole = useAuthStore((state) => state.setActiveRole);

  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [applications, setApplications] = useState<EmployerApplication[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      const [jobData, applicationData, subscriptionData] = await Promise.all([
        getEmployerJobs(),
        getEmployerApplications(),
        getCurrentSubscription(),
      ]);
      setJobs(Array.isArray(jobData) ? jobData : []);
      setApplications(Array.isArray(applicationData) ? applicationData : []);
      setSubscription(subscriptionData?.subscription ?? null);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Unable to load your dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadDashboard(); }, [loadDashboard]));

  const stats = useMemo(() => {
    const activeJobs = jobs.filter((job) => ['PUBLISHED', 'ACTIVE', 'OPEN'].includes(String(job.status).toUpperCase())).length;
    const pendingApplications = applications.filter((item) => ['APPLIED', 'PENDING', 'NEW'].includes(String(item.status).toUpperCase())).length;
    const shortlisted = applications.filter((item) => String(item.status).toUpperCase() === 'SHORTLISTED').length;
    return { activeJobs, pendingApplications, shortlisted };
  }, [jobs, applications]);

  const recentApplications = applications.slice(0, 3);
  const firstName = user?.firstName || employer?.companyName || 'Employer';
  const companyName = employer?.companyName || 'Your company';
  const jobsRemaining = subscription ? Math.max(0, (subscription.jobLimit ?? 0) - (subscription.jobsUsed ?? 0)) : 0;
  const profileCompletion = employer?.status === 'APPROVED' ? 100 : 70;

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={BrandColors.gold} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadDashboard(); }} tintColor={BrandColors.gold} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>EMPLOYER DASHBOARD</Text>
            <Text style={styles.title}>Welcome, {firstName}</Text>
            <Text style={styles.subtitle}>{companyName} · Find the right workers faster.</Text>
          </View>
          <Pressable style={styles.profileButton} onPress={() => router.push('/employer-profile')} accessibilityLabel="Open employer profile">
            <Text style={styles.profileIcon}>👤</Text>
          </Pressable>
        </View>

        {error && <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View>}

        <View style={styles.primaryCard}>
          <View style={styles.primaryCopy}>
            <Text style={styles.primaryEyebrow}>READY TO HIRE?</Text>
            <Text style={styles.primaryTitle}>Post a job and start receiving applications.</Text>
            <Text style={styles.primaryText}>Reach verified workers looking for opportunities in your area.</Text>
          </View>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/employer-job-create')}>
            <Text style={styles.primaryButtonText}>+ Post a Job</Text>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <Pressable style={styles.statCard} onPress={() => router.push('/employer-jobs')}>
            <Text style={styles.statValue}>{stats.activeJobs}</Text>
            <Text style={styles.statLabel}>Active Jobs</Text>
            <Text style={styles.statLink}>View jobs ›</Text>
          </Pressable>
          <Pressable style={styles.statCard} onPress={() => router.push('/employer-applications')}>
            <Text style={styles.statValue}>{stats.pendingApplications}</Text>
            <Text style={styles.statLabel}>New Applications</Text>
            <Text style={styles.statLink}>Review now ›</Text>
          </Pressable>
          <Pressable style={styles.statCard} onPress={() => router.push('/employer-applications')}>
            <Text style={styles.statValue}>{stats.shortlisted}</Text>
            <Text style={styles.statLabel}>Shortlisted</Text>
            <Text style={styles.statLink}>View candidates ›</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <View><Text style={styles.sectionTitle}>Your hiring activity</Text><Text style={styles.sectionSubtitle}>Keep your hiring moving</Text></View>
          <Pressable onPress={() => router.push('/employer-applications')}><Text style={styles.seeAll}>See all</Text></Pressable>
        </View>

        {recentApplications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>👷</Text>
            <Text style={styles.emptyTitle}>No applicants yet</Text>
            <Text style={styles.emptyText}>Post your first job to start receiving applications from workers.</Text>
            <Pressable style={styles.outlineButton} onPress={() => router.push('/employer-job-create')}><Text style={styles.outlineButtonText}>Create a Job</Text></Pressable>
          </View>
        ) : (
          <View style={styles.applicationList}>
            {recentApplications.map((item) => {
              const name = `${item.worker?.user?.firstName ?? 'Worker'} ${item.worker?.user?.lastName ?? ''}`.trim();
              return (
                <Pressable key={item.id} style={styles.applicationRow} onPress={() => router.push({ pathname: '/employer-application-details', params: { id: item.id } })}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text></View>
                  <View style={styles.applicationCopy}>
                    <Text style={styles.workerName}>{name}</Text>
                    <Text style={styles.applicationJob}>{item.job?.title || 'Job application'}</Text>
                    <Text style={styles.applicationMeta}>{item.worker?.profession || item.worker?.professionCategory || 'Blue-collar worker'} · {item.worker?.experienceYears ?? 0} yrs exp.</Text>
                  </View>
                  <View style={styles.statusBadge}><Text style={styles.statusText}>{item.status}</Text></View>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <View><Text style={styles.sectionTitle}>Subscription</Text><Text style={styles.sectionSubtitle}>Manage your monthly job allowance</Text></View>
          <Pressable onPress={() => router.push('/employer-subscription')}><Text style={styles.seeAll}>Manage</Text></Pressable>
        </View>

        <Pressable style={styles.subscriptionCard} onPress={() => router.push('/employer-subscription')}>
          <View style={styles.subscriptionTop}>
            <View>
              <Text style={styles.planEyebrow}>CURRENT PLAN</Text>
              <Text style={styles.planName}>{subscription?.planName || 'Free'}</Text>
            </View>
            <Text style={styles.planArrow}>›</Text>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, subscription?.jobLimit ? ((subscription.jobsUsed ?? 0) / subscription.jobLimit) * 100 : 0)}%` }]} /></View>
          <View style={styles.subscriptionMeta}><Text style={styles.metaText}>{subscription ? `${subscription.jobsUsed ?? 0} / ${subscription.jobLimit ?? 0} jobs used` : 'Free plan'}</Text><Text style={styles.metaText}>{subscription ? `${jobsRemaining} remaining` : 'Upgrade when ready'}</Text></View>
        </Pressable>

        <Pressable style={styles.profileCard} onPress={() => router.push('/employer-profile')}>
          <View style={styles.profileCardIcon}><Text>🏢</Text></View>
          <View style={styles.profileCardCopy}><Text style={styles.profileCardTitle}>Complete your company profile</Text><Text style={styles.profileCardText}>A complete profile helps workers trust your business.</Text><View style={styles.profileProgress}><View style={[styles.profileProgressFill, { width: `${profileCompletion}%` }]} /></View><Text style={styles.profilePercent}>{profileCompletion}% complete</Text></View>
          <Text style={styles.cardArrow}>›</Text>
        </Pressable>

        <View style={styles.quickActions}>
          <Pressable style={styles.quickAction} onPress={() => router.push('/employer-jobs')}><Text style={styles.quickIcon}>📋</Text><Text style={styles.quickText}>My Jobs</Text></Pressable>
          <Pressable style={styles.quickAction} onPress={() => router.push('/employer-applications')}><Text style={styles.quickIcon}>👥</Text><Text style={styles.quickText}>Applications</Text></Pressable>
          <Pressable style={styles.quickAction} onPress={() => router.push('/employer-subscription')}><Text style={styles.quickIcon}>💳</Text><Text style={styles.quickText}>Subscription</Text></Pressable>
        </View>

        <Pressable style={styles.switch} onPress={() => { setActiveRole('WORKER'); router.replace('/home'); }}>
          <Text style={styles.switchText}>Switch to Worker</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background },
  content: { padding: 18, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  headerCopy: { flex: 1 },
  eyebrow: { color: BrandColors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: BrandColors.text, fontSize: 28, fontWeight: '900', marginTop: 4 },
  subtitle: { color: BrandColors.textSecondary, fontSize: 12, marginTop: 4 },
  profileButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: BrandColors.slate, borderWidth: 1, borderColor: BrandColors.slateBorder, alignItems: 'center', justifyContent: 'center' },
  profileIcon: { fontSize: 20 },
  error: { padding: 12, borderRadius: 12, backgroundColor: '#3b1919', borderWidth: 1, borderColor: '#6c3030', marginBottom: 12 },
  errorText: { color: '#ffd2d2', fontSize: 12, fontWeight: '700' },
  primaryCard: { borderRadius: 18, padding: 18, backgroundColor: BrandColors.goldSoft, borderWidth: 1, borderColor: BrandColors.gold, marginBottom: 14 },
  primaryCopy: { marginBottom: 14 },
  primaryEyebrow: { color: BrandColors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  primaryTitle: { color: BrandColors.text, fontSize: 19, lineHeight: 24, fontWeight: '900', marginTop: 5 },
  primaryText: { color: BrandColors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 5 },
  primaryButton: { height: 48, borderRadius: 13, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: BrandColors.slate, fontSize: 14, fontWeight: '900' },
  statsGrid: { flexDirection: 'row', gap: 9, marginBottom: 22 },
  statCard: { flex: 1, minHeight: 112, padding: 13, borderRadius: 15, backgroundColor: BrandColors.slateSoft, borderWidth: 1, borderColor: BrandColors.slateBorder },
  statValue: { color: BrandColors.text, fontSize: 25, fontWeight: '900' },
  statLabel: { color: BrandColors.textSecondary, fontSize: 10, lineHeight: 14, marginTop: 2 },
  statLink: { color: BrandColors.gold, fontSize: 9, fontWeight: '900', marginTop: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 2 },
  sectionTitle: { color: BrandColors.text, fontSize: 17, fontWeight: '900' },
  sectionSubtitle: { color: BrandColors.textSecondary, fontSize: 10, marginTop: 2 },
  seeAll: { color: BrandColors.gold, fontSize: 11, fontWeight: '900' },
  emptyCard: { padding: 22, alignItems: 'center', borderRadius: 17, backgroundColor: BrandColors.slateSoft, borderWidth: 1, borderColor: BrandColors.slateBorder, marginBottom: 22 },
  emptyIcon: { fontSize: 31 },
  emptyTitle: { color: BrandColors.text, fontSize: 16, fontWeight: '900', marginTop: 8 },
  emptyText: { color: BrandColors.textSecondary, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 5 },
  outlineButton: { marginTop: 13, paddingHorizontal: 18, height: 40, borderRadius: 11, borderWidth: 1, borderColor: BrandColors.gold, justifyContent: 'center' },
  outlineButtonText: { color: BrandColors.gold, fontSize: 12, fontWeight: '900' },
  applicationList: { marginBottom: 22 },
  applicationRow: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8, borderRadius: 15, backgroundColor: BrandColors.slateSoft, borderWidth: 1, borderColor: BrandColors.slateBorder },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: BrandColors.goldSoft, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { color: BrandColors.gold, fontSize: 16, fontWeight: '900' },
  applicationCopy: { flex: 1 },
  workerName: { color: BrandColors.text, fontSize: 13, fontWeight: '900' },
  applicationJob: { color: BrandColors.gold, fontSize: 10, fontWeight: '800', marginTop: 2 },
  applicationMeta: { color: BrandColors.textSecondary, fontSize: 9, marginTop: 2 },
  statusBadge: { borderRadius: 999, borderWidth: 1, borderColor: BrandColors.gold, paddingHorizontal: 7, paddingVertical: 5 },
  statusText: { color: BrandColors.gold, fontSize: 8, fontWeight: '900' },
  subscriptionCard: { padding: 15, borderRadius: 17, backgroundColor: BrandColors.slateSoft, borderWidth: 1, borderColor: BrandColors.gold, marginBottom: 14 },
  subscriptionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planEyebrow: { color: BrandColors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  planName: { color: BrandColors.text, fontSize: 18, fontWeight: '900', marginTop: 2 },
  planArrow: { color: BrandColors.gold, fontSize: 28 },
  progressTrack: { height: 7, borderRadius: 999, backgroundColor: BrandColors.slateBorder, overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: BrandColors.gold },
  subscriptionMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  metaText: { color: BrandColors.textSecondary, fontSize: 9, fontWeight: '700' },
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 17, backgroundColor: BrandColors.slateSoft, borderWidth: 1, borderColor: BrandColors.slateBorder, marginBottom: 14 },
  profileCardIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: BrandColors.goldSoft, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  profileCardCopy: { flex: 1 },
  profileCardTitle: { color: BrandColors.text, fontSize: 12, fontWeight: '900' },
  profileCardText: { color: BrandColors.textSecondary, fontSize: 9, lineHeight: 14, marginTop: 2 },
  profileProgress: { height: 5, backgroundColor: BrandColors.slateBorder, borderRadius: 999, marginTop: 7, overflow: 'hidden' },
  profileProgressFill: { height: '100%', backgroundColor: BrandColors.gold, borderRadius: 999 },
  profilePercent: { color: BrandColors.gold, fontSize: 8, fontWeight: '900', marginTop: 3 },
  cardArrow: { color: BrandColors.gold, fontSize: 24, marginLeft: 7 },
  quickActions: { flexDirection: 'row', gap: 9, marginBottom: 14 },
  quickAction: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 14, backgroundColor: BrandColors.slate, borderWidth: 1, borderColor: BrandColors.slateBorder },
  quickIcon: { fontSize: 20 },
  quickText: { color: BrandColors.text, fontSize: 10, fontWeight: '800', marginTop: 5 },
  switch: { height: 46, borderRadius: 13, borderWidth: 1, borderColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center' },
  switchText: { color: BrandColors.gold, fontSize: 13, fontWeight: '800' },
});
