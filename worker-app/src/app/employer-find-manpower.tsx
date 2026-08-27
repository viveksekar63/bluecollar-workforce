import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ManpowerWorker, searchManpower } from '@/api/employer-manpower';
import { BrandColors } from '@/constants/theme';

const CATEGORIES = ['All', 'Chef', 'Parota Master', 'Waiter', 'Housekeeping', 'Security', 'Driver', 'Sales'];
const LOCATIONS = ['All', 'Thanjavur', 'Trichy', 'Chennai', 'Madurai'];

export default function EmployerFindManpowerScreen() {
  const [workers, setWorkers] = useState<ManpowerWorker[]>([]);
  const [search, setSearch] = useState('');
  const [skill, setSkill] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    try {
      const result = await searchManpower({ search: search.trim() || undefined, skill: skill || undefined, location: location || undefined, limit: 20 });
      setWorkers(result.items ?? []); setTotal(result.total ?? 0);
    } catch {
      setWorkers([]); setTotal(0);
    } finally { setLoading(false); setRefreshing(false); }
  }, [search, skill, location]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return <SafeAreaView style={styles.container}>
    <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={BrandColors.gold} />} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><View style={styles.headerCopy}><Text style={styles.eyebrow}>MANPOWER</Text><Text style={styles.title}>Find Workers</Text><Text style={styles.subtitle}>Find verified manpower for your business.</Text></View></View>
      <View style={styles.searchBox}><Text style={styles.searchIcon}>⌕</Text><TextInput value={search} onChangeText={setSearch} onSubmitEditing={() => void load()} placeholder="Search skill, worker or category" placeholderTextColor={BrandColors.muted} style={styles.searchInput} returnKeyType="search" /><Pressable onPress={() => void load()} style={styles.searchButton}><Text style={styles.searchButtonText}>Search</Text></Pressable></View>
      <Text style={styles.filterLabel}>Worker category</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{CATEGORIES.map((item) => { const active = (item === 'All' ? skill === '' : skill === item); return <Pressable key={item} onPress={() => { setSkill(item === 'All' ? '' : item); }} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text></Pressable>; })}</ScrollView>
      <Text style={styles.filterLabel}>Location</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{LOCATIONS.map((item) => { const active = (item === 'All' ? location === '' : location === item); return <Pressable key={item} onPress={() => setLocation(item === 'All' ? '' : item)} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text></Pressable>; })}</ScrollView>
      <View style={styles.resultsHeader}><View><Text style={styles.sectionTitle}>Available workers</Text><Text style={styles.sectionSubtitle}>{total} workers found</Text></View></View>
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color={BrandColors.gold} /></View> : workers.length === 0 ? <View style={styles.empty}><Text style={styles.emptyIcon}>👷</Text><Text style={styles.emptyTitle}>No workers found</Text><Text style={styles.emptyText}>Try another skill or location.</Text></View> : workers.map((worker) => <WorkerCard key={worker.id} worker={worker} />)}
    </ScrollView>
  </SafeAreaView>;
}

function WorkerCard({ worker }: { worker: ManpowerWorker }) {
  const name = `${worker.firstName ?? 'Worker'} ${worker.lastName ?? ''}`.trim();
  const verified = ['VERIFIED', 'COMPLETED', 'APPROVED'].includes(String(worker.verificationStatus ?? '').toUpperCase());
  const available = ['AVAILABLE', 'ACTIVE'].includes(String(worker.availability ?? '').toUpperCase());
  return <Pressable style={styles.card} onPress={() => router.push({ pathname: '/employer-worker-details', params: { id: worker.id } })}>
    <View style={styles.avatar}><Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text></View>
    <View style={styles.workerCopy}><View style={styles.nameRow}><Text style={styles.name} numberOfLines={1}>{name}</Text>{verified && <Text style={styles.verified}>✓ Verified</Text>}</View><Text style={styles.profession}>{worker.profession || worker.primarySkill}</Text><Text style={styles.meta}>📍 {worker.city}, {worker.state}  •  {worker.experienceYears} yrs exp.</Text><View style={styles.bottomRow}><Text style={available ? styles.available : styles.unavailable}>● {available ? 'Available' : 'Currently working'}</Text><Text style={styles.contact}>🔒 View Contact</Text></View></View>
  </Pressable>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: BrandColors.background }, content: { padding: 18, paddingBottom: 50 }, header: { flexDirection: 'row', gap: 10 }, back: { color: BrandColors.gold, fontSize: 36, lineHeight: 32 }, headerCopy: { flex: 1 }, eyebrow: { color: BrandColors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, title: { color: BrandColors.text, fontSize: 28, fontWeight: '900', marginTop: 3 }, subtitle: { color: BrandColors.textSecondary, fontSize: 12, marginTop: 4 }, searchBox: { marginTop: 18, minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: BrandColors.slateBorder, backgroundColor: BrandColors.slateSoft, flexDirection: 'row', alignItems: 'center', paddingLeft: 12 }, searchIcon: { color: BrandColors.gold, fontSize: 23 }, searchInput: { flex: 1, color: BrandColors.text, paddingHorizontal: 8, fontSize: 13 }, searchButton: { backgroundColor: BrandColors.gold, height: 40, borderRadius: 10, paddingHorizontal: 13, justifyContent: 'center', marginRight: 5 }, searchButtonText: { color: BrandColors.slate, fontWeight: '900', fontSize: 11 }, filterLabel: { color: BrandColors.textSecondary, fontSize: 10, fontWeight: '900', marginTop: 16, marginBottom: 8 }, chips: { gap: 8 }, chip: { borderWidth: 1, borderColor: BrandColors.slateBorder, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: BrandColors.slateSoft }, chipActive: { borderColor: BrandColors.gold, backgroundColor: '#2A2416' }, chipText: { color: BrandColors.textSecondary, fontSize: 10, fontWeight: '800' }, chipTextActive: { color: BrandColors.gold }, resultsHeader: { marginTop: 21, marginBottom: 10 }, sectionTitle: { color: BrandColors.text, fontSize: 17, fontWeight: '900' }, sectionSubtitle: { color: BrandColors.textSecondary, fontSize: 10, marginTop: 2 }, center: { paddingVertical: 60, alignItems: 'center' }, card: { marginTop: 9, borderRadius: 17, borderWidth: 1, borderColor: BrandColors.slateBorder, backgroundColor: BrandColors.slateSoft, padding: 14, flexDirection: 'row', gap: 12 }, avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: BrandColors.slate, borderWidth: 1, borderColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: BrandColors.gold, fontSize: 21, fontWeight: '900' }, workerCopy: { flex: 1, minWidth: 0 }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, name: { color: BrandColors.text, fontSize: 15, fontWeight: '900', flexShrink: 1 }, verified: { color: BrandColors.gold, fontSize: 8, fontWeight: '900' }, profession: { color: BrandColors.gold, fontSize: 11, fontWeight: '800', marginTop: 3 }, meta: { color: BrandColors.textSecondary, fontSize: 10, marginTop: 5 }, bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }, available: { color: '#8FD6A5', fontSize: 9, fontWeight: '900' }, unavailable: { color: BrandColors.muted, fontSize: 9, fontWeight: '800' }, contact: { color: BrandColors.gold, fontSize: 9, fontWeight: '900' }, empty: { alignItems: 'center', paddingVertical: 50 }, emptyIcon: { fontSize: 38 }, emptyTitle: { color: BrandColors.text, fontSize: 18, fontWeight: '900', marginTop: 8 }, emptyText: { color: BrandColors.textSecondary, fontSize: 11, marginTop: 4 } });
