import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { verifyLoginOtp, requestLoginOtp } from '@/api/auth';
import { BrandColors } from '@/constants/theme';
import { WORKTRUST_OTP_HERO_IMAGE } from '@/constants/worktrust-otp-hero';
import { useAuthStore } from '@/store/auth';

export default function LoginOtpScreen() {
  const params = useLocalSearchParams<{ phone?: string; devOtp?: string }>();
  const phone = String(params.phone ?? '');
  const role = 'EMPLOYER';
  const [otp, setOtp] = useState(String(params.devOtp ?? ''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(300);
  const inputRef = useRef<TextInput>(null);
  const setSession = useAuthStore((state) => state.setSession);
  const setActiveRole = useAuthStore((state) => state.setActiveRole);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((value) => (value > 0 ? value - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  async function handleVerify() {
    if (!/^\d{6}$/.test(otp.trim())) {
      Alert.alert('Invalid OTP', 'Enter the 6-digit OTP sent to your mobile number.');
      return;
    }
    try {
      setLoading(true);
      const response = await verifyLoginOtp(phone, otp.trim(), role);
      setSession(response.accessToken, response.user, response.worker, response.employer);
      setActiveRole('EMPLOYER');
      router.replace('/employer-home');
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert('Verification failed', Array.isArray(message) ? message.join('\n') : message ?? 'Unable to verify OTP.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (seconds > 240 || resending) return;
    try {
      setResending(true);
      const response = await requestLoginOtp(phone, role);
      setOtp(String(response.devOtp ?? ''));
      setSeconds(response.expiresInSeconds ?? 300);
      Alert.alert('OTP sent', 'A new verification code has been sent to your mobile number.');
    } catch (error: any) {
      Alert.alert('Unable to resend', error?.response?.data?.message ?? 'Please try again later.');
    } finally {
      setResending(false);
    }
  }

  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remaining = (seconds % 60).toString().padStart(2, '0');
  const digits = Array.from({ length: 6 }, (_, index) => otp[index] ?? '');

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityLabel="Go back">
          <Text style={styles.backText}>‹</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>W</Text>
          </View>
          <Text style={styles.brand}>WORKTRUST</Text>
          <Text style={styles.title}>Enter your OTP</Text>
          <Text style={styles.subtitle}>We’ve sent a 6-digit verification code to</Text>
          <View style={styles.phoneRow}>
            <View style={styles.phoneIcon}><Text style={styles.phoneIconText}>▯</Text></View>
            <Text style={styles.phone}>{phone}</Text>
            <View style={styles.verifiedDot}><Text style={styles.verifiedDotText}>✓</Text></View>
          </View>
          <View style={styles.rolePill}>
            <Text style={styles.roleIcon}>▣</Text>
            <Text style={styles.role}>Signing in as Employer</Text>
          </View>
        </View>
        <Image source={{ uri: WORKTRUST_OTP_HERO_IMAGE }} style={styles.heroImage} resizeMode="contain" />
      </View>

      <View style={styles.otpCard}>
        <Text style={styles.otpLabel}>Enter 6-digit code</Text>
        <Pressable style={styles.otpBoxes} onPress={() => inputRef.current?.focus()}>
          {digits.map((digit, index) => (
            <View key={index} style={[styles.otpBox, index === Math.min(otp.length, 5) && styles.otpBoxActive]}>
              <Text style={[styles.otpDigit, !digit && styles.otpPlaceholder]}>{digit || '—'}</Text>
            </View>
          ))}
        </Pressable>
        <TextInput
          ref={inputRef}
          value={otp}
          onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          style={styles.hiddenInput}
          accessibilityLabel="6 digit OTP"
        />
        <View style={styles.securityCard}>
          <View style={styles.securityIcon}><Text style={styles.securityIconText}>✓</Text></View>
          <View style={styles.securityCopy}>
            <Text style={styles.securityTitle}>For your security, never share your OTP</Text>
            <Text style={styles.securitySubtitle}>WorkTrust will never call you to ask for OTP</Text>
          </View>
        </View>
      </View>

      {params.devOtp ? (
        <View style={styles.devRow}>
          <View style={styles.devLine} />
          <Text style={styles.devOtp}>Development OTP: {params.devOtp}</Text>
          <View style={styles.devLine} />
        </View>
      ) : null}

      <Text style={styles.timer}>{seconds > 0 ? <>Code expires in <Text style={styles.timerStrong}>{minutes}:{remaining}</Text></> : 'Code expired'}</Text>

      <Pressable onPress={handleVerify} disabled={loading} style={[styles.primary, loading && styles.disabled]}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <View style={styles.primaryShield}><Text style={styles.primaryShieldText}>✓</Text></View>
            <Text style={styles.primaryText}>Verify & sign in</Text>
            <Text style={styles.arrow}>→</Text>
          </>
        )}
      </Pressable>

      <View style={styles.resendCard}>
        <View style={styles.resendIcon}><Text style={styles.resendIconText}>◷</Text></View>
        <Text style={styles.resendText}>{resending ? 'Sending…' : seconds > 240 ? <>Resend available in <Text style={styles.resendStrong}>{Math.ceil((seconds - 240) / 60)}:00</Text></> : 'Resend OTP'}</Text>
        {seconds <= 240 && !resending ? <Pressable onPress={handleResend}><Text style={styles.resendLink}>Resend</Text></Pressable> : null}
      </View>

      <View style={styles.helpCard}>
        <View style={styles.helpIcon}><Text style={styles.helpIconText}>◉</Text></View>
        <View style={styles.helpCopy}>
          <Text style={styles.helpTitle}>Didn’t receive the code?</Text>
          <Text style={styles.helpSubtitle}>Check your SMS spam folder or resend the OTP</Text>
        </View>
        <Text style={styles.helpArrow}>›</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 36 },
  topBar: { height: 46, justifyContent: 'center' },
  back: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE8F8', alignItems: 'center', justifyContent: 'center' },
  backText: { color: BrandColors.text, fontSize: 32, lineHeight: 34, marginTop: -3 },
  hero: { minHeight: 340, position: 'relative', overflow: 'hidden' },
  heroCopy: { width: '67%', zIndex: 2, paddingTop: 20 },
  brandMark: { width: 58, height: 58, borderRadius: 15, backgroundColor: BrandColors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  brandMarkText: { color: '#FFFFFF', fontSize: 31, fontWeight: '900' },
  brand: { color: BrandColors.primary, fontSize: 19, fontWeight: '900', letterSpacing: 2.2, marginBottom: 18 },
  title: { color: BrandColors.text, fontSize: 35, lineHeight: 41, fontWeight: '900', marginBottom: 12 },
  subtitle: { color: BrandColors.textSecondary, fontSize: 15, lineHeight: 22, maxWidth: 280 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  phoneIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EAF3FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  phoneIconText: { color: BrandColors.primary, fontSize: 25, fontWeight: '800' },
  phone: { color: BrandColors.text, fontSize: 18, fontWeight: '900' },
  verifiedDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#35B77A', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  verifiedDotText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  rolePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAF3FF', borderRadius: 24, paddingHorizontal: 14, paddingVertical: 10, marginTop: 14 },
  roleIcon: { color: BrandColors.primary, fontSize: 17, marginRight: 8 },
  role: { color: BrandColors.primary, fontSize: 14, fontWeight: '800' },
  heroImage: { position: 'absolute', right: -35, top: -8, width: 245, height: 285, opacity: 0.96 },
  otpCard: { borderWidth: 1, borderColor: '#DDE8F5', borderRadius: 22, padding: 18, backgroundColor: '#FFFFFF', shadowColor: '#0B2A5B', shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  otpLabel: { color: BrandColors.textSecondary, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 18 },
  otpBoxes: { flexDirection: 'row', justifyContent: 'space-between' },
  otpBox: { width: 43, height: 62, borderRadius: 15, borderWidth: 1.5, borderColor: '#E0E7F0', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  otpBoxActive: { borderColor: BrandColors.primary, borderWidth: 2, shadowColor: BrandColors.primary, shadowOpacity: 0.14, shadowRadius: 7, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  otpDigit: { color: BrandColors.text, fontSize: 25, fontWeight: '900' },
  otpPlaceholder: { color: '#B6BCC4', fontWeight: '500' },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0, left: 0, top: 0 },
  securityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF6FF', borderRadius: 18, padding: 15, marginTop: 20 },
  securityIcon: { width: 45, height: 45, borderRadius: 23, borderWidth: 2, borderColor: BrandColors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  securityIconText: { color: BrandColors.primary, fontSize: 22, fontWeight: '900' },
  securityCopy: { flex: 1 },
  securityTitle: { color: BrandColors.text, fontSize: 14, fontWeight: '800', marginBottom: 4 },
  securitySubtitle: { color: BrandColors.textSecondary, fontSize: 12, lineHeight: 17 },
  devRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  devLine: { flex: 1, height: 1, backgroundColor: '#DCE5F0' },
  devOtp: { color: BrandColors.primary, fontSize: 13, fontWeight: '800', marginHorizontal: 10 },
  timer: { color: BrandColors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 13, marginBottom: 18 },
  timerStrong: { color: BrandColors.primary, fontWeight: '900' },
  primary: { height: 62, borderRadius: 20, backgroundColor: BrandColors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', shadowColor: BrandColors.primary, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 5 },
  primaryShield: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  primaryShieldText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  primaryText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  arrow: { color: '#FFFFFF', position: 'absolute', right: 20, fontSize: 28, fontWeight: '400' },
  disabled: { opacity: 0.6 },
  resendCard: { minHeight: 58, backgroundColor: '#F1F7FF', borderRadius: 18, marginTop: 18, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  resendIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: BrandColors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  resendIconText: { color: BrandColors.primary, fontSize: 23 },
  resendText: { flex: 1, color: BrandColors.text, fontSize: 14, fontWeight: '700' },
  resendStrong: { color: BrandColors.primary, fontWeight: '900' },
  resendLink: { color: BrandColors.primary, fontWeight: '900', fontSize: 14 },
  helpCard: { minHeight: 80, borderWidth: 1, borderColor: '#E0E7F0', borderRadius: 18, marginTop: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  helpIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EAF3FF', borderWidth: 1, borderColor: '#C7DCFA', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  helpIconText: { color: BrandColors.primary, fontSize: 20 },
  helpCopy: { flex: 1 },
  helpTitle: { color: BrandColors.text, fontSize: 15, fontWeight: '800', marginBottom: 4 },
  helpSubtitle: { color: BrandColors.textSecondary, fontSize: 12, lineHeight: 17 },
  helpArrow: { color: BrandColors.textSecondary, fontSize: 30, marginLeft: 8 },
});
