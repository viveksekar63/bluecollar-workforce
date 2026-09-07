import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { getAiContactRecommendations, shortlistAiWorker, type AiContactRecommendation } from '@/api/employer-recruitment';
import { BrandColors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const actionLabels = { CONTACT_NOW: 'Contact first', HIGH_PRIORITY: 'High priority', REVIEW: 'Review' } as const;

export default function EmployerAiContactRecommendationsScreen() {
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  const id = String(jobId ?? '');
  const [items, setItems] = useState<AiContactRecommendation[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyWorker, setBusyWorker] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    try {
      setError(null);
      const data = await getAiContactRecommendations(id, 20);
      setItems(data.recommendations);
      setJobTitle(data.job.title);
    } catch {
      setError('Unable to load AI recommendations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const shortlist = async (candidate: AiContactRecommendation) => {
    if (candidate.isShortlisted || busyWorker) return;
    try {
      setBusyWorker(candidate.workerId);
      await shortlistAiWorker(id, candidate.workerId, {
        matchScore: candidate.matchScore,
        matchTier: candidate.matchTier ?? undefined,
        matchExplanation: { reasons: candidate.matchReasons, source: 'AI_CONTACT_RECOMMENDATIONS' },
      });
      setItems((current) => current.map((item) => item.workerId === candidate.workerId ? { ...item, isShortlisted: true } : item));
    } catch {
      setError('Unable to shortlist this worker. Please try again.');
    } finally {
      setBusyWorker(null);
    }
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={BrandColors.indigo} /></View></SafeAreaView>;

  return <SafeAreaView style={styles.container} edges={['top']}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={BrandColors.indigo} />}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></Pressable>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>AI CONTACT QUEUE</Text><Text style={styles.title}>{jobTitle || 'Recommended workers'}</Text><Text style={styles.subtitle}>AI-ranked workers to consider contacting first.</Text></View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>AI has done the matching</Text>
        <Text style={styles.infoText}>Review the strongest matches, shortlist the workers you want to recruit, then use the existing contact-unlock flow when you are ready to reveal contact details.</Text>
        <View style={styles.lockRow}><Text style={styles.lockIcon}>🔒</Text><Text style={styles.lockText}>Phone, WhatsApp and email remain locked until contact access is unlocked.</Text></View>
      </View>

      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
      {!items.length ? <View style={styles.empty}><Text style={styles.emptyTitle}>No AI recommendations yet</Text><Text style={styles.emptyText}>Make sure this job has AI requirements and matching workers.</Text></View> : items.map((candidate) => <RecommendationCard key={candidate.workerId} candidate={candidate} busy={busyWorker === candidate.workerId} onShortlist={() => void shortlist(candidate)} onOpen={() => router.push({ pathname: '/employer-recruitment-workspace', params: { jobId: id, workerId: candidate.workerId } })} />)}
    </ScrollView>
  </SafeAreaView>;
}

function RecommendationCard({ candidate, busy, onShortlist, onOpen }: { candidate: AiContactRecommendation; busy: boolean; onShortlist: () => void; onOpen: () => void }) {
  const initials = candidate.name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'W';
  return <View style={styles.card}>
    <View style={styles.cardTop}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
      <View style={styles.identity}><View style={styles.nameRow}><Text style={styles.name} numberOfLines={1}>{candidate.name}</Text><View style={styles.matchPill}><Text style={styles.matchText}>{candidate.matchScore}% match</Text></View></View><Text style={styles.meta}>{candidate.profession} · {candidate.experienceYears ?? 0} yrs</Text><Text style={styles.code}>{candidate.workerCode} · Verification {candidate.verificationScore ?? 0}/100</Text></View>
    </View>
    <View style={styles.metrics}><Metric label="AI rank" value={`#${candidate.recommendationRank}`} /><Metric label="Match" value={`${candidate.matchScore}%`} /><Metric label="Verification" value={`${candidate.verificationScore ?? 0}`} /></View>
    <View style={styles.actionRow}><Text style={styles.actionLabel}>{actionLabels[candidate.recommendationAction]}</Text>{candidate.matchReasons.slice(0, 2).map((reason) => <Text key={reason} style={styles.reason} numberOfLines={1}>• {reason}</Text>)}</View>
    <View style={styles.footer}>
      {candidate.isShortlisted ? <Pressable style={styles.primary} onPress={onOpen}><Text style={styles.primaryText}>Open recruitment</Text></Pressable> : <Pressable style={styles.primary} onPress={onShortlist} disabled={busy}>{busy ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.primaryText}>Shortlist worker</Text>}</Pressable>}
      <View style={styles.locked}><Text style={styles.lockedIcon}>🔒</Text><Text style={styles.lockedText}>Contact locked</Text></View>
    </View>
  </View>;
}

function Metric({ label, value }: { label: string; value: string }) { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background },
  content: { padding: 20, paddingBottom: 120 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: BrandColors.border, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  backText: { fontSize: 29, color: BrandColors.navy, lineHeight: 31 },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 1.4, color: BrandColors.indigo },
  title: { fontSize: 21, fontWeight: '900', color: BrandColors.navy, marginTop: 2 },
  subtitle: { fontSize: 10, color: BrandColors.textSecondary, lineHeight: 15, marginTop: 3 },
  infoCard: { backgroundColor: BrandColors.indigo, borderRadius: 20, padding: 18, marginBottom: 14 },
  infoTitle: { fontSize: 17, fontWeight: '900', color: '#FFF' },
  infoText: { fontSize: 10.5, lineHeight: 16, color: '#DCEBFF', marginTop: 6 },
  lockRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,.12)', borderRadius: 12, padding: 9, marginTop: 12 },
  lockIcon: { fontSize: 13, marginRight: 7 },
  lockText: { flex: 1, fontSize: 8.5, lineHeight: 13, fontWeight: '800', color: '#FFF' },
  error: { backgroundColor: '#FFF1F2', borderRadius: 12, padding: 11, marginBottom: 10 },
  errorText: { fontSize: 9, fontWeight: '800', color: '#9F1239' },
  empty: { backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: BrandColors.border, padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '900', color: BrandColors.navy },
  emptyText: { fontSize: 10, color: BrandColors.textSecondary, textAlign: 'center', marginTop: 5 },
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: BrandColors.border, borderRadius: 19, padding: 14, marginBottom: 11 },
  cardTop: { flexDirection: 'row' },
  avatar: { width: 47, height: 47, borderRadius: 15, backgroundColor: BrandColors.skySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '900', color: BrandColors.indigo },
  identity: { flex: 1, marginLeft: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { flex: 1, fontSize: 13, fontWeight: '900', color: BrandColors.navy },
  matchPill: { backgroundColor: BrandColors.skySoft, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4, marginLeft: 6 },
  matchText: { fontSize: 8, fontWeight: '900', color: BrandColors.indigo },
  meta: { fontSize: 9, color: BrandColors.textSecondary, marginTop: 3 },
  code: { fontSize: 7.5, color: BrandColors.muted, marginTop: 3 },
  metrics: { flexDirection: 'row', marginTop: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: BrandColors.border, paddingVertical: 9 },
  metric: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderColor: BrandColors.border },
  metricValue: { fontSize: 13, fontWeight: '900', color: BrandColors.navy },
  metricLabel: { fontSize: 7.5, color: BrandColors.textSecondary, marginTop: 2 },
  actionRow: { marginTop: 10 },
  actionLabel: { fontSize: 9, fontWeight: '900', color: BrandColors.indigo, textTransform: 'uppercase', letterSpacing: .6 },
  reason: { fontSize: 8.5, color: BrandColors.textSecondary, marginTop: 3 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  primary: { flex: 1, minHeight: 40, borderRadius: 12, backgroundColor: BrandColors.navy, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  primaryText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  locked: { marginLeft: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  lockedIcon: { fontSize: 12 },
  lockedText: { fontSize: 7.5, color: BrandColors.textSecondary, fontWeight: '800', marginTop: 2 },
});
