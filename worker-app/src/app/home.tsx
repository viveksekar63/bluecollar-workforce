import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { BrandColors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const verified = normalized === 'VERIFIED' || normalized === 'APPROVED';

  return (
    <View style={[styles.statusBadge, verified ? styles.statusVerified : styles.statusPending]}>
      <View style={[styles.statusDot, verified ? styles.dotVerified : styles.dotPending]} />
      <Text style={[styles.statusText, verified ? styles.statusTextVerified : styles.statusTextPending]}>
        {verified ? 'Verified' : 'Verification pending'}
      </Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, pressed && styles.pressed, !onPress && styles.disabledAction]}
    >
      <View style={styles.quickIcon}>
        <Text style={styles.quickIconText}>{icon}</Text>
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function JobCard({ title, company, location, pay, type }: {
  title: string;
  company: string;
  location: string;
  pay: string;
  type: string;
}) {
  return (
    <Pressable
      onPress={() => router.push('/explore')}
      style={({ pressed }) => [styles.jobCard, pressed && styles.pressed]}
    >
      <View style={styles.jobTopRow}>
        <View style={styles.jobIcon}>
          <Text style={styles.jobIconText}>✦</Text>
        </View>
        <View style={styles.jobTitleBlock}>
          <Text style={styles.jobTitle}>{title}</Text>
          <Text style={styles.jobCompany}>{company}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>

      <View style={styles.jobMetaRow}>
        <Text style={styles.jobMeta}>📍 {location}</Text>
        <Text style={styles.jobMeta}>{type}</Text>
      </View>
      <Text style={styles.jobPay}>{pay}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const worker = useAuthStore((state) => state.worker);
  const clearSession = useAuthStore((state) => state.clearSession);

  const completion = Math.min(worker?.profileCompletion ?? 20, 100);
  const verificationStatus = worker?.verificationStatus ?? 'PENDING';
  const firstName = user?.firstName ?? 'Worker';

  function logout() {
    clearSession();
    router.replace('/login');
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <Pressable style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>♢</Text>
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroEyebrow}>YOUR WORK PROFILE</Text>
          <Text style={styles.heroTitle}>Ready for your next opportunity?</Text>
          <Text style={styles.heroSubtitle}>
            Keep your profile updated so employers can find the right skills and experience.
          </Text>
          <View style={styles.heroBottom}>
            <View style={styles.heroProgressTrack}>
              <View style={[styles.heroProgressFill, { width: `${completion}%` }]} />
            </View>
            <Text style={styles.heroProgressText}>{completion}% complete</Text>
          </View>
          <Pressable
            onPress={() => router.push('/profile')}
            style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}
          >
            <Text style={styles.heroButtonText}>{completion >= 100 ? 'View profile' : 'Complete profile'}</Text>
            <Text style={styles.heroButtonArrow}>→</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your status</Text>
          <StatusBadge status={verificationStatus} />
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusMain}>
            <View style={styles.statusIcon}>
              <Text style={styles.statusIconText}>✓</Text>
            </View>
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>Profile verification</Text>
              <Text style={styles.statusDescription}>
                {verificationStatus.toUpperCase() === 'VERIFIED'
                  ? 'Your profile is verified and ready for employers.'
                  : 'We are reviewing your submitted information and documents.'}
              </Text>
            </View>
          </View>
          <Pressable onPress={() => router.push('/verification')}>
            <Text style={styles.viewLink}>View details →</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.quickGrid}>
          <QuickAction icon="⌕" label="Find jobs" onPress={() => router.push('/explore')} />
          <QuickAction icon="▣" label="My profile" onPress={() => router.push('/profile')} />
          <QuickAction icon="◇" label="Documents" onPress={() => router.push('/documents')} />
          <QuickAction icon="✓" label="Verification" onPress={() => router.push('/verification')} />
        </View>

        <View style={styles.sectionHeaderJobs}>
          <View>
            <Text style={styles.sectionTitle}>Opportunities for you</Text>
            <Text style={styles.sectionSubtitle}>Based on your profession and skills</Text>
          </View>
          <Pressable onPress={() => router.push('/explore')}>
            <Text style={styles.viewAll}>View all</Text>
          </Pressable>
        </View>

        <JobCard
          title="Tea Master"
          company="Nearby employers"
          location="Thanjavur"
          pay="₹18,000 – ₹25,000 / month"
          type="Full time"
        />
        <JobCard
          title="Kitchen / Food Service"
          company="Recommended for you"
          location="Thanjavur"
          pay="₹15,000 – ₹22,000 / month"
          type="Full time"
        />

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Text style={styles.infoIconText}>✦</Text>
          </View>
          <View style={styles.infoCopy}>
            <Text style={styles.infoTitle}>Better profile, better matches</Text>
            <Text style={styles.infoText}>
              Add more skills, experience and preferences to help us show you relevant work.
            </Text>
          </View>
        </View>

        <Pressable onPress={logout} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}>
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  container: {
    padding: 20,
    paddingTop: 58,
    paddingBottom: 42,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: BrandColors.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  greeting: {
    color: BrandColors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  name: {
    color: BrandColors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: BrandColors.surface,
    borderWidth: 1,
    borderColor: BrandColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    color: BrandColors.burgundy,
    fontSize: 25,
    lineHeight: 27,
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: BrandColors.blush,
  },
  hero: {
    overflow: 'hidden',
    backgroundColor: BrandColors.burgundy,
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
  },
  heroGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -55,
    top: -55,
    backgroundColor: BrandColors.blush,
    opacity: 0.28,
  },
  heroEyebrow: {
    color: '#F9DCDC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 9,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    maxWidth: 320,
  },
  heroSubtitle: {
    color: '#F4E3E5',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 350,
  },
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  heroProgressTrack: {
    flex: 1,
    height: 7,
    borderRadius: 8,
    backgroundColor: '#8B5360',
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: 7,
    borderRadius: 8,
    backgroundColor: '#F2B1AC',
  },
  heroProgressText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 10,
  },
  heroButton: {
    marginTop: 18,
    height: 46,
    borderRadius: 13,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtonText: {
    color: BrandColors.burgundy,
    fontSize: 13,
    fontWeight: '800',
  },
  heroButtonArrow: {
    color: BrandColors.burgundy,
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    color: BrandColors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: BrandColors.textSecondary,
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusPending: {
    backgroundColor: BrandColors.blushSoft,
  },
  statusVerified: {
    backgroundColor: BrandColors.successSoft,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  dotPending: {
    backgroundColor: BrandColors.blush,
  },
  dotVerified: {
    backgroundColor: BrandColors.success,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextPending: {
    color: BrandColors.burgundy,
  },
  statusTextVerified: {
    color: '#147957',
  },
  statusCard: {
    backgroundColor: BrandColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BrandColors.border,
    padding: 16,
    marginBottom: 24,
  },
  statusMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: BrandColors.burgundySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconText: {
    color: BrandColors.burgundy,
    fontSize: 18,
    fontWeight: '900',
  },
  statusCopy: {
    flex: 1,
    marginLeft: 12,
  },
  statusTitle: {
    color: BrandColors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusDescription: {
    color: BrandColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  viewLink: {
    color: BrandColors.burgundy,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  quickAction: {
    width: '48.2%',
    backgroundColor: BrandColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BrandColors.border,
    padding: 14,
    marginBottom: 10,
  },
  disabledAction: {
    opacity: 0.65,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: BrandColors.burgundySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  quickIconText: {
    color: BrandColors.burgundy,
    fontSize: 19,
    fontWeight: '800',
  },
  quickLabel: {
    color: BrandColors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHeaderJobs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  viewAll: {
    color: BrandColors.burgundy,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 5,
  },
  jobCard: {
    backgroundColor: BrandColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BrandColors.border,
    padding: 16,
    marginBottom: 10,
  },
  jobTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: BrandColors.blushSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobIconText: {
    color: BrandColors.burgundy,
    fontSize: 19,
    fontWeight: '900',
  },
  jobTitleBlock: {
    flex: 1,
    marginLeft: 12,
  },
  jobTitle: {
    color: BrandColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  jobCompany: {
    color: BrandColors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  chevron: {
    color: BrandColors.muted,
    fontSize: 25,
    marginLeft: 8,
  },
  jobMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  jobMeta: {
    color: BrandColors.textSecondary,
    fontSize: 11,
  },
  jobPay: {
    color: BrandColors.burgundy,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 11,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: BrandColors.burgundySoft,
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconText: {
    color: BrandColors.burgundy,
    fontSize: 17,
    fontWeight: '900',
  },
  infoCopy: {
    flex: 1,
    marginLeft: 11,
  },
  infoTitle: {
    color: BrandColors.burgundy,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  infoText: {
    color: BrandColors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },
  logout: {
    alignItems: 'center',
    padding: 18,
    marginTop: 8,
  },
  logoutText: {
    color: BrandColors.danger,
    fontWeight: '700',
    fontSize: 13,
  },
  pressed: {
    opacity: 0.82,
  },
});
