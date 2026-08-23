import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { getJob, WorkerJob } from '@/api/jobs';
import { BrandColors } from '@/constants/theme';

function formatSalary(job: WorkerJob) {
  const min = Number(job.salaryMin ?? 0);
  const max = Number(job.salaryMax ?? 0);
  if (!min && !max) return 'Salary not specified';
  const suffix = job.salaryType.toLowerCase().includes('month') ? ' / month' : job.salaryType.toLowerCase().includes('day') ? ' / day' : '';
  if (min && max) return `₹${min.toLocaleString('en-IN')} – ₹${max.toLocaleString('en-IN')}${suffix}`;
  return `₹${(min || max).toLocaleString('en-IN')}${suffix}`;
}

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<WorkerJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getJob(id)
      .then(setJob)
      .catch((err) => {
        console.error('Failed to load job', err);
        setError('Unable to load this job.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BrandColors.burgundy} />
        <Text style={styles.centerText}>Loading job details…</Text>
      </View>
    );
  }

  if (!job || error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Job unavailable</Text>
        <Text style={styles.centerText}>{error || 'This job could not be found.'}</Text>
        <Pressable onPress={() => router.back()} style={styles.primaryButton}>
          <Text style={styles.primaryText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
          <Text style={styles.backLabel}>Back to jobs</Text>
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>✦</Text>
          </View>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.company}>{job.employer.companyName}</Text>
          <View style={styles.locationPill}>
            <Text style={styles.locationText}>📍 {job.city}, {job.state}</Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>PAY</Text>
            <Text style={styles.statValue}>{formatSalary(job)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>OPENINGS</Text>
            <Text style={styles.statValue}>{job.openings}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>About the job</Text>
        <View style={styles.card}>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        <Text style={styles.sectionTitle}>Skills</Text>
        <View style={styles.card}>
          <View style={styles.skillsRow}>
            {job.skills.map((item) => (
              <View key={item.skill.id} style={styles.skillPill}>
                <Text style={styles.skillText}>{item.skill.name}</Text>
                {item.required && <Text style={styles.required}>Required</Text>}
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Employer</Text>
        <View style={styles.card}>
          <Text style={styles.companyName}>{job.employer.companyName}</Text>
          {job.employer.companyType && <Text style={styles.companyType}>{job.employer.companyType}</Text>}
          {job.employer.description && <Text style={styles.description}>{job.employer.description}</Text>}
        </View>

        {job.applied ? (
          <View style={styles.appliedBanner}>
            <Text style={styles.appliedTitle}>Application submitted</Text>
            <Text style={styles.appliedText}>You have already applied for this job.</Text>
          </View>
        ) : (
          <View style={styles.applyPlaceholder}>
            <Text style={styles.applyTitle}>Ready to apply?</Text>
            <Text style={styles.applyText}>Your profile and verified documents will be used for the application.</Text>
            <Text style={styles.comingSoon}>Apply flow coming next</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.background },
  container: { padding: 20, paddingTop: 54, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: BrandColors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  centerText: { color: BrandColors.textSecondary, fontSize: 13, marginTop: 10, textAlign: 'center' },
  errorTitle: { color: BrandColors.text, fontSize: 20, fontWeight: '800' },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  backText: { color: BrandColors.burgundy, fontSize: 31, lineHeight: 32 },
  backLabel: { color: BrandColors.burgundy, fontSize: 13, fontWeight: '800', marginLeft: 5 },
  hero: { backgroundColor: BrandColors.burgundy, borderRadius: 24, padding: 22, marginBottom: 14 },
  icon: { width: 48, height: 48, borderRadius: 15, backgroundColor: BrandColors.blush, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  iconText: { color: '#FFFFFF', fontSize: 21, fontWeight: '800' },
  title: { color: '#FFFFFF', fontSize: 26, lineHeight: 31, fontWeight: '800' },
  company: { color: '#F3DDE0', fontSize: 14, marginTop: 6 },
  locationPill: { alignSelf: 'flex-start', backgroundColor: '#814552', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, marginTop: 14 },
  locationText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  statsCard: { backgroundColor: BrandColors.surface, borderRadius: 18, borderWidth: 1, borderColor: BrandColors.border, padding: 16, flexDirection: 'row', marginBottom: 24 },
  stat: { flex: 1 },
  divider: { width: 1, backgroundColor: BrandColors.border, marginHorizontal: 14 },
  statLabel: { color: BrandColors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  statValue: { color: BrandColors.burgundy, fontSize: 14, fontWeight: '800', marginTop: 6 },
  sectionTitle: { color: BrandColors.text, fontSize: 17, fontWeight: '800', marginBottom: 9, marginTop: 4 },
  card: { backgroundColor: BrandColors.surface, borderRadius: 18, borderWidth: 1, borderColor: BrandColors.border, padding: 16, marginBottom: 20 },
  description: { color: BrandColors.textSecondary, fontSize: 13, lineHeight: 20 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  skillPill: { backgroundColor: BrandColors.burgundySoft, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginRight: 7, marginBottom: 7 },
  skillText: { color: BrandColors.burgundy, fontSize: 11, fontWeight: '800' },
  required: { color: BrandColors.rose, fontSize: 8, fontWeight: '700', marginTop: 2 },
  companyName: { color: BrandColors.text, fontSize: 15, fontWeight: '800' },
  companyType: { color: BrandColors.rose, fontSize: 11, marginTop: 4, marginBottom: 8 },
  appliedBanner: { backgroundColor: BrandColors.successSoft, borderRadius: 18, padding: 17, marginTop: 4 },
  appliedTitle: { color: '#147957', fontSize: 15, fontWeight: '800' },
  appliedText: { color: '#397D68', fontSize: 12, marginTop: 4 },
  applyPlaceholder: { backgroundColor: BrandColors.blushSoft, borderRadius: 18, padding: 18, marginTop: 4 },
  applyTitle: { color: BrandColors.burgundy, fontSize: 16, fontWeight: '800' },
  applyText: { color: BrandColors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 5 },
  comingSoon: { color: BrandColors.burgundy, fontSize: 11, fontWeight: '800', marginTop: 12 },
  primaryButton: { backgroundColor: BrandColors.burgundy, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 18 },
  primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
