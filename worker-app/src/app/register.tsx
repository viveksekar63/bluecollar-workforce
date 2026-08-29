import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { requestRegistrationOtp } from '@/api/auth';
import { BrandColors } from '@/constants/theme';

const EMPLOYER_ROLE = 'EMPLOYER' as const;

export default function RegisterScreen() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    companyName: '',
  });
  const [loading, setLoading] = useState(false);
  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function handleRegister() {
    const required = [form.firstName, form.phone, form.password, form.email, form.companyName];
    if (required.some((value) => !value.trim())) {
      Alert.alert(
        'Missing information',
        'Please complete your name, company/business name, mobile number, email and password.',
      );
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
      const response = await requestRegistrationOtp({
        role: EMPLOYER_ROLE,
        ...form,
      });
      router.push({
        pathname: '/register-otp',
        params: {
          phone: response.phone,
          role: EMPLOYER_ROLE,
          devOtp: response.devOtp ?? '',
        },
      });
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert(
        'Unable to continue',
        Array.isArray(message)
          ? message.join('\n')
          : message ?? 'Unable to send OTP. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.brandHeader}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>W</Text>
        </View>
        <View>
          <Text style={styles.brandName}>WorkTrust</Text>
          <Text style={styles.brandTagline}>Verified people. Trusted work.</Text>
        </View>
      </View>

      <Text style={styles.eyebrow}>EMPLOYER REGISTRATION</Text>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>
        Set up your employer account to find verified workers, post jobs and manage your hiring.
      </Text>

      <View style={styles.employerBanner}>
        <View style={styles.bannerIcon}>
          <Text style={styles.bannerIconText}>✓</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Employer account</Text>
          <Text style={styles.bannerText}>Your account will be created with employer access.</Text>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Company / business name *</Text>
        <TextInput
          value={form.companyName}
          onChangeText={(value) => update('companyName', value)}
          placeholder="e.g. Avive Catering"
          placeholderTextColor={BrandColors.muted}
          style={styles.input}
        />
      </View>

      {(
        [
          ['firstName', 'First name', true],
          ['lastName', 'Last name', false],
          ['phone', 'Mobile number', true],
          ['email', 'Email', true],
          ['password', 'Password', true],
        ] as const
      ).map(([key, label, required]) => (
        <View key={key} style={styles.field}>
          <Text style={styles.label}>
            {label}
            {required ? ' *' : ''}
          </Text>
          <TextInput
            value={form[key]}
            onChangeText={(value) => update(key, value)}
            placeholder={label}
            placeholderTextColor={BrandColors.muted}
            secureTextEntry={key === 'password'}
            keyboardType={
              key === 'phone' ? 'phone-pad' : key === 'email' ? 'email-address' : 'default'
            }
            autoCapitalize={
              key === 'email' || key === 'password' ? 'none' : 'words'
            }
            style={styles.input}
          />
        </View>
      ))}

      <View style={styles.otpHint}>
        <Text style={styles.otpIcon}>✓</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.otpTitle}>Mobile verification</Text>
          <Text style={styles.otpText}>
            We will send a 6-digit OTP to verify this mobile number.
          </Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.pressed,
          loading && styles.disabled,
        ]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={BrandColors.white} />
        ) : (
          <>
            <Text style={styles.primaryText}>Continue & send OTP</Text>
            <Text style={styles.arrow}>→</Text>
          </>
        )}
      </Pressable>

      <Pressable onPress={() => router.back()} style={styles.linkButton}>
        <Text style={styles.linkText}>Already have an account? Sign in</Text>
      </Pressable>

      <View style={styles.security}>
        <Text style={styles.securityIcon}>✓</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.securityTitle}>Safe. Secure. Reliable.</Text>
          <Text style={styles.securityText}>Your data is protected with industry-leading security.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: BrandColors.background,
    padding: 20,
    paddingTop: 42,
    paddingBottom: 40,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: BrandColors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  brandMarkText: {
    color: '#F4B942',
    fontSize: 29,
    fontWeight: '900',
  },
  brandName: {
    color: BrandColors.text,
    fontSize: 21,
    fontWeight: '900',
  },
  brandTagline: {
    color: BrandColors.muted,
    fontSize: 10,
    marginTop: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.7,
    color: BrandColors.indigo,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '900',
    color: BrandColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: BrandColors.textSecondary,
    marginBottom: 18,
  },
  employerBanner: {
    minHeight: 66,
    borderRadius: 17,
    backgroundColor: BrandColors.skySoft,
    borderWidth: 1,
    borderColor: BrandColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    marginBottom: 19,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: BrandColors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bannerIconText: {
    color: BrandColors.white,
    fontSize: 19,
    fontWeight: '900',
  },
  bannerTitle: {
    color: BrandColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  bannerText: {
    color: BrandColors.textSecondary,
    fontSize: 9,
    marginTop: 2,
  },
  field: {
    marginBottom: 13,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandColors.text,
    marginBottom: 7,
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 14,
    backgroundColor: BrandColors.surfaceLight,
    paddingHorizontal: 15,
    fontSize: 14,
    color: BrandColors.text,
  },
  otpHint: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: BrandColors.skySoft,
    borderRadius: 14,
    padding: 12,
    marginTop: 2,
    marginBottom: 15,
  },
  otpIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BrandColors.white,
    color: BrandColors.indigo,
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: '900',
    marginRight: 10,
  },
  otpTitle: {
    color: BrandColors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  otpText: {
    color: BrandColors.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 2,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: BrandColors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: BrandColors.indigo,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  primaryText: {
    color: BrandColors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  arrow: {
    color: BrandColors.white,
    position: 'absolute',
    right: 19,
    fontSize: 25,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 17,
  },
  linkText: {
    color: BrandColors.indigo,
    fontSize: 13,
    fontWeight: '800',
  },
  security: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: BrandColors.border,
  },
  securityIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: BrandColors.skySoft,
    color: BrandColors.indigo,
    textAlign: 'center',
    lineHeight: 36,
    fontWeight: '900',
    marginRight: 10,
  },
  securityTitle: {
    color: BrandColors.text,
    fontSize: 11,
    fontWeight: '900',
  },
  securityText: {
    color: BrandColors.muted,
    fontSize: 9,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
});
