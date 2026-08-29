import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { login, requestLoginOtp } from '@/api/auth';
import { setAccessToken } from '@/api/client';
import { BrandColors } from '@/constants/theme';
import { WORKTRUST_HERO_IMAGE } from '@/constants/worktrust-hero';
import { useAuthStore } from '@/store/auth';

const EMPLOYER_ROLE = 'EMPLOYER' as const;

export default function LoginScreen() {
  const { height } = useWindowDimensions();
  const setSession = useAuthStore((state) => state.setSession);
  const setActiveRole = useAuthStore((state) => state.setActiveRole);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  async function finishLogin(response: any) {
    setAccessToken(response.accessToken);
    setSession(response.accessToken, response.user, response.worker, response.employer);
    setActiveRole(EMPLOYER_ROLE);

    if (response.activeRole === 'EMPLOYER' || response.employer) {
      router.replace('/employer-home');
      return;
    }

    Alert.alert(
      'Employer access required',
      'This mobile app currently provides employer access only. Please contact support if your account should have employer access.',
    );
  }

  async function handleLogin() {
    if (!identifier.trim() || !password) {
      Alert.alert('Missing information', 'Enter your mobile number or email and password.');
      return;
    }

    try {
      setLoading(true);
      const response = await login(identifier.trim(), password, EMPLOYER_ROLE);
      await finishLogin(response);
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert(
        'Login failed',
        Array.isArray(message) ? message.join('\n') : message ?? 'Unable to connect to the authentication service.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpLogin() {
    const phone = identifier.trim();
    if (!/^\+?[0-9]{10,15}$/.test(phone.replace(/[\s-]/g, ''))) {
      Alert.alert('Mobile number required', 'Enter a valid mobile number to receive an OTP.');
      return;
    }

    try {
      setOtpLoading(true);
      const response = await requestLoginOtp(phone, EMPLOYER_ROLE);
      router.push({
        pathname: '/login-otp',
        params: { phone, role: EMPLOYER_ROLE, devOtp: response.devOtp ?? '' },
      });
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert(
        'Unable to send OTP',
        Array.isArray(message) ? message.join('\n') : message ?? 'Unable to send OTP.',
      );
    } finally {
      setOtpLoading(false);
    }
  }

  const heroHeight = Math.min(410, Math.max(300, height * 0.43));

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
          <View style={styles.heroBrand}>
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>W</Text>
            </View>
            <Text style={styles.brandName}>WorkTrust</Text>
            <Text style={styles.brandTagline}>Verified people. Trusted work.</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Hire with confidence.</Text>
            <Text style={styles.heroSubtitle}>
              Find verified professionals and manage your workforce faster.
            </Text>
          </View>
          <View style={styles.heroBenefits}>
            <View style={styles.benefit}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>Verified</Text>
            </View>
            <View style={styles.benefitDivider} />
            <View style={styles.benefit}>
              <Text style={styles.benefitIcon}>◆</Text>
              <Text style={styles.benefitText}>Reliable</Text>
            </View>
            <View style={styles.benefitDivider} />
            <View style={styles.benefit}>
              <Text style={styles.benefitIcon}>→</Text>
              <Text style={styles.benefitText}>Fast hiring</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardAccent} />
          <Text style={styles.welcome}>Welcome back! 👋</Text>
          <Text style={styles.title}>Sign in to your account</Text>
          <Text style={styles.subtitle}>
            Continue to your employer dashboard and manage your hiring.
          </Text>

          <View style={styles.employerBadge}>
            <View style={styles.employerIcon}>
              <Text style={styles.employerIconText}>▣</Text>
            </View>
            <View style={styles.employerCopy}>
              <Text style={styles.employerTitle}>Employer account</Text>
              <Text style={styles.employerSubtitle}>Post jobs, find workers and hire faster</Text>
            </View>
            <View style={styles.employerCheck}>
              <Text style={styles.employerCheckText}>✓</Text>
            </View>
          </View>

          <Text style={styles.label}>Mobile number or email</Text>
          <View style={styles.inputWrap}>
            <View style={styles.inputIconCircle}>
              <Text style={styles.inputIcon}>⌕</Text>
            </View>
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="Enter mobile number or email"
              placeholderTextColor={BrandColors.muted}
              autoCapitalize="none"
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <View style={styles.inputIconCircle}>
              <Text style={styles.inputIcon}>⌑</Text>
            </View>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={BrandColors.muted}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <Pressable
            style={styles.forgot}
            onPress={() => Alert.alert('Forgot password', 'Password recovery will be available here.')}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => [
              styles.primary,
              pressed && styles.pressed,
              loading && styles.disabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={BrandColors.white} />
            ) : (
              <>
                <Text style={styles.primaryText}>Sign in to Employer Dashboard</Text>
                <Text style={styles.arrow}>→</Text>
              </>
            )}
          </Pressable>

          <View style={styles.or}>
            <View style={styles.line} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.line} />
          </View>

          <Pressable
            onPress={handleOtpLogin}
            disabled={otpLoading}
            style={({ pressed }) => [
              styles.otpButton,
              pressed && styles.pressed,
              otpLoading && styles.disabled,
            ]}
          >
            {otpLoading ? (
              <ActivityIndicator color={BrandColors.indigo} />
            ) : (
              <>
                <Text style={styles.otpIcon}>▣</Text>
                <Text style={styles.otpText}>Sign in with OTP</Text>
                <Text style={styles.otpArrow}>→</Text>
              </>
            )}
          </Pressable>

          <Pressable onPress={() => router.push('/register')} style={styles.create}>
            <Text style={styles.createText}>＋ Create an employer account</Text>
          </Pressable>

          <View style={styles.security}>
            <View style={styles.securityIcon}>
              <Text style={styles.securityIconText}>✓</Text>
            </View>
            <View style={styles.securityCopy}>
              <Text style={styles.securityTitle}>Safe. Secure. Reliable.</Text>
              <Text style={styles.securityText}>
                Your data is protected with industry-leading security.
              </Text>
            </View>
            <Text style={styles.lock}>⌑</Text>
          </View>
        </View>

        <Text style={styles.footer}>Built for employers who value trust.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  hero: {
    width: '100%',
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: BrandColors.navy,
    borderWidth: 1,
    borderColor: BrandColors.navy,
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 18, 45, 0.28)',
  },
  heroBrand: {
    alignItems: 'center',
    paddingTop: 24,
  },
  logoMark: {
    width: 52,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#F4B942',
    fontSize: 43,
    lineHeight: 43,
    fontWeight: '900',
  },
  brandName: {
    color: BrandColors.white,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandTagline: {
    color: '#E0F2FE',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  heroCopy: {
    paddingHorizontal: 24,
    marginTop: 28,
    maxWidth: 360,
  },
  heroTitle: {
    color: BrandColors.white,
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '900',
  },
  heroSubtitle: {
    color: '#D7EEFF',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    maxWidth: 285,
  },
  heroBenefits: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 18,
    height: 55,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.45)',
    backgroundColor: 'rgba(5, 28, 67, 0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  benefit: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitIcon: {
    color: BrandColors.sky,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  benefitText: {
    color: BrandColors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  benefitDivider: {
    width: 1,
    height: 25,
    backgroundColor: 'rgba(224, 242, 254, 0.25)',
  },
  card: {
    backgroundColor: BrandColors.white,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: BrandColors.border,
    paddingHorizontal: 19,
    paddingTop: 22,
    paddingBottom: 18,
    marginTop: -16,
    zIndex: 2,
    shadowColor: BrandColors.navy,
    shadowOpacity: 0.10,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 4,
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    backgroundColor: BrandColors.indigo,
  },
  welcome: {
    color: BrandColors.indigo,
    fontSize: 13,
    fontWeight: '900',
  },
  title: {
    color: BrandColors.text,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
    marginTop: 2,
  },
  subtitle: {
    color: BrandColors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    marginBottom: 14,
  },
  employerBadge: {
    minHeight: 66,
    borderRadius: 17,
    backgroundColor: BrandColors.skySoft,
    borderWidth: 1,
    borderColor: BrandColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    marginBottom: 17,
  },
  employerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: BrandColors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  employerIconText: {
    color: BrandColors.sky,
    fontSize: 19,
    fontWeight: '900',
  },
  employerCopy: {
    flex: 1,
  },
  employerTitle: {
    color: BrandColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  employerSubtitle: {
    color: BrandColors.textSecondary,
    fontSize: 9,
    marginTop: 2,
  },
  employerCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BrandColors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employerCheckText: {
    color: BrandColors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  label: {
    color: BrandColors.text,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 6,
  },
  inputWrap: {
    minHeight: 55,
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 15,
    backgroundColor: BrandColors.surfaceLight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 11,
  },
  inputIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: BrandColors.skySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  inputIcon: {
    color: BrandColors.indigo,
    fontSize: 19,
    fontWeight: '900',
  },
  input: {
    flex: 1,
    color: BrandColors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  forgot: {
    alignItems: 'flex-end',
    marginTop: -2,
    marginBottom: 15,
  },
  forgotText: {
    color: BrandColors.indigo,
    fontSize: 11,
    fontWeight: '900',
  },
  primary: {
    height: 56,
    borderRadius: 16,
    backgroundColor: BrandColors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: BrandColors.indigo,
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  primaryText: {
    color: BrandColors.white,
    fontSize: 15,
    fontWeight: '900',
  },
  arrow: {
    color: BrandColors.white,
    position: 'absolute',
    right: 18,
    fontSize: 25,
  },
  or: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 14,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: BrandColors.border,
  },
  orText: {
    color: BrandColors.muted,
    fontSize: 11,
  },
  otpButton: {
    height: 54,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: BrandColors.indigo,
    backgroundColor: BrandColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 11,
  },
  otpIcon: {
    color: BrandColors.indigo,
    fontSize: 16,
    marginRight: 8,
    fontWeight: '900',
  },
  otpText: {
    color: BrandColors.indigo,
    fontSize: 14,
    fontWeight: '900',
  },
  otpArrow: {
    color: BrandColors.indigo,
    position: 'absolute',
    right: 18,
    fontSize: 23,
  },
  create: {
    height: 51,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: BrandColors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: {
    color: BrandColors.indigo,
    fontSize: 13,
    fontWeight: '900',
  },
  security: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: BrandColors.border,
  },
  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: BrandColors.skySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  securityIconText: {
    color: BrandColors.indigo,
    fontSize: 20,
    fontWeight: '900',
  },
  securityCopy: {
    flex: 1,
  },
  securityTitle: {
    color: BrandColors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  securityText: {
    color: BrandColors.muted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 2,
  },
  lock: {
    color: BrandColors.indigo,
    fontSize: 19,
    marginLeft: 8,
  },
  footer: {
    color: BrandColors.muted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 14,
  },
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.6,
  },
});
