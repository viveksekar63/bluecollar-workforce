import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { loginWorker } from '@/api/auth';
import { setAccessToken } from '@/api/client';
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
      const response = await loginWorker(identifier.trim(), password);
      setAccessToken(response.accessToken);
      setSession(response.accessToken, response.user, response.worker);
      router.replace('/home');
    } catch (error: any) {
      Alert.alert('Login failed', error?.response?.data?.message ?? 'Unable to connect to the authentication service.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>WORKTRUST</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to manage your worker profile and opportunities.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Mobile or email</Text>
        <TextInput value={identifier} onChangeText={setIdentifier} placeholder="9876543210 or you@example.com" autoCapitalize="none" keyboardType="email-address" style={styles.input} />

        <Text style={styles.label}>Password</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry style={styles.input} />

        <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, loading && styles.disabled]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Sign in</Text>}
        </Pressable>

        <Pressable onPress={() => router.push('/register')} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>New worker? Create an account</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA', paddingHorizontal: 24, paddingTop: 72 },
  header: { marginBottom: 36 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 2, color: '#2563EB', marginBottom: 12 },
  title: { fontSize: 34, fontWeight: '800', color: '#111827', marginBottom: 10 },
  subtitle: { fontSize: 16, lineHeight: 24, color: '#6B7280' },
  form: { gap: 12 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginTop: 6 },
  input: { height: 54, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, backgroundColor: '#fff', paddingHorizontal: 16, fontSize: 16, color: '#111827' },
  primaryButton: { height: 54, borderRadius: 12, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', paddingVertical: 16 },
  secondaryText: { color: '#2563EB', fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
