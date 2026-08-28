import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getManpowerWorker, unlockManpowerWorkerContact } from '@/api/employer-manpower';
import { BrandColors } from '@/constants/theme';

export default function EmployerWorkerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setWorker(await getManpowerWorker(String(id)));
    } catch {
      Alert.alert('Unable to load worker', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const unlockContact = async () => {
    try {
      setUnlocking(true);
      const result = await unlockManpowerWorkerContact(String(id));
      if (!result?.success) {
        Alert.alert('Contact access', result?.message || 'Unable to unlock contact details.');
        return;
      }
      setWorker((current: any) => ({
        ...current,
        user: { ...(current?.user ?? {}), ...(result.contact ?? {}) },
      }));
      Alert.alert(
        result.alreadyUnlocked ? 'Contact already unlocked' : 'Contact unlocked',
        result.alreadyUnlocked
          ? 'You already have access to this worker contact.'
          : `1 credit used. Remaining credits: ${result.balance}`,
      );
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Unable to unlock contact details.';
      if (String(message).toLowerCase().includes('insufficient credits')) {
        Alert.alert('Not enough credits', 'Please purchase credits to view this worker contact.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Credits', onPress: () => router.push('/employer-credits') },
        ]);
      } else {
        Alert.alert('Contact access', message);
      }
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color={BrandColors.indigo} /></View>
      </SafeAreaView>
    );
  }

  if (!worker) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Worker not found</Text>
          <Pressable style={styles.emptyButton} onPress={() => router.back()}>
            <Text style={styles.emptyButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const user = worker.user ?? {};
  const name = `${user.firstName ?? 'Worker'} ${user.lastName ?? ''}`.trim();
  const phone = user.phone;
  const email = user.email;
  const contactUnlocked = Boolean(phone || email);
  const verified = ['VERIFIED', 'COMPLETED', 'APPROVED'].includes(
    String(worker.verificationStatus ?? '').toUpperCase(),
  );
  const location = [worker.addresses?.[0]?.city, worker.addresses?.[0]?.state]
    .filter(Boolean)
    .join(', ') || 'Location not specified';
  const skills = (worker.skills ?? [])
    .map((item: any) => item?.skill?.name)
    .filter(Boolean);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <View style={styles.topTitleWrap}>
            <Text style={styles.eyebrow}>WORKER PROFILE</Text>
            <Text style={styles.topSubtitle}>Verified manpower</Text>
          </View>
          <View style={styles.trustMini}>
            <Text style={styles.trustMiniIcon}>✓</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
            </View>
            {verified && <View style={styles.verifiedDot}><Text style={styles.verifiedDotText}>✓</Text></View>}
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.profession}>{worker.profession || 'Worker'}</Text>
          <Text style={styles.code}>{worker.workerCode || 'WorkTrust profile'}</Text>
          <View style={styles.statusRow}>
            <View style={styles.verifiedPill}>
              <Text style={styles.verifiedPillText}>{verified ? '✓ VERIFIED' : 'VERIFICATION PENDING'}</Text>
            </View>
            <View style={styles.availablePill}>
              <View style={styles.availableDot} />
              <Text style={styles.availableText}>
                {worker.availabilityStatus === 'AVAILABLE' ? 'Available now' : 'Availability not confirmed'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Professional overview</Text>
          <Text style={styles.sectionHint}>Quick facts about this worker</Text>
        </View>

        <View style={styles.statsGrid}>
          <Info icon="◷" label="Experience" value={`${Number(worker.experienceYears ?? 0)} years`} />
          <Info icon="⌖" label="Location" value={location} />
          <Info icon="★" label="Category" value={worker.professionCategory || 'Not specified'} />
          <Info icon="✓" label="Trust score" value={`${worker.verificationScore ?? 0}%`} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Skills & expertise</Text>
              <Text style={styles.cardSubtitle}>What this worker can do</Text>
            </View>
            <View style={styles.cardIcon}><Text style={styles.cardIconText}>✦</Text></View>
          </View>
          {skills.length > 0 ? (
            <View style={styles.chips}>
              {skills.map((skill: string) => (
                <View key={skill} style={styles.chip}>
                  <Text style={styles.chipText}>{skill}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>No skills listed.</Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>About this worker</Text>
              <Text style={styles.cardSubtitle}>Profile information</Text>
            </View>
            <View style={styles.cardIcon}><Text style={styles.cardIconText}>i</Text></View>
          </View>
          <Text style={styles.body}>{worker.bio || 'No additional profile information available.'}</Text>
        </View>

        <View style={styles.trustCard}>
          <View style={styles.trustIcon}>
            <Text style={styles.trustIconText}>✓</Text>
          </View>
          <View style={styles.trustCopy}>
            <Text style={styles.trustTitle}>WorkTrust verified profile</Text>
            <Text style={styles.trustText}>
              Verification checks are performed separately and profile details are supplied through the admin verification pipeline.
            </Text>
          </View>
        </View>

        {contactUnlocked ? (
          <View style={styles.unlockedCard}>
            <View style={styles.unlockedIcon}><Text style={styles.unlockedIconText}>✓</Text></View>
            <View style={styles.contactCopy}>
              <Text style={styles.contactTitle}>Contact details unlocked</Text>
              {phone && <Text style={styles.contactValue}>Phone: {phone}</Text>}
              {email && <Text style={styles.contactValue}>Email: {email}</Text>}
            </View>
          </View>
        ) : (
          <View style={styles.contactCard}>
            <View style={styles.lockIcon}><Text style={styles.lockIconText}>🔒</Text></View>
            <View style={styles.contactCopy}>
              <Text style={styles.contactTitle}>Ready to connect?</Text>
              <Text style={styles.contactText}>Use 1 credit to reveal this worker's phone and email.</Text>
            </View>
            <Pressable
              disabled={unlocking}
              style={[styles.contactButton, unlocking && styles.disabled]}
              onPress={unlockContact}
            >
              <Text style={styles.contactButtonText}>{unlocking ? '...' : 'View Contact'}</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.footerNote}>WorkTrust • Verified people. Trusted work.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Info({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.info}>
      <View style={styles.infoIcon}><Text style={styles.infoIconText}>{icon}</Text></View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.surfaceLight },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 42 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { color: BrandColors.text, fontSize: 20, fontWeight: '900' },
  emptyButton: { marginTop: 16, backgroundColor: BrandColors.indigo, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 11 },
  emptyButtonText: { color: BrandColors.white, fontWeight: '800' },

  topBar: { flexDirection: 'row', alignItems: 'center', minHeight: 58, marginBottom: 10 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: BrandColors.white, borderWidth: 1, borderColor: BrandColors.border, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: BrandColors.indigo, fontSize: 34, lineHeight: 34, marginTop: -2 },
  topTitleWrap: { flex: 1, marginLeft: 12 },
  eyebrow: { color: BrandColors.indigo, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  topSubtitle: { color: BrandColors.muted, fontSize: 10, marginTop: 2 },
  trustMini: { width: 40, height: 40, borderRadius: 20, backgroundColor: BrandColors.skySoft, borderWidth: 1, borderColor: BrandColors.border, alignItems: 'center', justifyContent: 'center' },
  trustMiniIcon: { color: BrandColors.indigo, fontSize: 18, fontWeight: '900' },

  hero: { overflow: 'hidden', position: 'relative', alignItems: 'center', backgroundColor: BrandColors.navy, borderRadius: 24, paddingHorizontal: 18, paddingTop: 24, paddingBottom: 22 },
  heroGlow: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: '#173D78', top: -95, right: -35 },
  avatarRing: { width: 92, height: 92, borderRadius: 46, backgroundColor: BrandColors.skySoft, borderWidth: 3, borderColor: BrandColors.sky, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: BrandColors.indigo, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: BrandColors.white, fontSize: 32, fontWeight: '900' },
  verifiedDot: { position: 'absolute', right: -1, bottom: 0, width: 25, height: 25, borderRadius: 13, backgroundColor: BrandColors.success, borderWidth: 3, borderColor: BrandColors.navy, alignItems: 'center', justifyContent: 'center' },
  verifiedDotText: { color: BrandColors.white, fontSize: 11, fontWeight: '900' },
  name: { color: BrandColors.white, fontSize: 25, fontWeight: '900', marginTop: 12, textAlign: 'center' },
  profession: { color: BrandColors.sky, fontSize: 14, fontWeight: '800', marginTop: 3 },
  code: { color: '#C7E9FF', fontSize: 10, marginTop: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  verifiedPill: { backgroundColor: BrandColors.white, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  verifiedPillText: { color: BrandColors.indigo, fontSize: 9, fontWeight: '900' },
  availablePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#102B56', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  availableDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80', marginRight: 6 },
  availableText: { color: '#D1FAE5', fontSize: 9, fontWeight: '800' },

  sectionHeading: { marginTop: 20, marginBottom: 10 },
  sectionTitle: { color: BrandColors.text, fontSize: 17, fontWeight: '900' },
  sectionHint: { color: BrandColors.muted, fontSize: 10, marginTop: 3 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  info: { width: '48.5%', minHeight: 82, backgroundColor: BrandColors.white, borderRadius: 16, borderWidth: 1, borderColor: BrandColors.border, padding: 11, flexDirection: 'row', alignItems: 'center' },
  infoIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: BrandColors.skySoft, alignItems: 'center', justifyContent: 'center' },
  infoIconText: { color: BrandColors.indigo, fontSize: 16, fontWeight: '900' },
  infoCopy: { flex: 1, marginLeft: 9 },
  infoLabel: { color: BrandColors.muted, fontSize: 9, fontWeight: '700' },
  infoValue: { color: BrandColors.text, fontSize: 11, fontWeight: '900', marginTop: 3 },

  card: { marginTop: 12, backgroundColor: BrandColors.white, borderRadius: 18, borderWidth: 1, borderColor: BrandColors.border, padding: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: BrandColors.text, fontSize: 15, fontWeight: '900' },
  cardSubtitle: { color: BrandColors.muted, fontSize: 9, marginTop: 3 },
  cardIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: BrandColors.skySoft, alignItems: 'center', justifyContent: 'center' },
  cardIconText: { color: BrandColors.indigo, fontSize: 15, fontWeight: '900' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  chip: { borderRadius: 999, backgroundColor: BrandColors.skySoft, borderWidth: 1, borderColor: '#BAE6FD', paddingHorizontal: 11, paddingVertical: 7 },
  chipText: { color: BrandColors.indigo, fontSize: 10, fontWeight: '800' },
  muted: { color: BrandColors.muted, fontSize: 11, marginTop: 10 },
  body: { color: BrandColors.textSecondary, fontSize: 12, lineHeight: 19, marginTop: 11 },

  trustCard: { marginTop: 14, borderRadius: 18, backgroundColor: BrandColors.navy, padding: 15, flexDirection: 'row', alignItems: 'center' },
  trustIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: BrandColors.indigo, alignItems: 'center', justifyContent: 'center' },
  trustIconText: { color: BrandColors.white, fontSize: 20, fontWeight: '900' },
  trustCopy: { flex: 1, marginLeft: 11 },
  trustTitle: { color: BrandColors.white, fontSize: 13, fontWeight: '900' },
  trustText: { color: '#C7E9FF', fontSize: 9, lineHeight: 14, marginTop: 4 },

  contactCard: { marginTop: 14, borderRadius: 18, backgroundColor: BrandColors.white, borderWidth: 1, borderColor: BrandColors.borderStrong, padding: 13, flexDirection: 'row', alignItems: 'center' },
  unlockedCard: { marginTop: 14, borderRadius: 18, backgroundColor: BrandColors.successSoft, borderWidth: 1, borderColor: '#86EFAC', padding: 13, flexDirection: 'row', alignItems: 'center' },
  lockIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: BrandColors.skySoft, alignItems: 'center', justifyContent: 'center' },
  lockIconText: { fontSize: 20 },
  unlockedIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: BrandColors.success, alignItems: 'center', justifyContent: 'center' },
  unlockedIconText: { color: BrandColors.white, fontSize: 18, fontWeight: '900' },
  contactCopy: { flex: 1, marginLeft: 10 },
  contactTitle: { color: BrandColors.text, fontSize: 13, fontWeight: '900' },
  contactText: { color: BrandColors.textSecondary, fontSize: 9, lineHeight: 14, marginTop: 3 },
  contactValue: { color: BrandColors.textSecondary, fontSize: 10, lineHeight: 16, marginTop: 2 },
  contactButton: { backgroundColor: BrandColors.indigo, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 },
  contactButtonText: { color: BrandColors.white, fontSize: 10, fontWeight: '900' },
  disabled: { opacity: 0.6 },
  footerNote: { textAlign: 'center', color: BrandColors.muted, fontSize: 9, marginTop: 20 },
});
