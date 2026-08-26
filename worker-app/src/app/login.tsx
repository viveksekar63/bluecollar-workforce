import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
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
  const { height } = useWindowDimensions();
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
    } finally {
      setLoading(false);
    }
  }

  const heroHeight = Math.min(430, Math.max(315, height * 0.47));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.hero, { height: heroHeight }]}>
          <Image
            source={WORKTRUST_HERO_IMAGE}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={150}
          />
          <View style={styles.heroShade} />
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backHitArea} />
        </View>

        <View style={styles.card}>
          <Text style={styles.welcome}>Welcome back!</Text>
          <Text style={styles.title}>Sign in to your account</Text>
          <Text style={styles.subtitle}>Continue to access your dashboard</Text>

          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>⌕</Text>
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="Mobile number or email"
              placeholderTextColor={BrandColors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>⌑</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={BrandColors.muted}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <Pressable style={styles.forgot} onPress={() => Alert.alert('Forgot password', 'Password recovery will be available here.')}> 
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          <Text style={styles.roleLabel}>Continue as</Text>
          <View style={styles.roles}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: selectedRole === 'WORKER' }}
              onPress={() => setSelectedRole('WORKER')}
              style={[styles.role, selectedRole === 'WORKER' && styles.roleActive]}
            >
              <Text style={styles.roleIcon}>👷</Text>
              <Text style={styles.roleTitle}>Worker</Text>
              <Text style={styles.roleHint}>Find jobs & apply</Text>
              {selectedRole === 'WORKER' && <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: selectedRole === 'EMPLOYER' }}
              onPress={() => setSelectedRole('EMPLOYER')}
              style={[styles.role, selectedRole === 'EMPLOYER' && styles.roleActive]}
            >
              <Text style={styles.roleIcon}>💼</Text>
              <Text style={styles.roleTitle}>Employer</Text>
              <Text style={styles.roleHint}>Post jobs & hire</Text>
              {selectedRole === 'EMPLOYER' && <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>}
            </Pressable>
          </View>

          <Pressable onPress={handleLogin} disabled={loading} style={[styles.primary, loading && styles.disabled]}>
            {loading ? <ActivityIndicator color={BrandColors.slate} /> : <><Text style={styles.primaryText}>Sign in</Text><Text style={styles.arrow}>→</Text></>}
          </Pressable>

          <View style={styles.or}>
            <View style={styles.line} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.line} />
          </View>

          <Pressable onPress={() => router.push('/register')} style={styles.create}>
            <Text style={styles.createText}>＋ Create an account</Text>
          </Pressable>

          <View style={styles.security}>
            <Text style={styles.securityIcon}>♢</Text>
            <View style={styles.securityCopy}>
              <Text style={styles.securityTitle}>Safe. Secure. Reliable.</Text>
              <Text style={styles.securityText}>Your data is protected with industry-leading security.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background },
  content: { paddingHorizontal: 14, paddingTop: 0, paddingBottom: 28 },
  hero: { width: '100%', borderRadius: 25, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: BrandColors.slateBorder, backgroundColor: BrandColors.slate },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,12,16,0.12)' },
  backHitArea: { position: 'absolute', left: 18, top: 55, width: 54, height: 54, borderRadius: 27 },
  card: { backgroundColor: BrandColors.slateSoft, borderRadius: 25, borderWidth: 1, borderColor: BrandColors.slateBorder, paddingHorizontal: 18, paddingTop: 17, paddingBottom: 18, marginTop: -18, zIndex: 2 },
  welcome: { color: BrandColors.gold, fontSize: 13, fontWeight: '800' },
  title: { color: BrandColors.text, fontSize: 26, lineHeight: 31, fontWeight: '900', marginTop: 2 },
  subtitle: { color: BrandColors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: 14 },
  inputWrap: { height: 54, borderWidth: 1, borderColor: BrandColors.slateBorder, borderRadius: 14, backgroundColor: BrandColors.slate, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 9 },
  inputIcon: { color: BrandColors.gold, fontSize: 20, width: 26, textAlign: 'center' },
  input: { flex: 1, color: BrandColors.text, fontSize: 15, paddingVertical: 0 },
  forgot: { alignItems: 'flex-end', marginBottom: 15 },
  forgotText: { color: BrandColors.gold, fontSize: 11, fontWeight: '800' },
  roleLabel: { color: BrandColors.text, fontSize: 13, fontWeight: '900', marginBottom: 8 },
  roles: { flexDirection: 'row', gap: 8, marginBottom: 13 },
  role: { flex: 1, minHeight: 126, borderWidth: 1, borderColor: BrandColors.slateBorder, borderRadius: 16, backgroundColor: BrandColors.slate, padding: 10, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  roleActive: { borderColor: BrandColors.gold, backgroundColor: BrandColors.goldSoft },
  roleIcon: { fontSize: 28, marginBottom: 4 },
  roleTitle: { color: BrandColors.gold, fontSize: 15, fontWeight: '900' },
  roleHint: { color: BrandColors.textSecondary, fontSize: 10, marginTop: 3, textAlign: 'center' },
  check: { position: 'absolute', right: 8, top: 8, width: 21, height: 21, borderRadius: 11, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: BrandColors.slate, fontSize: 13, fontWeight: '900' },
  primary: { height: 56, borderRadius: 15, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  primaryText: { color: BrandColors.slate, fontSize: 17, fontWeight: '900' },
  arrow: { color: BrandColors.slate, position: 'absolute', right: 20, fontSize: 27, lineHeight: 28 },
  disabled: { opacity: 0.6 },
  or: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 13 },
  line: { flex: 1, height: 1, backgroundColor: BrandColors.slateBorder },
  orText: { color: BrandColors.muted, fontSize: 11 },
  create: { height: 52, borderWidth: 1, borderColor: BrandColors.gold, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  createText: { color: BrandColors.gold, fontSize: 14, fontWeight: '900' },
  security: { flexDirection: 'row', alignItems: 'center', marginTop: 15, paddingTop: 14, borderTopWidth: 1, borderTopColor: BrandColors.slateBorder },
  securityIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: BrandColors.goldSoft, color: BrandColors.gold, textAlign: 'center', lineHeight: 38, fontSize: 21, marginRight: 10 },
  securityCopy: { flex: 1 },
  securityTitle: { color: BrandColors.text, fontSize: 12, fontWeight: '900' },
  securityText: { color: BrandColors.muted, fontSize: 9, marginTop: 3 },
});
