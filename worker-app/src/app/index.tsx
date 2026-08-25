import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>W</Text></View>
          <View>
            <Text style={styles.brandName}>WORKTRUST</Text>
            <Text style={styles.brandTagline}>Verified people. Trusted work.</Text>
          </View>
        </View>

        <View style={styles.heroVisual}>
          <View style={styles.skyGlow} />
          <View style={styles.workerFigure}>
            <View style={styles.workerHead} />
            <View style={styles.workerBody} />
            <View style={styles.workerArm} />
            <View style={styles.workerTool} />
          </View>
          <View style={styles.employerFigure}>
            <View style={styles.employerHead} />
            <View style={styles.employerBody} />
            <View style={styles.employerArm} />
          </View>
          <View style={styles.verifiedCard}>
            <View style={styles.checkCircle}><Text style={styles.check}>✓</Text></View>
            <View><Text style={styles.cardLabel}>VERIFIED WORK</Text><Text style={styles.cardValue}>Skills & experience</Text></View>
          </View>
          <View style={styles.opportunityCard}>
            <View style={styles.jobIcon}><Text style={styles.jobIconText}>□</Text></View>
            <View><Text style={styles.cardLabel}>NEW OPPORTUNITY</Text><Text style={styles.cardValue}>A job that fits you</Text></View>
          </View>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>ONE APP. TWO WAYS TO WORK.</Text>
          <Text style={styles.title}>Find work. Hire people. Build trust.</Text>
          <Text style={styles.subtitle}>WorkTrust brings workers and employers together in one simple, verified platform.</Text>
        </View>

        <View style={styles.roleStrip}>
          <View style={styles.roleItem}><Text style={styles.roleIcon}>👷</Text><Text style={styles.roleText}>Worker</Text></View>
          <View style={styles.roleDivider} />
          <View style={styles.roleItem}><Text style={styles.roleIcon}>💼</Text><Text style={styles.roleText}>Employer</Text></View>
        </View>

        <View style={styles.actions}>
          <Pressable style={({ pressed }) => [styles.primary, pressed && styles.pressed]} onPress={() => router.push('/login')}>
            <Text style={styles.primaryText}>Sign in</Text>
            <Text style={styles.arrow}>→</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.secondary, pressed && styles.pressed]} onPress={() => router.push('/register')}>
            <Text style={styles.secondaryText}>Create an account</Text>
          </Pressable>
          <Text style={styles.footer}>One login for Worker and Employer access</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background },
  content: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 18 },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  brandMark: { width: 46, height: 46, borderRadius: 15, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  brandMarkText: { color: '#fff', fontSize: 23, fontWeight: '900' },
  brandName: { fontSize: 18, fontWeight: '900', color: BrandColors.text, letterSpacing: 0.8 },
  brandTagline: { marginTop: 2, fontSize: 11, color: BrandColors.textSecondary },
  heroVisual: { height: 350, marginTop: 28, borderRadius: 30, backgroundColor: BrandColors.burgundySoft, borderWidth: 1, borderColor: BrandColors.border, overflow: 'hidden', position: 'relative' },
  skyGlow: { position: 'absolute', width: 270, height: 270, borderRadius: 135, backgroundColor: BrandColors.surface, opacity: 0.82, top: 35, left: 72 },
  workerFigure: { position: 'absolute', left: 42, bottom: 8, width: 150, height: 285 },
  workerHead: { position: 'absolute', left: 47, top: 14, width: 58, height: 58, borderRadius: 29, backgroundColor: BrandColors.burgundyDark },
  workerBody: { position: 'absolute', left: 24, top: 68, width: 104, height: 155, borderRadius: 44, backgroundColor: BrandColors.burgundy },
  workerArm: { position: 'absolute', left: 4, top: 103, width: 31, height: 112, borderRadius: 16, backgroundColor: BrandColors.burgundyDark, transform: [{ rotate: '22deg' }] },
  workerTool: { position: 'absolute', left: 11, bottom: 4, width: 128, height: 22, borderRadius: 11, backgroundColor: BrandColors.rose },
  employerFigure: { position: 'absolute', right: 35, bottom: 4, width: 150, height: 295 },
  employerHead: { position: 'absolute', left: 47, top: 8, width: 58, height: 58, borderRadius: 29, backgroundColor: BrandColors.rose },
  employerBody: { position: 'absolute', left: 22, top: 63, width: 108, height: 172, borderRadius: 45, backgroundColor: BrandColors.surface, borderWidth: 3, borderColor: BrandColors.border },
  employerArm: { position: 'absolute', right: 0, top: 118, width: 31, height: 105, borderRadius: 16, backgroundColor: BrandColors.rose, transform: [{ rotate: '-22deg' }] },
  verifiedCard: { position: 'absolute', left: 12, top: 18, flexDirection: 'row', alignItems: 'center', backgroundColor: BrandColors.surface, borderRadius: 14, padding: 9, paddingRight: 13, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  checkCircle: { width: 31, height: 31, borderRadius: 10, backgroundColor: BrandColors.successSoft, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  check: { color: BrandColors.success, fontSize: 16, fontWeight: '900' },
  opportunityCard: { position: 'absolute', right: 10, top: 160, flexDirection: 'row', alignItems: 'center', backgroundColor: BrandColors.surface, borderRadius: 14, padding: 9, paddingRight: 12, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  jobIcon: { width: 31, height: 31, borderRadius: 10, backgroundColor: BrandColors.burgundySoft, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  jobIconText: { color: BrandColors.burgundy, fontSize: 18, fontWeight: '900' },
  cardLabel: { fontSize: 7, fontWeight: '900', letterSpacing: 1, color: BrandColors.rose },
  cardValue: { marginTop: 2, fontSize: 10, fontWeight: '800', color: BrandColors.text },
  heroCopy: { marginTop: 24 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.7, color: BrandColors.rose, marginBottom: 7 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '900', color: BrandColors.text },
  subtitle: { marginTop: 8, fontSize: 14, lineHeight: 21, color: BrandColors.textSecondary },
  roleStrip: { marginTop: 18, height: 52, borderRadius: 15, backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  roleItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28 },
  roleIcon: { fontSize: 20, marginRight: 8 },
  roleText: { fontSize: 14, fontWeight: '800', color: BrandColors.text },
  roleDivider: { width: 1, height: 25, backgroundColor: BrandColors.border },
  actions: { marginTop: 18 },
  primary: { height: 56, borderRadius: 15, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', shadowColor: BrandColors.burgundy, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  arrow: { color: '#fff', fontSize: 26, position: 'absolute', right: 22 },
  secondary: { height: 54, borderRadius: 15, borderWidth: 1, borderColor: BrandColors.borderStrong, backgroundColor: BrandColors.surface, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  secondaryText: { color: BrandColors.burgundy, fontSize: 15, fontWeight: '900' },
  footer: { textAlign: 'center', fontSize: 11, color: BrandColors.muted, marginTop: 10 },
  pressed: { opacity: 0.84 },
});
