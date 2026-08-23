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
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { getRecommendedJobs, WorkerJob } from '@/api/jobs';
import { BrandColors } from '@/constants/theme';

function formatSalary(job: WorkerJob) {
  const min = Number(job.salaryMin ?? 0);
  const max = Number(job.salaryMax ?? 0);

  if (!min && !max) return 'Salary not specified';

  const type = job.salaryType.replace(/_/g, ' ').toLowerCase();
  const suffix = type.includes('month') ? '/ month' : type.includes('day') ? '/ day' : '';

  if (min && max) {
    return `₹${min.toLocaleString('en-IN')} – ₹${max.toLocaleString('en-IN')} ${suffix}`.trim();
  }

  return `₹${(min || max).toLocaleString('en-IN')} ${suffix}`.trim();
}

function JobCard({ job }: { job: WorkerJob }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/job-details', params: { id: job.id } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.cardTop}>
        <View style={styles.jobIcon}>
          <Text style={styles.jobIconText}>✦</Text>
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
          <Text style={styles.company} numberOfLines={1}>{job.employer.companyName}</Text>
        </View>
        {job.matchScore !== undefined && (
          <View style={styles.matchBadge}>
            <Text style={styles.matchText}>{job.matchScore}% match</Text>
          </View>
        )}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>📍 {job.city}, {job.state}</Text>
        <Text style={styles.meta}>{job.openings} opening{job.openings === 1 ? '' : 's'}</Text>
      </View>

      <Text style={styles.salary}>{formatSalary(job)}</Text>

      <View style={styles.skillsRow}>
        {job.skills.slice(0, 3).map((item) => (
          <View key={item.skill.id} style={styles.skillPill}>
            <Text style={styles.skillText}>{item.skill.name}</Text>
          </View>
        ))}
        {job.applied && (
          <View style={styles.appliedPill}>
            <Text style={styles.appliedText}>Applied</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function ExploreScreen() {
  const [jobs, setJobs] = useState<WorkerJob[]>([]);
  const [location, setLocation] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadJobs = useCallback(async (city?: string) => {
    try {
      setError('');
      const result = await getRecommendedJobs(city?.trim() || undefined, 30);
      setJobs(result.items);
    } catch (err) {
      console.error('Failed to load jobs', err);
      setError('Unable to load jobs right now. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const filteredJobs = jobs.filter((job) => {
    const value = query.trim().toLowerCase();
    if (!value) return true;
    return [
      job.title,
      job.employer.companyName,
      job.city,
      job.state,
      ...job.skills.map((item) => item.skill.name),
    ].some((item) => item?.toLowerCase().includes(value));
  });

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadJobs(location);
            }}
            tintColor={BrandColors.burgundy}
          />
        }
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>WORK OPPORTUNITIES</Text>
            <Text style={styles.title}>Find your next job</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search job, skill or employer"
            placeholderTextColor={BrandColors.muted}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.locationRow}>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Location"
            placeholderTextColor={BrandColors.muted}
            style={styles.locationInput}
            autoCapitalize="words"
          />
          <Pressable
            onPress={() => loadJobs(location)}
            style={({ pressed }) => [styles.locationButton, pressed && styles.pressed]}
          >
            <Text style={styles.locationButtonText}>Search</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Recommended for you</Text>
            <Text style={styles.sectionSubtitle}>
              Matched using your profession, skills and location
            </Text>
          </View>
          {!loading && <Text style={styles.count}>{filteredJobs.length} jobs</Text>}
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={BrandColors.burgundy} />
            <Text style={styles.stateText}>Finding suitable jobs…</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Something went wrong</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <Pressable onPress={() => loadJobs(location)} style={styles.retryButton}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : filteredJobs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>⌕</Text>
            <Text style={styles.emptyTitle}>No matching jobs yet</Text>
            <Text style={styles.emptyText}>
              Try another search or update your profession and skills to improve your matches.
            </Text>
            <Pressable onPress={() => router.push('/profession')} style={styles.retryButton}>
              <Text style={styles.retryText}>Update profession</Text>
            </Pressable>
          </View>
        ) : (
          filteredJobs.map((job) => <JobCard key={job.id} job={job} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.background },
  container: { padding: 20, paddingTop: 54, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.border, alignItems: 'center', justifyContent: 'center' },
  backText: { color: BrandColors.burgundy, fontSize: 30, lineHeight: 32 },
  headerCopy: { marginLeft: 12, flex: 1 },
  eyebrow: { color: BrandColors.rose, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: BrandColors.text, fontSize: 24, fontWeight: '800', marginTop: 3 },
  searchBox: { height: 52, borderRadius: 16, backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 10 },
  searchIcon: { color: BrandColors.burgundy, fontSize: 23, marginRight: 8 },
  searchInput: { flex: 1, color: BrandColors.text, fontSize: 14 },
  locationRow: { flexDirection: 'row', marginBottom: 26 },
  locationInput: { flex: 1, height: 48, borderRadius: 14, backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.border, paddingHorizontal: 14, color: BrandColors.text, fontSize: 13 },
  locationButton: { marginLeft: 8, height: 48, paddingHorizontal: 18, borderRadius: 14, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center' },
  locationButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  sectionTitle: { color: BrandColors.text, fontSize: 18, fontWeight: '800' },
  sectionSubtitle: { color: BrandColors.textSecondary, fontSize: 11, marginTop: 4, maxWidth: 285 },
  count: { color: BrandColors.rose, fontSize: 11, fontWeight: '800', marginBottom: 2 },
  card: { backgroundColor: BrandColors.surface, borderRadius: 18, borderWidth: 1, borderColor: BrandColors.border, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  jobIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: BrandColors.burgundySoft, alignItems: 'center', justifyContent: 'center' },
  jobIconText: { color: BrandColors.burgundy, fontSize: 20, fontWeight: '800' },
  titleBlock: { flex: 1, marginLeft: 11, marginRight: 7 },
  jobTitle: { color: BrandColors.text, fontSize: 15, fontWeight: '800' },
  company: { color: BrandColors.textSecondary, fontSize: 12, marginTop: 3 },
  matchBadge: { backgroundColor: BrandColors.blushSoft, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6 },
  matchText: { color: BrandColors.burgundy, fontSize: 9, fontWeight: '800' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  meta: { color: BrandColors.textSecondary, fontSize: 11 },
  salary: { color: BrandColors.burgundy, fontSize: 14, fontWeight: '800', marginTop: 10 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 11 },
  skillPill: { backgroundColor: BrandColors.background, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, marginRight: 6, marginBottom: 5 },
  skillText: { color: BrandColors.textSecondary, fontSize: 9, fontWeight: '700' },
  appliedPill: { backgroundColor: BrandColors.successSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, marginBottom: 5 },
  appliedText: { color: '#147957', fontSize: 9, fontWeight: '800' },
  centerState: { alignItems: 'center', paddingVertical: 70 },
  stateText: { color: BrandColors.textSecondary, fontSize: 13, marginTop: 12 },
  emptyCard: { backgroundColor: BrandColors.surface, borderRadius: 20, borderWidth: 1, borderColor: BrandColors.border, padding: 24, alignItems: 'center', marginTop: 8 },
  emptyIcon: { color: BrandColors.burgundy, fontSize: 30, marginBottom: 8 },
  emptyTitle: { color: BrandColors.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: BrandColors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7 },
  retryButton: { backgroundColor: BrandColors.burgundy, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, marginTop: 16 },
  retryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.82 },
});
