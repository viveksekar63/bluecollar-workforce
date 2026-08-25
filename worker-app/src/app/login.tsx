import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { login } from '@/api/auth';
import { setAccessToken } from '@/api/client';
import { BrandColors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

type LoginRole = 'WORKER' | 'EMPLOYER';

export default function LoginScreen() {
  const setSession = useAuthStore((state) => state.setSession);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<LoginRole>('WORKER');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!identifier.trim() || !password) {
      Alert.alert('Missing information', 'Enter your phone/email and password.');
      return;
    }

    try {
      setLoading(true);
      const response = await login(identifier.trim(), password);
      setAccessToken(response.accessToken);
      setSession(response.accessToken, response.user, response.worker, response.employer);

      const roles = response.user.roles ?? [];
      const canUseSelectedRole = roles.includes(selectedRole);

      if (canUseSelectedRole) {
        router.replace(selectedRole === 'EMPLOYER' ? '/employer-home' : '/home');
      } else if (roles.includes('WORKER') && roles.includes('EMPLOYER')) {
        router.replace('/role-select');
      } else if (roles.includes('EMPLOYER')) {
        router.replace('/employer-home');
      } else if (roles.includes('WORKER')) {
        router.replace('/home');
      } else {
        Alert.alert('Access unavailable', 'Your account does not have mobile worker or employer access.');
      }
    } catch (error: any) {
      Alert.alert('Login failed', error?.response?.data?.message ?? 'Unable to connect to the authentication service.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
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
            <View><Text style={styles.cardLabel}>TRUSTED ACCESS</Text><Text style={styles.cardValue}>Worker + Employer</Text></View>
          </View>
          <View style={styles.opportunityCard}>
            <View style={styles.jobIcon}><Text style={styles.jobIconText}>□</Text></View>
            <View><Text style={styles.cardLabel}>ONE LOGIN</Text><Text style={styles.cardValue}>Two ways to work</Text></View>
          </View>
        </View>

        <View style={styles.heading}>
          <Text style={styles.eyebrow}>WELCOME BACK</Text>
          <Text style={styles.title}>Find work. Hire people.</Text>
          <Text style={styles.subtitle}>Sign in once to access WorkTrust as a worker or employer.</Text>
        </View>

        <View style={styles.roleSection}>
          <Text style={styles.roleLabel}>Continue as</Text>
          <View style={styles.roleSwitch}>
            <Pressable onPress={() => setSelectedRole('WORKER')} style={[styles.roleButton, selectedRole === 'WORKER' && styles.roleButtonActive]}>
              <Text style={styles.roleIcon}>👷</Text>
              <View><Text style={[styles.roleTitle, selectedRole === 'WORKER' && styles.roleTitleActive]}>Worker</Text><Text style={styles.roleHint}>Find jobs & apply</Text></View>
            </Pressable>
            <Pressable onPress={() => setSelectedRole('EMPLOYER')} style={[styles.roleButton, selectedRole === 'EMPLOYER' && styles.roleButtonActive]}>
              <Text style={styles.roleIcon}>💼</Text>
              <View><Text style={[styles.roleTitle, selectedRole === 'EMPLOYER' && styles.roleTitleActive]}>Employer</Text><Text style={styles.roleHint}>Post jobs & hire</Text></View>
            </Pressable>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Mobile or email</Text>
          <TextInput value={identifier} onChangeText={setIdentifier} placeholder="9876543210 or you@example.com" placeholderTextColor={BrandColors.muted} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
          <Text style={styles.label}>Password</Text>
          <TextInput value={password} onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor={BrandColors.muted} secureTextEntry style={styles.input} />
          <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, loading && styles.disabled]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Sign in as {selectedRole === 'WORKER' ? 'Worker' : 'Employer'}</Text>}
          </Pressable>
          <Pressable onPress={() => router.push('/register')} style={styles.secondaryButton}><Text style={styles.secondaryText}>New to WorkTrust? Create an account</Text></Pressable>
          <Text style={styles.footer}>One app for workers and employers</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background },
  content: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 40, height: 40, borderRadius: 13, backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.border, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  backText: { fontSize: 30, lineHeight: 32, color: BrandColors.text },
  brandName: { fontSize: 17, fontWeight: '900', color: BrandColors.text, letterSpacing: 0.8 },
  brandTagline: { marginTop: 1, fontSize: 10, color: BrandColors.textSecondary },
  heroVisual: { height: 255, marginTop: 20, borderRadius: 28, backgroundColor: BrandColors.burgundySoft, borderWidth: 1, borderColor: BrandColors.border, overflow: 'hidden', position: 'relative' },
  skyGlow: { position: 'absolute', width: 205, height: 205, borderRadius: 103, backgroundColor: BrandColors.surface, opacity: 0.82, top: 28, left: 48 },
  workerFigure: { position: 'absolute', left: 32, bottom: 4, width: 115, height: 220 },
  workerHead: { position: 'absolute', left: 35, top: 8, width: 46, height: 46, borderRadius: 23, backgroundColor: BrandColors.burgundyDark },
  workerBody: { position: 'absolute', left: 16, top: 52, width: 82, height: 125, borderRadius: 38, backgroundColor: BrandColors.burgundy },
  workerArm: { position: 'absolute', left: 0, top: 82, width: 25, height: 88, borderRadius: 13, backgroundColor: BrandColors.burgundyDark, transform: [{ rotate: '22deg' }] },
  workerTool: { position: 'absolute', left: 7, bottom: 0, width: 100, height: 17, borderRadius: 9, backgroundColor: BrandColors.rose },
  employerFigure: { position: 'absolute', right: 28, bottom: 2, width: 115, height: 225 },
  employerHead: { position: 'absolute', left: 35, top: 6, width: 46, height: 46, borderRadius: 23, backgroundColor: BrandColors.rose },
  employerBody: { position: 'absolute', left: 14, top: 50, width: 84, height: 133, borderRadius: 37, backgroundColor: BrandColors.surface, borderWidth: 2, borderColor: BrandColors.border },
  employerArm: { position: 'absolute', right: 0, top: 91, width: 25, height: 85, borderRadius: 13, backgroundColor: BrandColors.rose, transform: [{ rotate: '-22deg' }] },
  verifiedCard: { position: 'absolute', left: 10, top: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: BrandColors.surface, borderRadius: 13, padding: 8, paddingRight: 11, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  checkCircle: { width: 28, height: 28, borderRadius: 9, backgroundColor: BrandColors.successSoft, alignItems: 'center', justifyContent: 'center', marginRight: 7 },
  check: { color: BrandColors.success, fontSize: 15, fontWeight: '900' },
  opportunityCard: { position: 'absolute', right: 9, top: 124, flexDirection: 'row', alignItems: 'center', backgroundColor: BrandColors.surface, borderRadius: 13, padding: 8, paddingRight: 10, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  jobIcon: { width: 28, height: 28, borderRadius: 9, backgroundColor: BrandColors.burgundySoft, alignItems: 'center', justifyContent: 'center', marginRight: 7 },
  jobIconText: { color: BrandColors.burgundy, fontSize: 16, fontWeight: '900' },
  cardLabel: { fontSize: 7, fontWeight: '900', letterSpacing: 0.9, color: BrandColors.rose },
  cardValue: { marginTop: 2, fontSize: 10, fontWeight: '800', color: BrandColors.text },
  heading: { marginTop: 20, marginBottom: 13 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.6, color: BrandColors.rose, marginBottom: 6 },
  title: { fontSize: 29, lineHeight: 35, fontWeight: '900', color: BrandColors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 21, color: BrandColors.textSecondary },
  roleSection: { marginBottom: 12 },
  roleLabel: { fontSize: 13, fontWeight: '900', color: BrandColors.text, marginBottom: 8 },
  roleSwitch: { flexDirection: 'row', gap: 8 },
  roleButton: { flex: 1, minHeight: 64, flexDirection: 'row', alignItems: 'center', backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 14, paddingHorizontal: 10 },
  roleButtonActive: { borderColor: BrandColors.burgundy, backgroundColor: BrandColors.burgundySoft },
  roleIcon: { fontSize: 22, marginRight: 8 },
  roleTitle: { fontSize: 14, fontWeight: '900', color: BrandColors.text },
  roleTitleActive: { color: BrandColors.burgundy },
  roleHint: { marginTop: 2, fontSize: 9, color: BrandColors.textSecondary },
  form: { gap: 9 },
  label: { fontSize: 13, fontWeight: '800', color: BrandColors.text, marginTop: 2 },
  input: { height: 51, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 14, backgroundColor: BrandColors.surface, paddingHorizontal: 15, fontSize: 15, color: BrandColors.text },
  primaryButton: { height: 54, borderRadius: 15, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: BrandColors.burgundy, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  secondaryButton: { alignItems: 'center', paddingVertical: 9 },
  secondaryText: { color: BrandColors.burgundy, fontSize: 13, fontWeight: '800' },
  footer: { textAlign: 'center', fontSize: 11, color: BrandColors.muted, marginTop: 1 },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.6 },
});
