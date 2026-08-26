import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmployerApplication, getEmployerApplications, shortlistEmployerApplication, rejectEmployerApplication } from '@/api/employer-jobs';
import { BrandColors } from '@/constants/theme';

export default function EmployerApplicationDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [application, setApplication] = useState<EmployerApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const items = await getEmployerApplications();
      setApplication(items.find((item) => item.id === id) ?? null);
    } catch (e: any) { Alert.alert('Unable to load application', e?.response?.data?.message ?? 'Please try again.'); }
    finally { setLoading(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function update(action: 'shortlist' | 'reject') {
    if (!id) return;
    try {
      setBusy(true);
      const result = action === 'shortlist' ? await shortlistEmployerApplication(String(id)) : await rejectEmployerApplication(String(id));
      setApplication((current) => current ? { ...current, status: result.status || (action === 'shortlist' ? 'SHORTLISTED' : 'REJECTED') } : result);
      Alert.alert(action === 'shortlist' ? 'Worker shortlisted' : 'Application rejected');
    } catch (e: any) { Alert.alert('Unable to update', e?.response?.data?.message ?? 'Please try again.'); }
    finally { setBusy(false); }
  }

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={BrandColors.gold} /></View></SafeAreaView>;
  if (!application) return <SafeAreaView style={styles.container}><View style={styles.center}><Text style={styles.title}>Application not found</Text><Pressable onPress={() => router.back()} style={styles.primary}><Text style={styles.primaryText}>Go back</Text></Pressable></View></SafeAreaView>;

  const name = `${application.worker?.user?.firstName ?? 'Worker'} ${application.worker?.user?.lastName ?? ''}`.trim();

  return <SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><View><Text style={styles.eyebrow}>APPLICATION</Text><Text style={styles.title}>{name}</Text><Text style={styles.subtitle}>{application.job?.title || 'Job application'}</Text></View></View>
    <View style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text></View><View style={styles.profileCopy}><Text style={styles.name}>{name}</Text><Text style={styles.profession}>{application.worker?.profession || application.worker?.professionCategory || 'Blue-collar worker'}</Text><Text style={styles.status}>{application.status}</Text></View></View>
    <View style={styles.card}><Text style={styles.sectionTitle}>Worker information</Text><Info label="Experience" value={`${application.worker?.experienceYears ?? 0} years`} /><Info label="Verification" value={application.worker?.verificationStatus || 'PENDING'} /><Info label="Profile completion" value={`${application.worker?.profileCompletion ?? 0}%`} /><Info label="Phone" value={application.worker?.user?.phone || 'Not available'} /></View>
    {application.status !== 'SHORTLISTED' && application.status !== 'REJECTED' && <View style={styles.actions}><Pressable disabled={busy} onPress={() => update('shortlist')} style={styles.primary}><Text style={styles.primaryText}>{busy ? 'Updating...' : 'Shortlist'}</Text></Pressable><Pressable disabled={busy} onPress={() => update('reject')} style={styles.secondary}><Text style={styles.secondaryText}>Reject</Text></Pressable></View>}
  </ScrollView></SafeAreaView>;
}

function Info({ label, value }: { label: string; value: string }) { return <View style={styles.info}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>; }
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background }, content: { padding: 18, paddingBottom: 32 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }, header: { flexDirection: 'row', gap: 10 }, back: { color: BrandColors.gold, fontSize: 36, lineHeight: 32 }, eyebrow: { color: BrandColors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 }, title: { color: BrandColors.text, fontSize: 25, fontWeight: '900' }, subtitle: { color: BrandColors.textSecondary, marginTop: 4 }, profile: { marginTop: 18, flexDirection: 'row', alignItems: 'center' }, avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: BrandColors.goldSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, avatarText: { color: BrandColors.gold, fontSize: 24, fontWeight: '900' }, profileCopy: { flex: 1 }, name: { color: BrandColors.text, fontSize: 17, fontWeight: '900' }, profession: { color: BrandColors.gold, fontWeight: '800', marginTop: 3 }, status: { color: BrandColors.textSecondary, fontSize: 11, marginTop: 3 }, card: { marginTop: 18, backgroundColor: BrandColors.slateSoft, borderColor: BrandColors.slateBorder, borderWidth: 1, borderRadius: 18, padding: 16 }, sectionTitle: { color: BrandColors.text, fontSize: 16, fontWeight: '900', marginBottom: 8 }, info: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BrandColors.slateBorder }, label: { color: BrandColors.textSecondary, fontSize: 12 }, value: { color: BrandColors.text, fontSize: 12, fontWeight: '800', maxWidth: '55%', textAlign: 'right' }, actions: { marginTop: 18, gap: 10 }, primary: { height: 52, borderRadius: 14, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: BrandColors.slate, fontWeight: '900' }, secondary: { height: 52, borderRadius: 14, borderWidth: 1, borderColor: '#8d4545', alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: '#ffb3b3', fontWeight: '900' },
});
