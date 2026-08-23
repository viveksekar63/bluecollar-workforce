import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { registerWorker } from '@/api/auth';
import { setAccessToken } from '@/api/client';
import { useAuthStore } from '@/store/auth';

export default function RegisterScreen() {
  const setSession = useAuthStore((state) => state.setSession);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function handleRegister() {
    if (Object.values(form).some((value) => !value.trim())) {
      Alert.alert('Missing information', 'Please complete all fields.');
      return;
    }
    try {
      setLoading(true);
      const response = await registerWorker(form);
      setAccessToken(response.accessToken);
      setSession(response.accessToken, response.user, response.worker);
      router.replace('/profile');
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert('Registration failed', Array.isArray(message) ? message.join('\n') : message ?? 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>JOIN WORKTRUST</Text>
      <Text style={styles.title}>Create your worker account</Text>
      <Text style={styles.subtitle}>Start your profile now. You can complete the remaining details after registration.</Text>

      {([['firstName', 'First name'], ['lastName', 'Last name'], ['phone', 'Mobile number'], ['email', 'Email'], ['password', 'Password']] as const).map(([key, label]) => (
        <View key={key} style={styles.field}>
          <Text style={styles.label}>{label}</Text>
          <TextInput value={form[key]} onChangeText={(value) => update(key, value)} placeholder={label} secureTextEntry={key === 'password'} keyboardType={key === 'phone' ? 'phone-pad' : key === 'email' ? 'email-address' : 'default'} autoCapitalize={key === 'email' ? 'none' : 'words'} style={styles.input} />
        </View>
      ))}

      <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, loading && styles.disabled]} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Create account</Text>}
      </Pressable>
      <Pressable onPress={() => router.back()} style={styles.linkButton}><Text style={styles.linkText}>Already have an account? Sign in</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F7F8FA', padding: 24, paddingTop: 64 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 2, color: '#2563EB', marginBottom: 12 },
  title: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 10 },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#6B7280', marginBottom: 24 },
  field: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 7 },
  input: { height: 54, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, backgroundColor: '#fff', paddingHorizontal: 16, fontSize: 16, color: '#111827' },
  primaryButton: { height: 54, borderRadius: 12, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  linkButton: { alignItems: 'center', paddingVertical: 18 },
  linkText: { color: '#2563EB', fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
