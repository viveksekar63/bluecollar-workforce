import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login } from '@/api/auth';
import { setAccessToken } from '@/api/client';
import { BrandColors } from '@/constants/theme';
import { WORKTRUST_HERO_IMAGE } from '@/constants/worktrust-hero';
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
      Alert.alert('Missing information', 'Enter your mobile/email and password.');
      return;
    }
    try {
      setLoading(true);
      const response = await login(identifier.trim(), password);
      setAccessToken(response.accessToken);
      setSession(response.accessToken, response.user, response.worker, response.employer);
      const roles = response.user.roles ?? [];
      if (roles.includes(selectedRole)) router.replace(selectedRole === 'EMPLOYER' ? '/employer-home' : '/home');
      else if (roles.includes('WORKER') && roles.includes('EMPLOYER')) router.replace('/role-select');
      else if (roles.includes('EMPLOYER')) router.replace('/employer-home');
      else if (roles.includes('WORKER')) router.replace('/home');
      else Alert.alert('Access unavailable', 'Your account does not have worker or employer mobile access.');
    } catch (error: any) {
      Alert.alert('Login failed', error?.response?.data?.message ?? 'Unable to connect to the authentication service.');
    } finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
          <View style={styles.logo}><Text style={styles.logoText}>W</Text></View>
          <View><Text style={styles.brand}>WorkTrust</Text><Text style={styles.tagline}>Verified people. Trusted work.</Text></View>
        </View>

        <View style={styles.hero}>
          <Image source={{ uri: WORKTRUST_HERO_IMAGE }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          <View style={styles.heroShade} />
          <View style={styles.heroTop}><Text style={styles.wMark}>W</Text><Text style={styles.heroBrand}>WorkTrust</Text><Text style={styles.heroTag}>Verified people. Trusted work.</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.welcome}>Welcome back!</Text>
          <Text style={styles.title}>Sign in to your account</Text>
          <Text style={styles.subtitle}>Continue to access your WorkTrust dashboard.</Text>

          <View style={styles.inputWrap}><Text style={styles.inputIcon}>⌕</Text><TextInput value={identifier} onChangeText={setIdentifier} placeholder="Mobile number or email" placeholderTextColor={BrandColors.muted} autoCapitalize="none" keyboardType="email-address" style={styles.input} /></View>
          <View style={styles.inputWrap}><Text style={styles.inputIcon}>⌑</Text><TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={BrandColors.muted} secureTextEntry style={styles.input} /></View>
          <Pressable style={styles.forgot}><Text style={styles.forgotText}>Forgot password?</Text></Pressable>

          <Text style={styles.roleLabel}>Continue as</Text>
          <View style={styles.roles}>
            <Pressable onPress={() => setSelectedRole('WORKER')} style={[styles.role, selectedRole === 'WORKER' && styles.roleActive]}>
              <Text style={styles.roleIcon}>👷</Text><Text style={styles.roleTitle}>Worker</Text><Text style={styles.roleHint}>Find jobs & apply</Text>{selectedRole === 'WORKER' && <View style={styles.check}><Text>✓</Text></View>}
            </Pressable>
            <Pressable onPress={() => setSelectedRole('EMPLOYER')} style={[styles.role, selectedRole === 'EMPLOYER' && styles.roleActive]}>
              <Text style={styles.roleIcon}>💼</Text><Text style={styles.roleTitle}>Employer</Text><Text style={styles.roleHint}>Post jobs & hire</Text>{selectedRole === 'EMPLOYER' && <View style={styles.check}><Text>✓</Text></View>}
            </Pressable>
          </View>

          <Pressable onPress={handleLogin} disabled={loading} style={[styles.primary, loading && styles.disabled]}>
            {loading ? <ActivityIndicator color={BrandColors.slate} /> : <><Text style={styles.primaryText}>Sign in</Text><Text style={styles.arrow}>→</Text></>}
          </Pressable>
          <View style={styles.or}><View style={styles.line} /><Text style={styles.orText}>or</Text><View style={styles.line} /></View>
          <Pressable onPress={() => router.push('/register')} style={styles.create}><Text style={styles.createText}>＋ Create an account</Text></Pressable>
          <View style={styles.security}><Text style={styles.securityIcon}>♢</Text><View><Text style={styles.securityTitle}>Safe. Secure. Reliable.</Text><Text style={styles.securityText}>Your data is protected with industry-leading security.</Text></View></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  back: { width: 40, height: 40, borderRadius: 13, backgroundColor: BrandColors.slateSoft, borderWidth: 1, borderColor: BrandColors.slateBorder, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  backText: { color: BrandColors.gold, fontSize: 30, lineHeight: 32 },
  logo: { width: 42, height: 42, borderRadius: 13, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  logoText: { color: BrandColors.slate, fontSize: 24, fontWeight: '900' },
  brand: { color: BrandColors.text, fontSize: 18, fontWeight: '900' },
  tagline: { color: BrandColors.muted, fontSize: 10, marginTop: 1 },
  hero: { height: 255, borderRadius: 27, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: BrandColors.slateBorder },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,12,16,.52)' },
  heroTop: { alignItems: 'center', paddingTop: 24 },
  wMark: { color: BrandColors.gold, fontSize: 48, lineHeight: 48, fontWeight: '900' },
  heroBrand: { color: '#fff', fontSize: 27, fontWeight: '900', marginTop: 1 },
  heroTag: { color: '#E1E6EA', fontSize: 11, marginTop: 3 },
  card: { backgroundColor: BrandColors.slateSoft, borderRadius: 27, borderWidth: 1, borderColor: BrandColors.slateBorder, padding: 20, marginTop: -12, zIndex: 2 },
  welcome: { color: BrandColors.gold, fontSize: 13, fontWeight: '800' },
  title: { color: BrandColors.text, fontSize: 27, lineHeight: 32, fontWeight: '900', marginTop: 4 },
  subtitle: { color: BrandColors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 15 },
  inputWrap: { height: 54, borderWidth: 1, borderColor: BrandColors.slateBorder, borderRadius: 14, backgroundColor: BrandColors.slate, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, marginBottom: 9 },
  inputIcon: { color: BrandColors.gold, fontSize: 21, width: 26 },
  input: { flex: 1, color: BrandColors.text, fontSize: 15 },
  forgot: { alignItems: 'flex-end', marginBottom: 16 },
  forgotText: { color: BrandColors.gold, fontSize: 12, fontWeight: '800' },
  roleLabel: { color: BrandColors.text, fontSize: 14, fontWeight: '900', marginBottom: 9 },
  roles: { flexDirection: 'row', gap: 9, marginBottom: 14 },
  role: { flex: 1, minHeight: 125, borderWidth: 1, borderColor: BrandColors.slateBorder, borderRadius: 16, backgroundColor: BrandColors.slate, padding: 12, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  roleActive: { borderColor: BrandColors.gold, backgroundColor: BrandColors.goldSoft },
  roleIcon: { fontSize: 28, marginBottom: 5 },
  roleTitle: { color: BrandColors.gold, fontSize: 15, fontWeight: '900' },
  roleHint: { color: BrandColors.textSecondary, fontSize: 10, marginTop: 3, textAlign: 'center' },
  check: { position: 'absolute', right: 8, top: 8, width: 22, height: 22, borderRadius: 11, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center' },
  primary: { height: 56, borderRadius: 15, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  primaryText: { color: BrandColors.slate, fontSize: 17, fontWeight: '900' },
  arrow: { color: BrandColors.slate, position: 'absolute', right: 20, fontSize: 27 },
  disabled: { opacity: .6 },
  or: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  line: { flex: 1, height: 1, backgroundColor: BrandColors.slateBorder },
  orText: { color: BrandColors.muted, fontSize: 11 },
  create: { height: 52, borderWidth: 1, borderColor: BrandColors.gold, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  createText: { color: BrandColors.gold, fontSize: 14, fontWeight: '900' },
  security: { flexDirection: 'row', alignItems: 'center', marginTop: 17, paddingTop: 15, borderTopWidth: 1, borderTopColor: BrandColors.slateBorder },
  securityIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: BrandColors.goldSoft, color: BrandColors.gold, textAlign: 'center', lineHeight: 38, fontSize: 21, marginRight: 10 },
  securityTitle: { color: BrandColors.text, fontSize: 12, fontWeight: '900' },
  securityText: { color: BrandColors.muted, fontSize: 9, marginTop: 3 },
});
