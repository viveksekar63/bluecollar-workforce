import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { BrandColors } from '@/constants/theme';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>W</Text></View>
        <Text style={styles.eyebrow}>WORKTRUST</Text>
        <Text style={styles.title}>Build your work profile. Find better opportunities.</Text>
        <Text style={styles.subtitle}>Create your worker account, complete your profile and move through verification from one place.</Text>
      </View>

      <View style={styles.trustCard}>
        <Text style={styles.trustTitle}>A profile built around your work</Text>
        <Text style={styles.trustText}>From skilled professionals to everyday labour, your experience and abilities come first.</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={({ pressed }) => [styles.primary, pressed && styles.pressed]} onPress={() => router.push('/login')}><Text style={styles.primaryText}>Sign in</Text></Pressable>
        <Pressable style={({ pressed }) => [styles.secondary, pressed && styles.pressed]} onPress={() => router.push('/register')}><Text style={styles.secondaryText}>Create worker account</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background, padding: 24, paddingTop: 56, justifyContent: 'space-between' },
  hero: { paddingTop: 24 },
  brandMark: { width: 58, height: 58, borderRadius: 18, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  brandMarkText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  eyebrow: { fontSize: 13, fontWeight: '800', letterSpacing: 2.5, color: BrandColors.rose, marginBottom: 16 },
  title: { fontSize: 38, lineHeight: 45, fontWeight: '800', color: BrandColors.text, marginBottom: 16 },
  subtitle: { fontSize: 17, lineHeight: 26, color: BrandColors.textSecondary },
  trustCard: { backgroundColor: BrandColors.blushSoft, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 18, padding: 18, marginTop: 28 },
  trustTitle: { fontSize: 16, fontWeight: '800', color: BrandColors.burgundy, marginBottom: 6 },
  trustText: { fontSize: 14, lineHeight: 21, color: BrandColors.textSecondary },
  actions: { gap: 12, paddingBottom: 20 },
  primary: { height: 56, borderRadius: 14, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center', shadowColor: BrandColors.burgundy, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondary: { height: 56, borderRadius: 14, borderWidth: 1, borderColor: BrandColors.borderStrong, backgroundColor: BrandColors.surface, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: BrandColors.burgundy, fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.85 },
});
