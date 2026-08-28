import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ManpowerWorker, searchManpower } from '@/api/employer-manpower';
import { BrandColors } from '@/constants/theme';

const CATEGORIES = [
  ['All', '✦'],
  ['Chef', '♨'],
  ['Parota Master', '✦'],
  ['Waiter', '◉'],
  ['Housekeeping', '✦'],
  ['Security', '◇'],
  ['Driver', '▰'],
  ['Sales', '▣'],
] as const;

const LOCATIONS = [
  ['All', '⌖'],
  ['Thanjavur', '⌖'],
  ['Trichy', '⌖'],
  ['Chennai', '⌖'],
  ['Madurai', '⌖'],
] as const;

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
      const result = await searchManpower({
        search: search.trim() || undefined,
        skill: skill || undefined,
        location: location || undefined,
        limit: 20,
      });
      setWorkers(result.items ?? []);
      setTotal(result.total ?? 0);
    } catch {
      setWorkers([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, skill, location]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); void load(); }}
            tintColor={BrandColors.indigo}
          />
        }
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>MANPOWER</Text>
            <Text style={styles.title}>Find Workers</Text>
            <Text style={styles.subtitle}>Find verified manpower for your business.</Text>
          </View>
          <View style={styles.profileDot}><Text style={styles.profileIcon}>●</Text></View>
        </View>

        <View style={styles.searchShell}>
          <View style={styles.searchField}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => void load()}
              placeholder="Search skill, worker or category"
              placeholderTextColor="#64748B"
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>
          <Pressable onPress={() => void load()} style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}>
            <Text style={styles.searchButtonIcon}>✦</Text>
            <Text style={styles.searchButtonText}>Search</Text>
          </Pressable>
        </View>

        <FilterSection label="Worker category">
          {CATEGORIES.map(([item, icon]) => {
            const active = item === 'All' ? skill === '' : skill === item;
            return (
              <Pressable
                key={item}
                onPress={() => setSkill(item === 'All' ? '' : item)}
                style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
              >
                <Text style={[styles.chipIcon, active && styles.chipIconActive]}>{icon}</Text>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </Pressable>
            );
          })}
        </FilterSection>

        <FilterSection label="Location">
          {LOCATIONS.map(([item, icon]) => {
            const active = item === 'All' ? location === '' : location === item;
            return (
              <Pressable
                key={item}
                onPress={() => setLocation(item === 'All' ? '' : item)}
                style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
              >
                <Text style={[styles.chipIcon, active && styles.chipIconActive]}>{icon}</Text>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </Pressable>
            );
          })}
        </FilterSection>

        <View style={styles.divider} />
        <View style={styles.resultsHeader}>
          <View>
            <Text style={styles.sectionTitle}>Available workers</Text>
            <Text style={styles.sectionSubtitle}>{total} workers found</Text>
          </View>
          <Pressable style={styles.sortButton} onPress={() => {}}>
            <Text style={styles.sortText}>Recently added</Text>
            <Text style={styles.sortChevron}>⌄</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={BrandColors.indigo} /></View>
        ) : workers.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>⌕</Text></View>
            <Text style={styles.emptyTitle}>No workers found</Text>
            <Text style={styles.emptyText}>Try another skill or location.</Text>
          </View>
        ) : (
          workers.map((worker) => <WorkerCard key={worker.id} worker={worker} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {children}
      </ScrollView>
    </View>
  );
}

function WorkerCard({ worker }: { worker: ManpowerWorker }) {
  const name = `${worker.firstName ?? 'Worker'} ${worker.lastName ?? ''}`.trim();
  const verified = ['VERIFIED', 'COMPLETED', 'APPROVED'].includes(String(worker.verificationStatus ?? '').toUpperCase());
  const available = ['AVAILABLE', 'ACTIVE'].includes(String(worker.availability ?? '').toUpperCase());

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push({ pathname: '/employer-worker-details', params: { id: worker.id } })}
    >
      <View style={styles.cardMain}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text></View>
          {available && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.workerCopy}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            {verified && <View style={styles.verifiedBadge}><Text style={styles.verifiedCheck}>✓</Text><Text style={styles.verifiedText}>Verified</Text></View>}
          </View>
          <Text style={styles.profession} numberOfLines={1}>{worker.profession || worker.primarySkill || 'Skilled Worker'}</Text>
          <Text style={styles.meta} numberOfLines={1}>📍 {worker.city || 'Location'}, {worker.state || 'Tamil Nadu'}  •  {worker.experienceYears ?? 0} yrs exp.</Text>
        </View>
        <View style={styles.availabilityBadge}>
          <View style={styles.availabilityDot} />
          <Text style={styles.availabilityText}>{available ? 'Available' : 'Busy'}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={available ? styles.available : styles.unavailable}>● {available ? 'Ready for work' : 'Currently working'}</Text>
        <View style={styles.contactButton}>
          <Text style={styles.lock}>♙</Text>
          <Text style={styles.contact}>View Contact</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 125 },
  header: { minHeight: 92, flexDirection: 'row', alignItems: 'center', paddingLeft: 66, paddingRight: 4 },
  headerCopy: { flex: 1 },
  eyebrow: { color: BrandColors.indigo, fontSize: 11, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: BrandColors.navy, fontSize: 28, fontWeight: '900', lineHeight: 33, marginTop: 3 },
  subtitle: { color: BrandColors.textSecondary, fontSize: 12, marginTop: 4 },
  profileDot: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', alignItems: 'center', justifyContent: 'center' },
  profileIcon: { color: BrandColors.indigo, fontSize: 22 },
  searchShell: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#BFDBFE', padding: 6, flexDirection: 'row', alignItems: 'center', shadowColor: '#0A1F44', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  searchField: { flex: 1, minHeight: 50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  searchIcon: { color: BrandColors.indigo, fontSize: 25, width: 28 },
  searchInput: { flex: 1, color: BrandColors.navy, fontSize: 13, paddingVertical: 10 },
  searchButton: { height: 48, minWidth: 105, borderRadius: 13, backgroundColor: BrandColors.indigo, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, paddingHorizontal: 14 },
  searchButtonIcon: { color: '#FFFFFF', fontSize: 14 },
  searchButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  filterSection: { marginTop: 18 },
  filterLabel: { color: BrandColors.navy, fontSize: 12, fontWeight: '900', marginBottom: 9 },
  chips: { gap: 8, paddingRight: 4 },
  chip: { height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#D6E5FA', backgroundColor: '#FFFFFF', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipActive: { backgroundColor: BrandColors.indigo, borderColor: BrandColors.indigo, shadowColor: BrandColors.indigo, shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  chipIcon: { color: BrandColors.indigo, fontSize: 14, fontWeight: '800' },
  chipIconActive: { color: '#FFFFFF' },
  chipText: { color: '#35537D', fontSize: 11, fontWeight: '800' },
  chipTextActive: { color: '#FFFFFF' },
  divider: { height: 1, backgroundColor: '#E5EEF9', marginTop: 20 },
  resultsHeader: { marginTop: 17, marginBottom: 4, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  sectionTitle: { color: BrandColors.navy, fontSize: 19, fontWeight: '900' },
  sectionSubtitle: { color: BrandColors.textSecondary, fontSize: 11, marginTop: 3 },
  sortButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingBottom: 3 },
  sortText: { color: BrandColors.indigo, fontSize: 11, fontWeight: '900' },
  sortChevron: { color: BrandColors.indigo, fontSize: 16 },
  center: { paddingVertical: 70, alignItems: 'center' },
  card: { marginTop: 12, borderRadius: 18, borderWidth: 1, borderColor: '#D6E5FA', backgroundColor: '#FFFFFF', padding: 14, shadowColor: '#0A1F44', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardPressed: { transform: [{ scale: 0.99 }], backgroundColor: '#F8FBFF' },
  cardMain: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { position: 'relative', marginRight: 12 },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: BrandColors.navy, borderWidth: 2, borderColor: '#60A5FA', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 23, fontWeight: '900' },
  onlineDot: { position: 'absolute', right: -1, bottom: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: '#16A34A', borderWidth: 3, borderColor: '#FFFFFF' },
  workerCopy: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  name: { color: BrandColors.navy, fontSize: 15, fontWeight: '900', flexShrink: 1 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  verifiedCheck: { color: BrandColors.indigo, fontSize: 11, fontWeight: '900' },
  verifiedText: { color: BrandColors.indigo, fontSize: 9, fontWeight: '900' },
  profession: { color: BrandColors.indigo, fontSize: 12, fontWeight: '900', marginTop: 4 },
  meta: { color: BrandColors.textSecondary, fontSize: 10, marginTop: 5 },
  availabilityBadge: { position: 'absolute', right: 0, top: 0, borderRadius: 10, backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', paddingHorizontal: 7, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 },
  availabilityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  availabilityText: { color: '#15803D', fontSize: 8, fontWeight: '900' },
  cardFooter: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EDF3FA', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  available: { color: '#16A34A', fontSize: 9, fontWeight: '900' },
  unavailable: { color: '#64748B', fontSize: 9, fontWeight: '800' },
  contactButton: { height: 34, borderRadius: 10, borderWidth: 1, borderColor: '#BFDBFE', backgroundColor: '#F8FBFF', paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5 },
  lock: { color: BrandColors.indigo, fontSize: 14 },
  contact: { color: BrandColors.indigo, fontSize: 10, fontWeight: '900' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  emptyIconText: { color: BrandColors.indigo, fontSize: 28 },
  emptyTitle: { color: BrandColors.navy, fontSize: 18, fontWeight: '900', marginTop: 12 },
  emptyText: { color: BrandColors.textSecondary, fontSize: 11, marginTop: 4 },
  pressed: { opacity: 0.86 },
});
