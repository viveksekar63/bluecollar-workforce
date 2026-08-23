import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

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
        <Text style={styles.cardTitle}>Profile completion</Text>
        <Text style={styles.percent}>{worker?.profileCompletion ?? 20}%</Text>
        <Text style={styles.muted}>Verification status: {worker?.verificationStatus ?? 'PENDING'}</Text>
        <Pressable style={styles.button} onPress={() => router.push('/profile')}><Text style={styles.buttonText}>Complete profile</Text></Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Coming next</Text>
        <Text style={styles.item}>• Address & emergency contact</Text>
        <Text style={styles.item}>• Skills & languages</Text>
        <Text style={styles.item}>• Documents</Text>
        <Text style={styles.item}>• Background verification</Text>
      </View>

      <Pressable onPress={logout} style={styles.logout}><Text style={styles.logoutText}>Sign out</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA', padding: 24, paddingTop: 64 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 2, color: '#2563EB', marginBottom: 12 },
  title: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 10 },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#6B7280', marginBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 8 },
  percent: { fontSize: 30, fontWeight: '800', color: '#2563EB', marginBottom: 4 },
  muted: { color: '#6B7280', marginBottom: 16 },
  item: { color: '#4B5563', lineHeight: 28 },
  button: { height: 48, borderRadius: 10, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '800' },
  logout: { alignItems: 'center', padding: 16 },
  logoutText: { color: '#DC2626', fontWeight: '700' },
});
