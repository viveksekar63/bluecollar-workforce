import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { login } from '@/api/auth';
import { setAccessToken } from '@/api/client';
import { BrandColors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

export default function LoginScreen() {
  const setSession = useAuthStore((state) => state.setSession);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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
      if (roles.includes('WORKER') && roles.includes('EMPLOYER')) {
        router.replace('/role-select');
      } else if (roles.includes('EMPLOYER')) {
        router.replace('/employer-home');
      } else if (roles.includes('WORKER')) {
        router.replace('/home');
      } else {
        Alert.alert('Access unavailable', 'Your account does not have a mobile worker or employer role.');
      }
    } catch (error: any) {
      Alert.alert('Login failed', error?.response?.data?.message ?? 'Unable to connect to the authentication service.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View>
          <Text style={styles.brandName}>WorkTrust</Text>
          <Text style={styles.brandTagline}>Verified people. Trusted work.</Text>
        </View>
      </View>

      <View style={styles.visual}>
        <View style={styles.visualCircle} />
        <View style={styles.visualPersonHead} />
        <View style={styles.visualPersonBody} />
        <View style={styles.visualBadge}>
          <Text style={styles.visualBadgeCheck}>✓</Text>
          <View>
            <Text style={styles.visualBadgeTitle}>TRUSTED ACCESS</Text>
            <Text style={styles.visualBadgeText}>Worker + Employer</Text>
          </View>
        </View>
        <View style={styles.visualBriefcase}>
          <Text style={styles.visualBriefcaseText}>▣</Text>
        </View>
      </View>

      <View style={styles.heading}>
        <Text style={styles.eyebrow}>WELCOME BACK</Text>
        <Text style={styles.title}>Your work starts here.</Text>
        <Text style={styles.subtitle}>Sign in once and use WorkTrust as a worker, an employer, or switch between both.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Mobile or email</Text>
        <TextInput value={identifier} onChangeText={setIdentifier} placeholder="9876543210 or you@example.com" placeholderTextColor={BrandColors.muted} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
        <Text style={styles.label}>Password</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor={BrandColors.muted} secureTextEntry style={styles.input} />
        <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, loading && styles.disabled]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Sign in</Text>}
        </Pressable>
        <Pressable onPress={() => router.push('/register')} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>New to WorkTrust? Create an account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background, paddingHorizontal: 22 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  backButton: { width: 40, height: 40, borderRadius: 13, backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.border, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  backText: { fontSize: 30, lineHeight: 32, color: BrandColors.text },
  brandName: { fontSize: 17, fontWeight: '900', color: BrandColors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  brandTagline: { marginTop: 1, fontSize: 10, color: BrandColors.textSecondary },
  visual: { height: 175, marginTop: 18, borderRadius: 28, backgroundColor: BrandColors.burgundySoft, borderWidth: 1, borderColor: BrandColors.border, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  visualCircle: { width: 130, height: 130, borderRadius: 65, backgroundColor: BrandColors.surface, opacity: 0.78, position: 'absolute' },
  visualPersonHead: { width: 42, height: 42, borderRadius: 21, backgroundColor: BrandColors.burgundy, position: 'absolute', top: 30, left: 151 },
  visualPersonBody: { width: 76, height: 82, borderRadius: 38, backgroundColor: BrandColors.rose, position: 'absolute', top: 72, left: 134 },
  visualBadge: { position: 'absolute', left: 12, top: 18, flexDirection: 'row', alignItems: 'center', backgroundColor: BrandColors.surface, borderRadius: 13, padding: 9, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  visualBadgeCheck: { width: 28, height: 28, borderRadius: 9, backgroundColor: BrandColors.successSoft, textAlign: 'center', textAlignVertical: 'center', color: BrandColors.success, fontWeight: '900', marginRight: 7 },
  visualBadgeTitle: { fontSize: 7, fontWeight: '900', letterSpacing: 1, color: BrandColors.rose },
  visualBadgeText: { fontSize: 10, fontWeight: '800', color: BrandColors.text, marginTop: 2 },
  visualBriefcase: { position: 'absolute', right: 18, bottom: 18, width: 38, height: 38, borderRadius: 12, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '8deg' }] },
  visualBriefcaseText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  heading: { marginTop: 20, marginBottom: 14 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.7, color: BrandColors.rose, marginBottom: 6 },
  title: { fontSize: 29, lineHeight: 35, fontWeight: '900', color: BrandColors.text, marginBottom: 7 },
  subtitle: { fontSize: 14, lineHeight: 21, color: BrandColors.textSecondary },
  form: { gap: 10 },
  label: { fontSize: 13, fontWeight: '800', color: BrandColors.text, marginTop: 2 },
  input: { height: 52, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 14, backgroundColor: BrandColors.surface, paddingHorizontal: 15, fontSize: 15, color: BrandColors.text },
  primaryButton: { height: 54, borderRadius: 15, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center', marginTop: 5, shadowColor: BrandColors.burgundy, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  secondaryButton: { alignItems: 'center', paddingVertical: 10 },
  secondaryText: { color: BrandColors.burgundy, fontSize: 13, fontWeight: '800' },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.6 },
});
