import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>W</Text>
        </View>
        <View>
          <Text style={styles.brandName}>WorkTrust</Text>
          <Text style={styles.brandTagline}>Verified people. Trusted work.</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.illustration}>
          <View style={styles.glowOne} />
          <View style={styles.glowTwo} />
          <View style={styles.personHead} />
          <View style={styles.personBody} />
          <View style={styles.personArm} />
          <View style={styles.workCard}>
            <View style={styles.cardIcon}><Text style={styles.cardIconText}>✓</Text></View>
            <View>
              <Text style={styles.cardLabel}>VERIFIED WORK</Text>
              <Text style={styles.cardValue}>Skills & experience</Text>
            </View>
          </View>
          <View style={styles.jobCard}>
            <View style={styles.jobDot} />
            <View>
              <Text style={styles.jobLabel}>NEW OPPORTUNITY</Text>
              <Text style={styles.jobValue}>A job that fits you</Text>
            </View>
          </View>
          <View style={styles.briefcase}><Text style={styles.briefcaseText}>▣</Text></View>
        </View>

        <Text style={styles.eyebrow}>ONE APP. TWO WAYS TO WORK.</Text>
        <Text style={styles.title}>Find work. Hire people. Build trust.</Text>
        <Text style={styles.subtitle}>
          WorkTrust brings workers and employers together in one simple, verified platform.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={({ pressed }) => [styles.primary, pressed && styles.pressed]} onPress={() => router.push('/login')}>
          <Text style={styles.primaryText}>Sign in</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.secondary, pressed && styles.pressed]} onPress={() => router.push('/register')}>
          <Text style={styles.secondaryText}>Create an account</Text>
        </Pressable>
        <Text style={styles.footer}>Worker and Employer access in one app</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background, paddingHorizontal: 22 },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 10 },
  brandMark: { width: 46, height: 46, borderRadius: 15, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  brandMarkText: { color: '#fff', fontSize: 23, fontWeight: '900' },
  brandName: { fontSize: 18, fontWeight: '900', color: BrandColors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  brandTagline: { marginTop: 2, fontSize: 11, color: BrandColors.textSecondary },
  hero: { flex: 1, justifyContent: 'center', paddingVertical: 18 },
  illustration: { height: 260, borderRadius: 32, backgroundColor: BrandColors.burgundySoft, borderWidth: 1, borderColor: BrandColors.border, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  glowOne: { position: 'absolute', width: 210, height: 210, borderRadius: 105, backgroundColor: '#fff', opacity: 0.72, top: 24, left: 48 },
  glowTwo: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: BrandColors.blushSoft, right: -20, bottom: -20 },
  personHead: { width: 58, height: 58, borderRadius: 29, backgroundColor: BrandColors.burgundy, position: 'absolute', top: 52, left: 143 },
  personBody: { width: 104, height: 112, borderRadius: 48, backgroundColor: BrandColors.rose, position: 'absolute', top: 105, left: 120 },
  personArm: { width: 30, height: 78, borderRadius: 15, backgroundColor: BrandColors.burgundyDark, position: 'absolute', top: 125, left: 91, transform: [{ rotate: '26deg' }] },
  workCard: { position: 'absolute', left: 14, top: 34, flexDirection: 'row', alignItems: 'center', backgroundColor: BrandColors.surface, borderRadius: 14, padding: 10, paddingRight: 14, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  cardIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: BrandColors.successSoft, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  cardIconText: { color: BrandColors.success, fontSize: 16, fontWeight: '900' },
  cardLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1, color: BrandColors.rose },
  cardValue: { marginTop: 2, fontSize: 11, fontWeight: '800', color: BrandColors.text },
  jobCard: { position: 'absolute', right: 12, bottom: 35, flexDirection: 'row', alignItems: 'center', backgroundColor: BrandColors.surface, borderRadius: 14, padding: 10, paddingRight: 14, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  jobDot: { width: 30, height: 30, borderRadius: 10, backgroundColor: BrandColors.burgundySoft, marginRight: 8 },
  jobLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1, color: BrandColors.rose },
  jobValue: { marginTop: 2, fontSize: 11, fontWeight: '800', color: BrandColors.text },
  briefcase: { position: 'absolute', right: 46, top: 32, width: 42, height: 42, borderRadius: 14, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '8deg' }] },
  briefcaseText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.8, color: BrandColors.rose, marginBottom: 10 },
  title: { fontSize: 34, lineHeight: 40, fontWeight: '900', color: BrandColors.text, marginBottom: 12 },
  subtitle: { fontSize: 15, lineHeight: 23, color: BrandColors.textSecondary, maxWidth: 390 },
  actions: { paddingBottom: 10 },
  primary: { height: 54, borderRadius: 15, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center', shadowColor: BrandColors.burgundy, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  secondary: { height: 54, borderRadius: 15, borderWidth: 1, borderColor: BrandColors.borderStrong, backgroundColor: BrandColors.surface, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  secondaryText: { color: BrandColors.burgundy, fontSize: 16, fontWeight: '900' },
  footer: { textAlign: 'center', fontSize: 11, color: BrandColors.muted, marginTop: 12 },
  pressed: { opacity: 0.84 },
});
