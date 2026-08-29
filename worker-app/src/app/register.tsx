import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { requestRegistrationOtp } from '@/api/auth';
import { BrandColors } from '@/constants/theme';
import { WORKTRUST_HERO_IMAGE } from '@/constants/worktrust-hero';

const EMPLOYER_ROLE = 'EMPLOYER' as const;

export default function RegisterScreen() {
  const { height } = useWindowDimensions();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', password: '', companyName: '' });
  const [loading, setLoading] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function handleRegister() {
    const required = [form.firstName, form.phone, form.password, form.email, form.companyName];
    if (required.some((value) => !value.trim())) {
      Alert.alert('Missing information', 'Please complete your name, company/business name, mobile number, email and password.');
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
      const response = await requestRegistrationOtp({ role: EMPLOYER_ROLE, ...form });
      router.push({ pathname: '/register-otp', params: { phone: response.phone, role: EMPLOYER_ROLE, devOtp: response.devOtp ?? '' } });
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert('Unable to continue', Array.isArray(message) ? message.join('\n') : message ?? 'Unable to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const heroHeight = Math.min(360, Math.max(275, height * 0.36));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
        <View style={[styles.hero, { height: heroHeight }]}>
          <Image source={WORKTRUST_HERO_IMAGE} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={150} />
          <View style={styles.heroShade} />
          <View style={styles.heroTop}>
            <View style={styles.logoMark}><Text style={styles.logoText}>W</Text></View>
            <View>
              <Text style={styles.brandName}>WorkTrust</Text>
              <Text style={styles.tagline}>Verified people. Trusted work.</Text>
            </View>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Build your team with confidence.</Text>
            <Text style={styles.heroSubtitle}>Create your employer account and connect with verified professionals.</Text>
          </View>
          <View style={styles.heroPills}>
            <View style={styles.heroPill}><Text style={styles.pillIcon}>✓</Text><Text style={styles.pillText}>Verified workers</Text></View>
            <View style={styles.heroPill}><Text style={styles.pillIcon}>⚡</Text><Text style={styles.pillText}>Faster hiring</Text></View>
            <View style={styles.heroPill}><Text style={styles.pillIcon}>⌁</Text><Text style={styles.pillText}>Secure</Text></View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.accent} />
          <Text style={styles.eyebrow}>EMPLOYER REGISTRATION</Text>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Start hiring trusted workers and manage your workforce from one place.</Text>

          <View style={styles.accountBadge}>
            <View style={styles.accountIcon}><Text style={styles.accountIconText}>▣</Text></View>
            <View style={styles.accountCopy}>
              <Text style={styles.accountTitle}>Employer account</Text>
              <Text style={styles.accountText}>Post jobs, find workers and hire faster.</Text>
            </View>
            <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Company / business name *</Text>
            <TextInput value={form.companyName} onChangeText={(v) => update('companyName', v)} placeholder="e.g. Avive Catering" placeholderTextColor={BrandColors.muted} style={styles.input} />
          </View>

          {([
            ['firstName', 'First name', true], ['lastName', 'Last name', false], ['phone', 'Mobile number', true], ['email', 'Email', true], ['password', 'Password', true],
          ] as const).map(([key, label, required]) => (
            <View key={key} style={styles.field}>
              <Text style={styles.label}>{label}{required ? ' *' : ''}</Text>
              <TextInput
                value={form[key]}
                onChangeText={(v) => update(key, v)}
                placeholder={label}
                placeholderTextColor={BrandColors.muted}
                secureTextEntry={key === 'password'}
                keyboardType={key === 'phone' ? 'phone-pad' : key === 'email' ? 'email-address' : 'default'}
                autoCapitalize={key === 'email' || key === 'password' ? 'none' : 'words'}
                style={styles.input}
              />
            </View>
          ))}

          <View style={styles.otpHint}>
            <View style={styles.otpIcon}><Text style={styles.otpIconText}>✓</Text></View>
            <View style={styles.otpCopy}><Text style={styles.otpTitle}>Mobile verification</Text><Text style={styles.otpText}>A 6-digit OTP will be sent to verify your mobile number.</Text></View>
          </View>

          <Pressable style={({ pressed }) => [styles.primary, pressed && styles.pressed, loading && styles.disabled]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color={BrandColors.white} /> : <><Text style={styles.primaryText}>Continue & send OTP</Text><Text style={styles.arrow}>→</Text></>}
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.signInLink}><Text style={styles.signInText}>Already have an account? <Text style={styles.signInStrong}>Sign in</Text></Text></Pressable>

          <View style={styles.security}>
            <View style={styles.securityIcon}><Text style={styles.securityIconText}>✓</Text></View>
            <View style={styles.securityCopy}><Text style={styles.securityTitle}>Safe. Secure. Reliable.</Text><Text style={styles.securityText}>Your data is protected with industry-leading security.</Text></View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },
  container: { paddingHorizontal: 12, paddingBottom: 28 },
  hero: { borderRadius: 26, overflow: 'hidden', backgroundColor: BrandColors.navy, position: 'relative', borderWidth: 1, borderColor: BrandColors.navy },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,18,45,0.30)' },
  heroTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 22 },
  logoMark: { width: 48, height: 42, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  logoText: { color: '#F4B942', fontSize: 39, lineHeight: 39, fontWeight: '900' },
  brandName: { color: BrandColors.white, fontSize: 25, fontWeight: '900' },
  tagline: { color: '#D7EEFF', fontSize: 10, marginTop: 1 },
  heroCopy: { paddingHorizontal: 20, marginTop: 22, maxWidth: 350 },
  heroTitle: { color: BrandColors.white, fontSize: 26, lineHeight: 31, fontWeight: '900' },
  heroSubtitle: { color: '#D7EEFF', fontSize: 12, lineHeight: 18, marginTop: 6, maxWidth: 300 },
  heroPills: { position: 'absolute', left: 15, right: 15, bottom: 14, height: 48, borderRadius: 24, backgroundColor: 'rgba(5,28,67,0.78)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.45)', flexDirection: 'row', alignItems: 'center' },
  heroPill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pillIcon: { color: BrandColors.sky, fontSize: 13, fontWeight: '900' },
  pillText: { color: BrandColors.white, fontSize: 9, fontWeight: '800', marginTop: 1 },
  card: { marginTop: -14, zIndex: 2, backgroundColor: BrandColors.white, borderRadius: 26, borderWidth: 1, borderColor: BrandColors.border, padding: 19, paddingTop: 22, shadowColor: BrandColors.navy, shadowOpacity: 0.10, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 5 },
  accent: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: BrandColors.indigo, borderTopLeftRadius: 26, borderTopRightRadius: 26 },
  eyebrow: { color: BrandColors.indigo, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 5 },
  title: { color: BrandColors.text, fontSize: 27, lineHeight: 32, fontWeight: '900' },
  subtitle: { color: BrandColors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 14 },
  accountBadge: { minHeight: 62, borderRadius: 16, backgroundColor: BrandColors.skySoft, borderWidth: 1, borderColor: BrandColors.border, flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 16 },
  accountIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: BrandColors.navy, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  accountIconText: { color: BrandColors.sky, fontSize: 18, fontWeight: '900' },
  accountCopy: { flex: 1 },
  accountTitle: { color: BrandColors.text, fontSize: 12, fontWeight: '900' },
  accountText: { color: BrandColors.textSecondary, fontSize: 9, marginTop: 2 },
  check: { width: 21, height: 21, borderRadius: 11, backgroundColor: BrandColors.indigo, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: BrandColors.white, fontSize: 12, fontWeight: '900' },
  field: { marginBottom: 11 },
  label: { color: BrandColors.text, fontSize: 11, fontWeight: '800', marginBottom: 6 },
  input: { height: 52, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 14, backgroundColor: BrandColors.surfaceLight, paddingHorizontal: 14, fontSize: 14, color: BrandColors.text },
  otpHint: { flexDirection: 'row', alignItems: 'center', backgroundColor: BrandColors.skySoft, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 14, padding: 10, marginTop: 2, marginBottom: 14 },
  otpIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: BrandColors.white, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  otpIconText: { color: BrandColors.indigo, fontSize: 15, fontWeight: '900' },
  otpCopy: { flex: 1 },
  otpTitle: { color: BrandColors.text, fontSize: 11, fontWeight: '900' },
  otpText: { color: BrandColors.muted, fontSize: 9, lineHeight: 14, marginTop: 1 },
  primary: { height: 55, borderRadius: 16, backgroundColor: BrandColors.indigo, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', shadowColor: BrandColors.indigo, shadowOpacity: 0.22, shadowRadius: 9, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  primaryText: { color: BrandColors.white, fontSize: 15, fontWeight: '900' },
  arrow: { color: BrandColors.white, position: 'absolute', right: 18, fontSize: 24 },
  signInLink: { alignItems: 'center', paddingVertical: 15 },
  signInText: { color: BrandColors.textSecondary, fontSize: 12 },
  signInStrong: { color: BrandColors.indigo, fontWeight: '900' },
  security: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: BrandColors.border, paddingTop: 13 },
  securityIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: BrandColors.skySoft, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  securityIconText: { color: BrandColors.indigo, fontSize: 15, fontWeight: '900' },
  securityCopy: { flex: 1 },
  securityTitle: { color: BrandColors.text, fontSize: 10, fontWeight: '900' },
  securityText: { color: BrandColors.muted, fontSize: 8, marginTop: 2 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
