import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { requestRegistrationOtp, verifyRegistrationOtp, MobileRole } from '@/api/auth';
import { BrandColors } from '@/constants/theme';

export default function RegisterOtpScreen() {
  const params = useLocalSearchParams<{ phone?: string; role?: string; devOtp?: string }>();
  const phone = String(params.phone ?? '');
  const role: MobileRole = params.role === 'EMPLOYER' ? 'EMPLOYER' : 'WORKER';
  const devOtp = String(params.devOtp ?? '');
  const [otp, setOtp] = useState(devOtp);
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(300);

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
      const response = await verifyRegistrationOtp(phone, otp.trim());
      Alert.alert(
        'Mobile verified',
        response.message,
        [{ text: 'Continue to sign in', onPress: () => router.replace({ pathname: '/login', params: { role } }) }],
      );
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert('Verification failed', Array.isArray(message) ? message.join('\n') : message ?? 'Unable to verify OTP.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    Alert.alert('Resend OTP', 'Return to registration to review your details and request a new OTP.');
    router.replace('/register');
  }

  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remaining = (seconds % 60).toString().padStart(2, '0');

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
      <View style={styles.brandMark}><Text style={styles.brandMarkText}>W</Text></View>
      <Text style={styles.eyebrow}>VERIFY MOBILE</Text>
      <Text style={styles.title}>Enter your OTP</Text>
      <Text style={styles.subtitle}>We sent a 6-digit verification code to</Text>
      <Text style={styles.phone}>{phone}</Text>
      <Text style={styles.role}>Registering as {role === 'EMPLOYER' ? 'Employer' : 'Worker'}</Text>

      <TextInput
        value={otp}
        onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="000000"
        placeholderTextColor={BrandColors.muted}
        style={styles.otpInput}
        textAlign="center"
        autoFocus
      />

      {devOtp && <Text style={styles.devOtp}>Development OTP: {devOtp}</Text>}

      <Text style={styles.timer}>{seconds > 0 ? `Code expires in ${minutes}:${remaining}` : 'Code expired'}</Text>

      <Pressable onPress={handleVerify} disabled={loading} style={[styles.primary, loading && styles.disabled]}>
        {loading ? <ActivityIndicator color={BrandColors.slate} /> : <Text style={styles.primaryText}>Verify & continue</Text>}
      </Pressable>

      <Pressable onPress={handleResend} style={styles.resend}><Text style={styles.resendText}>Didn't receive the code? Request again</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background, padding: 28, paddingTop: 54 },
  back: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: BrandColors.slateBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  backText: { color: BrandColors.gold, fontSize: 30, lineHeight: 32 },
  brandMark: { width: 52, height: 52, borderRadius: 16, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  brandMarkText: { color: BrandColors.slate, fontSize: 25, fontWeight: '900' },
  eyebrow: { color: BrandColors.gold, fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 10 },
  title: { color: BrandColors.text, fontSize: 32, fontWeight: '900', marginBottom: 10 },
  subtitle: { color: BrandColors.textSecondary, fontSize: 14, lineHeight: 21 },
  phone: { color: BrandColors.text, fontSize: 16, fontWeight: '900', marginTop: 4 },
  role: { color: BrandColors.gold, fontSize: 12, fontWeight: '800', marginTop: 10, marginBottom: 24 },
  otpInput: { height: 64, borderWidth: 1, borderColor: BrandColors.gold, borderRadius: 16, backgroundColor: BrandColors.slate, color: BrandColors.text, fontSize: 28, fontWeight: '900', letterSpacing: 10 },
  devOtp: { color: BrandColors.gold, fontSize: 12, fontWeight: '800', textAlign: 'center', marginTop: 10 },
  timer: { color: BrandColors.muted, fontSize: 12, textAlign: 'center', marginVertical: 18 },
  primary: { height: 56, borderRadius: 15, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: BrandColors.slate, fontSize: 16, fontWeight: '900' },
  resend: { alignItems: 'center', paddingVertical: 20 },
  resendText: { color: BrandColors.gold, fontSize: 13, fontWeight: '800' },
  disabled: { opacity: 0.6 },
});
