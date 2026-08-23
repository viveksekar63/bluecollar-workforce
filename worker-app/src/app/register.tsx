import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { registerWorker } from '@/api/auth';
import { setAccessToken } from '@/api/client';
import { BrandColors } from '@/constants/theme';
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
      <View style={styles.brandMark}><Text style={styles.brandMarkText}>W</Text></View>
      <Text style={styles.eyebrow}>JOIN WORKTRUST</Text>
      <Text style={styles.title}>Create your worker account</Text>
      <Text style={styles.subtitle}>Start your profile now. You can complete the remaining details after registration.</Text>

      {([['firstName', 'First name'], ['lastName', 'Last name'], ['phone', 'Mobile number'], ['email', 'Email'], ['password', 'Password']] as const).map(([key, label]) => (
        <View key={key} style={styles.field}>
          <Text style={styles.label}>{label}</Text>
          <TextInput value={form[key]} onChangeText={(value) => update(key, value)} placeholder={label} placeholderTextColor={BrandColors.muted} secureTextEntry={key === 'password'} keyboardType={key === 'phone' ? 'phone-pad' : key === 'email' ? 'email-address' : 'default'} autoCapitalize={key === 'email' ? 'none' : 'words'} style={styles.input} />
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
  container: { flexGrow: 1, backgroundColor: BrandColors.background, padding: 24, paddingTop: 48, paddingBottom: 40 },
  brandMark: { width: 52, height: 52, borderRadius: 16, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  brandMarkText: { color: '#fff', fontSize: 25, fontWeight: '900' },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 2, color: BrandColors.rose, marginBottom: 12 },
  title: { fontSize: 32, fontWeight: '800', color: BrandColors.text, marginBottom: 10 },
  subtitle: { fontSize: 15, lineHeight: 22, color: BrandColors.textSecondary, marginBottom: 24 },
  field: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '700', color: BrandColors.text, marginBottom: 7 },
  input: { height: 54, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 14, backgroundColor: BrandColors.surface, paddingHorizontal: 16, fontSize: 16, color: BrandColors.text },
  primaryButton: { height: 54, borderRadius: 14, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: BrandColors.burgundy, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  linkButton: { alignItems: 'center', paddingVertical: 18 },
  linkText: { color: BrandColors.burgundy, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
