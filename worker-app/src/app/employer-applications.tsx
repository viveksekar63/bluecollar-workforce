import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmployerApplication, getEmployerApplications } from '@/api/employer-jobs';
import { BrandColors } from '@/constants/theme';

const filters = ['ALL', 'NEW', 'SHORTLISTED', 'REJECTED'];

export default function EmployerApplicationsScreen() {
  const [applications, setApplications] = useState<EmployerApplication[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getEmployerApplications();
      setApplications(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Unable to load applications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const filtered = applications.filter((item) => {
    if (filter === 'ALL') return true;
    if (filter === 'NEW') return item.status === 'APPLIED' || item.status === 'PENDING';
    return item.status === filter;
  });

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={BrandColors.gold} /></View></SafeAreaView>;

  return <SafeAreaView style={styles.container}>
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={BrandColors.gold} />} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>EMPLOYER</Text><Text style={styles.title}>Applications</Text><Text style={styles.subtitle}>Review applicants and choose the right worker.</Text></View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item === 'ALL' ? 'All' : item.charAt(0) + item.slice(1).toLowerCase()}</Text></Pressable>)}
      </ScrollView>

      {error && <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View>}
      {!error && filtered.length === 0 && <View style={styles.empty}><Text style={styles.emptyIcon}>👷</Text><Text style={styles.emptyTitle}>No applications here</Text><Text style={styles.emptyText}>Applications from workers will appear here when they apply to your jobs.</Text></View>}

      {filtered.map((item) => {
        const name = `${item.worker?.user?.firstName ?? 'Worker'} ${item.worker?.user?.lastName ?? ''}`.trim();
        return <Pressable key={item.id} style={styles.card} onPress={() => router.push({ pathname: '/employer-application-details', params: { id: item.id } })}>
          <View style={styles.cardTop}><View style={styles.avatar}><Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text></View><View style={styles.workerCopy}><Text style={styles.name}>{name}</Text><Text style={styles.profession}>{item.worker?.profession || item.worker?.professionCategory || 'Blue-collar worker'}</Text><Text style={styles.job}>{item.job?.title || 'Job application'}</Text></View><View style={styles.badge}><Text style={styles.badgeText}>{item.status}</Text></View></View>
          <View style={styles.metaRow}><Text style={styles.meta}>Experience: {item.worker?.experienceYears ?? 0} yrs</Text><Text style={styles.meta}>Applied: {new Date(item.appliedAt).toLocaleDateString()}</Text></View>
          <View style={styles.cardBottom}><Text style={styles.cardLink}>Review application</Text><Text style={styles.cardLink}>›</Text></View>
        </Pressable>;
      })}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background },
  content: { padding: 18, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  back: { color: BrandColors.gold, fontSize: 36, lineHeight: 32 },
  headerCopy: { flex: 1 },
  eyebrow: { color: BrandColors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: BrandColors.text, fontSize: 28, fontWeight: '900', marginTop: 3 },
  subtitle: { color: BrandColors.textSecondary, fontSize: 13, marginTop: 4 },
  filters: { gap: 8, paddingVertical: 18 },
  filter: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: BrandColors.slateBorder, backgroundColor: BrandColors.slate },
  filterActive: { borderColor: BrandColors.gold, backgroundColor: BrandColors.goldSoft },
  filterText: { color: BrandColors.textSecondary, fontSize: 12, fontWeight: '800' },
  filterTextActive: { color: BrandColors.gold },
  error: { padding: 14, borderRadius: 14, backgroundColor: '#3b1919', borderWidth: 1, borderColor: '#6c3030' },
  errorText: { color: '#ffd2d2', fontWeight: '700' },
  empty: { padding: 28, marginTop: 8, alignItems: 'center', borderRadius: 20, borderWidth: 1, borderColor: BrandColors.slateBorder, backgroundColor: BrandColors.slateSoft },
  emptyIcon: { fontSize: 34 },
  emptyTitle: { color: BrandColors.text, fontSize: 19, fontWeight: '900', marginTop: 10 },
  emptyText: { color: BrandColors.textSecondary, textAlign: 'center', lineHeight: 20, marginTop: 6 },
  card: { backgroundColor: BrandColors.slateSoft, borderWidth: 1, borderColor: BrandColors.slateBorder, borderRadius: 18, padding: 15, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: BrandColors.goldSoft, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  avatarText: { color: BrandColors.gold, fontSize: 18, fontWeight: '900' },
  workerCopy: { flex: 1 },
  name: { color: BrandColors.text, fontSize: 15, fontWeight: '900' },
  profession: { color: BrandColors.gold, fontSize: 11, marginTop: 2, fontWeight: '800' },
  job: { color: BrandColors.textSecondary, fontSize: 11, marginTop: 2 },
  badge: { borderRadius: 999, borderWidth: 1, borderColor: BrandColors.gold, paddingHorizontal: 8, paddingVertical: 5 },
  badgeText: { color: BrandColors.gold, fontSize: 9, fontWeight: '900' },
  metaRow: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: BrandColors.slateBorder, marginTop: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between' },
  meta: { color: BrandColors.textSecondary, fontSize: 10 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 11 },
  cardLink: { color: BrandColors.gold, fontSize: 12, fontWeight: '900' },
});
