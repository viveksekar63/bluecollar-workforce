import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { requestRegistrationOtp, MobileRole } from '@/api/auth';
import { BrandColors } from '@/constants/theme';

export default function RegisterScreen() {
  const [role, setRole] = useState<MobileRole>('WORKER');
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', password: '', companyName: '' });
  const [loading, setLoading] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function handleRegister() {
    const required = [form.firstName, form.phone, form.password, form.email];
    if (required.some((value) => !value.trim())) {
      Alert.alert('Missing information', 'Please complete your first name, mobile number, email and password.');
      return;
    }
    if (role === 'EMPLOYER' && !form.companyName.trim()) {
      Alert.alert('Company name required', 'Please enter your company or business name.');
      return;
    }
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) {
      Alert.alert('Invalid mobile number', 'Enter a valid 10-digit mobile number.');
      return;
    }
    if (form.password.length < 8) {
      Alert.alert('Password too short', 'Password must contain at least 8 characters.');
      return;
    }

    try {
      setLoading(true);
      const response = await requestRegistrationOtp({ role, ...form });
      router.push({ pathname: '/register-otp', params: { phone: response.phone, role, devOtp: response.devOtp ?? '' } });
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert('Unable to continue', Array.isArray(message) ? message.join('\n') : message ?? 'Unable to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.brandMark}><Text style={styles.brandMarkText}>W</Text></View>
      <Text style={styles.eyebrow}>JOIN WORKTRUST</Text>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>One account for workers and employers. Verify your mobile number to get started.</Text>

      <Text style={styles.sectionLabel}>I want to join as</Text>
      <View style={styles.roles}>
        <Pressable onPress={() => setRole('WORKER')} style={[styles.roleCard, role === 'WORKER' && styles.roleActive]}>
          <Text style={styles.roleIcon}>👷</Text>
          <Text style={styles.roleTitle}>Worker</Text>
          <Text style={styles.roleHint}>Find jobs & apply</Text>
          {role === 'WORKER' && <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>}
        </Pressable>
        <Pressable onPress={() => setRole('EMPLOYER')} style={[styles.roleCard, role === 'EMPLOYER' && styles.roleActive]}>
          <Text style={styles.roleIcon}>💼</Text>
          <Text style={styles.roleTitle}>Employer</Text>
          <Text style={styles.roleHint}>Post jobs & hire</Text>
          {role === 'EMPLOYER' && <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>}
        </Pressable>
      </View>

      {role === 'EMPLOYER' && (
        <View style={styles.field}>
          <Text style={styles.label}>Company / business name</Text>
          <TextInput value={form.companyName} onChangeText={(value) => update('companyName', value)} placeholder="e.g. Avive Catering" placeholderTextColor={BrandColors.muted} style={styles.input} />
        </View>
      )}

      {([['firstName', 'First name'], ['lastName', 'Last name'], ['phone', 'Mobile number'], ['email', 'Email'], ['password', 'Password']] as const).map(([key, label]) => (
        <View key={key} style={styles.field}>
          <Text style={styles.label}>{label}{key === 'firstName' || key === 'phone' || key === 'email' || key === 'password' ? ' *' : ''}</Text>
          <TextInput
            value={form[key]}
            onChangeText={(value) => update(key, value)}
            placeholder={label}
            placeholderTextColor={BrandColors.muted}
            secureTextEntry={key === 'password'}
            keyboardType={key === 'phone' ? 'phone-pad' : key === 'email' ? 'email-address' : 'default'}
            autoCapitalize={key === 'email' ? 'none' : key === 'password' ? 'none' : 'words'}
            style={styles.input}
          />
        </View>
      ))}

      <View style={styles.otpHint}>
        <Text style={styles.otpIcon}>✓</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.otpTitle}>Mobile verification</Text>
          <Text style={styles.otpText}>We will send a 6-digit OTP to verify this mobile number.</Text>
        </View>
      </View>

      <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, loading && styles.disabled]} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color={BrandColors.slate} /> : <><Text style={styles.primaryText}>Continue & send OTP</Text><Text style={styles.arrow}>→</Text></>}
      </Pressable>

      <Pressable onPress={() => router.back()} style={styles.linkButton}><Text style={styles.linkText}>Already have an account? Sign in</Text></Pressable>
      <Text style={styles.footer}>Worker and Employer access in one app</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: BrandColors.background, padding: 24, paddingTop: 48, paddingBottom: 40 },
  brandMark: { width: 52, height: 52, borderRadius: 16, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  brandMarkText: { color: BrandColors.slate, fontSize: 25, fontWeight: '900' },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 2, color: BrandColors.gold, marginBottom: 10 },
  title: { fontSize: 32, lineHeight: 37, fontWeight: '900', color: BrandColors.text, marginBottom: 9 },
  subtitle: { fontSize: 14, lineHeight: 21, color: BrandColors.textSecondary, marginBottom: 20 },
  sectionLabel: { color: BrandColors.text, fontSize: 13, fontWeight: '900', marginBottom: 8 },
  roles: { flexDirection: 'row', gap: 8, marginBottom: 17 },
  roleCard: { flex: 1, minHeight: 112, borderWidth: 1, borderColor: BrandColors.slateBorder, borderRadius: 16, backgroundColor: BrandColors.slate, alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 10 },
  roleActive: { borderColor: BrandColors.gold, backgroundColor: BrandColors.goldSoft },
  roleIcon: { fontSize: 27, marginBottom: 3 },
  roleTitle: { color: BrandColors.gold, fontSize: 15, fontWeight: '900' },
  roleHint: { color: BrandColors.textSecondary, fontSize: 10, marginTop: 3 },
  check: { position: 'absolute', right: 8, top: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: BrandColors.slate, fontWeight: '900' },
  field: { marginBottom: 13 },
  label: { fontSize: 13, fontWeight: '800', color: BrandColors.text, marginBottom: 7 },
  input: { height: 54, borderWidth: 1, borderColor: BrandColors.slateBorder, borderRadius: 14, backgroundColor: BrandColors.slate, paddingHorizontal: 16, fontSize: 15, color: BrandColors.text },
  otpHint: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BrandColors.slateBorder, backgroundColor: BrandColors.slateSoft, borderRadius: 14, padding: 12, marginTop: 2, marginBottom: 14 },
  otpIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: BrandColors.goldSoft, color: BrandColors.gold, textAlign: 'center', lineHeight: 32, fontWeight: '900', marginRight: 10 },
  otpTitle: { color: BrandColors.text, fontSize: 12, fontWeight: '900' },
  otpText: { color: BrandColors.muted, fontSize: 10, lineHeight: 15, marginTop: 2 },
  primaryButton: { height: 56, borderRadius: 15, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 3 },
  primaryText: { color: BrandColors.slate, fontSize: 16, fontWeight: '900' },
  arrow: { color: BrandColors.slate, position: 'absolute', right: 20, fontSize: 26 },
  linkButton: { alignItems: 'center', paddingVertical: 18 },
  linkText: { color: BrandColors.gold, fontSize: 14, fontWeight: '800' },
  footer: { color: BrandColors.muted, fontSize: 10, textAlign: 'center' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
