import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmployerApplication, EmployerJob, getEmployerJobs, getEmployerJobApplications, publishEmployerJob, updateEmployerJob } from '@/api/employer-jobs';
import { getCurrentSubscription } from '@/api/subscriptions';
import { BrandColors } from '@/constants/theme';
import { addSkillToCsv, getSmartSkillSuggestions, PREDEFINED_SKILLS } from '@/lib/skill-suggestions';

export default function EmployerJobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<EmployerJob | null>(null);
  const [applications, setApplications] = useState<EmployerApplication[]>([]);
  const [skillNames, setSkillNames] = useState('');
  const [savingSkills, setSavingSkills] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [skillFocused, setSkillFocused] = useState(false);
  const smartSuggestions = useMemo(() => getSmartSkillSuggestions(job?.title ?? '', job?.description ?? '', skillNames), [job?.title, job?.description, skillNames]);

  const load = useCallback(async () => {
    try {
      const [jobs, apps] = await Promise.all([getEmployerJobs(), getEmployerJobApplications(String(id))]);
      const found = jobs.find((item) => item.id === id) ?? null;
      setJob(found); setApplications(Array.isArray(apps) ? apps : []);
      setSkillNames(found?.skills?.filter((item) => item.required).map((item) => item.skill.name).join(', ') ?? '');
    } catch (e: any) { Alert.alert('Unable to load job', e?.response?.data?.message ?? 'Please try again.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  function selectSkill(skill: string) { setSkillNames((current) => addSkillToCsv(current, skill)); setSkillFocused(true); }

  async function saveSkills() {
    const names = skillNames.split(',').map((skill) => skill.trim()).filter(Boolean);
    if (!id || names.length === 0) { Alert.alert('Add required skills', 'Please add at least one skill.'); return; }
    try {
      setSavingSkills(true);
      const updated = await updateEmployerJob(String(id), { skillNames: names });
      const localSkills = names.map((name) => ({ required: true, skill: { id: `local-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, name } }));
      setJob({ ...updated, skills: updated.skills?.length ? updated.skills : localSkills }); setSkillNames(names.join(', '));
      Alert.alert('Skills saved', 'Required skills have been updated. You can publish the job now.');
    } catch (e: any) { Alert.alert('Unable to save skills', e?.response?.data?.message ?? 'Please try again.'); }
    finally { setSavingSkills(false); }
  }

  async function publish() {
    if (!id || publishing) return;
    const names = skillNames.split(',').map((skill) => skill.trim()).filter(Boolean);
    const hasSkills = names.length > 0 || Boolean(job?.skills?.some((skill) => skill.required));
    if (!hasSkills) { Alert.alert('Add required skills', 'Add at least one required skill before publishing.'); return; }
    try {
      setPublishing(true);
      const current = await getCurrentSubscription();
      if (!current.active) { router.push({ pathname: '/employer-subscription', params: { jobId: String(id) } }); return; }
      await publishEmployerJob(String(id));
      router.replace({ pathname: '/employer-job-details', params: { id: String(id), published: '1' } });
    } catch (e: any) {
      const message = e?.response?.data?.message ?? 'Unable to publish this job.';
      if (String(message).includes('SUBSCRIPTION_REQUIRED') || String(message).includes('SUBSCRIPTION_INACTIVE')) router.push({ pathname: '/employer-subscription', params: { jobId: String(id) } });
      else Alert.alert('Publish failed', message);
    } finally { setPublishing(false); }
  }

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={BrandColors.gold} /></View></SafeAreaView>;
  if (!job) return <SafeAreaView style={styles.container}><View style={styles.center}><Text style={styles.emptyTitle}>Job not found</Text><Pressable onPress={() => router.back()} style={styles.primary}><Text style={styles.primaryText}>Go back</Text></Pressable></View></SafeAreaView>;
  const canPublish = job.status === 'DRAFT' && (skillNames.split(',').some((item) => item.trim()) || Boolean(job.skills?.some((skill) => skill.required)));

  return <SafeAreaView style={styles.container}><ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={BrandColors.gold} />} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><View style={styles.headerCopy}><Text style={styles.eyebrow}>JOB DETAILS</Text><Text style={styles.title}>{job.title}</Text><Text style={styles.subtitle}>Manage your opening and applicants.</Text></View></View>
    <View style={styles.statusRow}><View style={styles.badge}><Text style={styles.badgeText}>{job.status}</Text></View><Text style={styles.location}>📍 {job.city}, {job.state}</Text></View>
    <View style={styles.card}><Text style={styles.sectionTitle}>Job information</Text><Text style={styles.description}>{job.description}</Text><Text style={styles.meta}>₹{job.salaryMin ?? 0}{job.salaryMax ? ` - ₹${job.salaryMax}` : ''} / {job.salaryType}</Text><Text style={styles.meta}>{job.openings} opening{job.openings === 1 ? '' : 's'}</Text></View>
    {job.status === 'DRAFT' && <View style={styles.card}><Text style={styles.sectionTitle}>Required skills</Text><Text style={styles.skillHint}>Select suggested skills or search/add your own.</Text><TextInput value={skillNames} onChangeText={setSkillNames} onFocus={() => setSkillFocused(true)} placeholder="Cooking, Parotta, Kitchen work" placeholderTextColor={BrandColors.muted} style={styles.skillInput} />
      {skillFocused && smartSuggestions.length > 0 && <View style={styles.suggestionPanel}><Text style={styles.suggestionTitle}>Suggested for this job</Text><View style={styles.chips}>{smartSuggestions.map((skill) => <Pressable key={`suggested-${skill}`} onPress={() => selectSkill(skill)} style={styles.suggestionChip}><Text style={styles.suggestionChipText}>+ {skill}</Text></Pressable>)}</View></View>}
      <Text style={styles.predefinedTitle}>Popular predefined skills</Text><View style={styles.chips}>{PREDEFINED_SKILLS.slice(0, 10).map((skill) => <Pressable key={skill} onPress={() => selectSkill(skill)} style={styles.predefinedChip}><Text style={styles.predefinedChipText}>{skill}</Text></Pressable>)}</View>
      <Pressable disabled={savingSkills} onPress={saveSkills} style={styles.secondary}><Text style={styles.secondaryText}>{savingSkills ? 'Saving...' : 'Save skills'}</Text></Pressable>
    </View>}
    {job.status === 'DRAFT' && !canPublish && <View style={styles.warning}><Text style={styles.warningText}>Add at least one required skill to enable publishing.</Text></View>}
    {job.status === 'DRAFT' && <Pressable disabled={publishing || !canPublish} onPress={publish} style={[styles.primary, !canPublish && styles.disabled]}><Text style={styles.primaryText}>{publishing ? 'Checking subscription...' : 'Publish Job'}</Text></Pressable>}
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Applicants ({applications.length})</Text><Pressable onPress={() => router.push({ pathname: '/employer-applications', params: { jobId: job.id } })}><Text style={styles.link}>View all</Text></Pressable></View>
    {applications.slice(0, 5).map((item) => <Pressable key={item.id} style={styles.application} onPress={() => router.push({ pathname: '/employer-application-details', params: { id: item.id } })}><Text style={styles.name}>{`${item.worker?.user?.firstName ?? 'Worker'} ${item.worker?.user?.lastName ?? ''}`.trim()}</Text><Text style={styles.appMeta}>{item.worker?.profession || 'Blue-collar worker'} • {item.status}</Text><Text style={styles.link}>Review ›</Text></Pressable>)}
    {applications.length === 0 && <Text style={styles.emptyText}>No applications yet.</Text>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background }, content: { padding: 18, paddingBottom: 30 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, header: { flexDirection: 'row', gap: 10 }, back: { color: BrandColors.gold, fontSize: 36, lineHeight: 32 }, headerCopy: { flex: 1 }, eyebrow: { color: BrandColors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 }, title: { color: BrandColors.text, fontSize: 26, fontWeight: '900' }, subtitle: { color: BrandColors.textSecondary, marginTop: 4, fontSize: 13 }, statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 15 }, badge: { borderWidth: 1, borderColor: BrandColors.gold, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }, badgeText: { color: BrandColors.gold, fontSize: 10, fontWeight: '900' }, location: { color: BrandColors.textSecondary, fontSize: 12 }, card: { marginTop: 16, backgroundColor: BrandColors.slateSoft, borderColor: BrandColors.slateBorder, borderWidth: 1, borderRadius: 18, padding: 16 }, sectionTitle: { color: BrandColors.text, fontSize: 16, fontWeight: '900' }, description: { color: BrandColors.textSecondary, lineHeight: 21, marginTop: 8 }, meta: { color: BrandColors.textSecondary, fontSize: 12, marginTop: 8 }, skillHint: { color: BrandColors.textSecondary, fontSize: 11, lineHeight: 17, marginTop: 6 }, skillInput: { marginTop: 12, minHeight: 50, borderRadius: 13, borderWidth: 1, borderColor: BrandColors.slateBorder, backgroundColor: BrandColors.slate, paddingHorizontal: 12, color: BrandColors.text, fontSize: 14 }, suggestionPanel: { marginTop: 9, padding: 10, borderRadius: 13, backgroundColor: BrandColors.slate, borderWidth: 1, borderColor: BrandColors.slateBorder }, suggestionTitle: { color: BrandColors.gold, fontSize: 10, fontWeight: '900', marginBottom: 8 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, suggestionChip: { borderRadius: 999, borderWidth: 1, borderColor: BrandColors.gold, backgroundColor: '#2A2416', paddingHorizontal: 10, paddingVertical: 7 }, suggestionChipText: { color: BrandColors.gold, fontSize: 10, fontWeight: '800' }, predefinedTitle: { color: BrandColors.textSecondary, fontSize: 10, fontWeight: '800', marginTop: 12, marginBottom: 7 }, predefinedChip: { borderRadius: 999, borderWidth: 1, borderColor: BrandColors.slateBorder, backgroundColor: BrandColors.slate, paddingHorizontal: 10, paddingVertical: 7 }, predefinedChipText: { color: BrandColors.textSecondary, fontSize: 10, fontWeight: '700' }, secondary: { marginTop: 12, height: 44, borderRadius: 12, borderWidth: 1, borderColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: BrandColors.gold, fontWeight: '900' }, warning: { marginTop: 12, padding: 12, borderRadius: 13, backgroundColor: '#2A2416', borderWidth: 1, borderColor: '#5C4A20' }, warningText: { color: '#F8D77A', fontSize: 11, fontWeight: '700' }, primary: { marginTop: 14, height: 52, borderRadius: 14, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.45 }, primaryText: { color: BrandColors.slate, fontWeight: '900' }, sectionHeader: { marginTop: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, link: { color: BrandColors.gold, fontWeight: '900', fontSize: 12 }, application: { marginTop: 10, backgroundColor: BrandColors.slate, borderWidth: 1, borderColor: BrandColors.slateBorder, borderRadius: 14, padding: 14 }, name: { color: BrandColors.text, fontWeight: '900', fontSize: 14 }, appMeta: { color: BrandColors.textSecondary, fontSize: 11, marginTop: 4 }, emptyText: { color: BrandColors.textSecondary, marginTop: 10 }, emptyTitle: { color: BrandColors.text, fontSize: 18, fontWeight: '900' },
});
