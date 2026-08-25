import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { BrandColors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

export default function RoleSelectScreen() {
  const user = useAuthStore((state) => state.user);
  const setActiveRole = useAuthStore((state) => state.setActiveRole);
  const roles = user?.roles ?? [];

  function select(role: 'WORKER' | 'EMPLOYER') {
    setActiveRole(role);
    router.replace(role === 'EMPLOYER' ? '/employer-home' : '/home');
  }

  return <View style={styles.container}>
    <Text style={styles.eyebrow}>WORKTRUST</Text>
    <Text style={styles.title}>How do you want to use WorkTrust?</Text>
    <Text style={styles.subtitle}>You can switch between Worker and Employer later.</Text>
    {roles.includes('WORKER') && <Pressable style={styles.card} onPress={() => select('WORKER')}><Text style={styles.icon}>👷</Text><View><Text style={styles.cardTitle}>Worker</Text><Text style={styles.cardText}>Find jobs, apply and manage your work.</Text></View></Pressable>}
    {roles.includes('EMPLOYER') && <Pressable style={styles.card} onPress={() => select('EMPLOYER')}><Text style={styles.icon}>💼</Text><View><Text style={styles.cardTitle}>Employer</Text><Text style={styles.cardText}>Post jobs and manage applicants.</Text></View></Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background, padding: 24, paddingTop: 70 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 2, color: BrandColors.rose, marginBottom: 12 },
  title: { fontSize: 30, fontWeight: '800', color: BrandColors.text, lineHeight: 38 },
  subtitle: { marginTop: 10, fontSize: 15, lineHeight: 22, color: BrandColors.textSecondary, marginBottom: 28 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 16, padding: 18, marginBottom: 14 },
  icon: { fontSize: 28 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: BrandColors.text },
  cardText: { marginTop: 4, fontSize: 13, color: BrandColors.textSecondary },
});
