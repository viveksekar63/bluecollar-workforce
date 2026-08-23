import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { BrandColors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const worker = useAuthStore((state) => state.worker);
  const clearSession = useAuthStore((state) => state.clearSession);

  function logout() {
    clearSession();
    router.replace('/login');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>WORKER HOME</Text>
      <Text style={styles.title}>Hello, {user?.firstName ?? 'Worker'} 👋</Text>
      <Text style={styles.subtitle}>Your worker account is ready. Complete the remaining onboarding steps to start receiving opportunities.</Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Profile completion</Text>
          <View style={styles.statusPill}><Text style={styles.statusText}>{worker?.verificationStatus ?? 'PENDING'}</Text></View>
        </View>
        <Text style={styles.percent}>{worker?.profileCompletion ?? 20}%</Text>
        <View style={styles.track}><View style={[styles.fill, { width: `${Math.min(worker?.profileCompletion ?? 20, 100)}%` }]} /></View>
        <Text style={styles.muted}>Keep completing your profile to improve job matching.</Text>
        <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={() => router.push('/profile')}><Text style={styles.buttonText}>Complete profile</Text></Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your next steps</Text>
        <Text style={styles.item}>✓ Basic profile</Text>
        <Text style={styles.item}>• Address & emergency contact</Text>
        <Text style={styles.item}>• Skills & languages</Text>
        <Text style={styles.item}>• Work & profession</Text>
        <Text style={styles.item}>• Documents & verification</Text>
      </View>

      <Pressable onPress={logout} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}><Text style={styles.logoutText}>Sign out</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background, padding: 24, paddingTop: 64 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 2, color: BrandColors.rose, marginBottom: 12 },
  title: { fontSize: 32, fontWeight: '800', color: BrandColors.text, marginBottom: 10 },
  subtitle: { fontSize: 15, lineHeight: 22, color: BrandColors.textSecondary, marginBottom: 24 },
  card: { backgroundColor: BrandColors.surface, borderRadius: 16, borderWidth: 1, borderColor: BrandColors.border, padding: 20, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: BrandColors.text },
  statusPill: { backgroundColor: BrandColors.blushSoft, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { color: BrandColors.burgundy, fontSize: 11, fontWeight: '800' },
  percent: { fontSize: 30, fontWeight: '800', color: BrandColors.burgundy, marginBottom: 8 },
  track: { height: 8, borderRadius: 8, backgroundColor: '#EEE5E7', overflow: 'hidden', marginBottom: 10 },
  fill: { height: 8, borderRadius: 8, backgroundColor: BrandColors.burgundy },
  muted: { color: BrandColors.textSecondary, marginBottom: 16, lineHeight: 20 },
  item: { color: BrandColors.textSecondary, lineHeight: 30 },
  button: { height: 48, borderRadius: 12, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '800' },
  logout: { alignItems: 'center', padding: 16 },
  logoutText: { color: BrandColors.danger, fontWeight: '700' },
  pressed: { opacity: 0.85 },
});
