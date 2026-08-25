import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

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
    <View style={styles.container}>
      <View style={styles.brandMark}><Text style={styles.brandMarkText}>W</Text></View>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>WORKTRUST</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to find work or manage your jobs.</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Mobile or email</Text>
        <TextInput value={identifier} onChangeText={setIdentifier} placeholder="9876543210 or you@example.com" placeholderTextColor={BrandColors.muted} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
        <Text style={styles.label}>Password</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor={BrandColors.muted} secureTextEntry style={styles.input} />
        <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, loading && styles.disabled]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Sign in</Text>}
        </Pressable>
        <Pressable onPress={() => router.push('/register')} style={styles.secondaryButton}><Text style={styles.secondaryText}>New worker? Create an account</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background, paddingHorizontal: 24, paddingTop: 56 },
  brandMark: { width: 52, height: 52, borderRadius: 16, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  brandMarkText: { color: '#fff', fontSize: 25, fontWeight: '900' },
  header: { marginBottom: 36 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 2, color: BrandColors.rose, marginBottom: 12 },
  title: { fontSize: 34, fontWeight: '800', color: BrandColors.text, marginBottom: 10 },
  subtitle: { fontSize: 16, lineHeight: 24, color: BrandColors.textSecondary },
  form: { gap: 12 },
  label: { fontSize: 14, fontWeight: '700', color: BrandColors.text, marginTop: 6 },
  input: { height: 54, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 14, backgroundColor: BrandColors.surface, paddingHorizontal: 16, fontSize: 16, color: BrandColors.text },
  primaryButton: { height: 54, borderRadius: 14, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', paddingVertical: 16 },
  secondaryText: { color: BrandColors.burgundy, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
