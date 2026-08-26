import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { verifyRegistrationOtp } from '@/api/auth';
import { BrandColors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

export default function RegisterOtpScreen() {
  const params = useLocalSearchParams<{ phone?: string; role?: string; devOtp?: string }>();
  const phone = String(params.phone ?? '');
  const role = params.role === 'EMPLOYER' ? 'EMPLOYER' : 'WORKER';
  const [otp, setOtp] = useState(String(params.devOtp ?? ''));
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(300);
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
      const response = await verifyRegistrationOtp(phone, otp.trim());
      setSession(response.accessToken, response.user, response.worker, response.employer);
      setActiveRole(response.activeRole ?? role);

      // Registration is complete: keep the verified session and open the selected dashboard immediately.
      router.replace(role === 'EMPLOYER' ? '/employer-home' : '/home');
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert('Verification failed', Array.isArray(message) ? message.join('\n') : message ?? 'Unable to verify OTP.');
    } finally {
      setLoading(false);
    }
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

      {params.devOtp ? <Text style={styles.devOtp}>Development OTP: {params.devOtp}</Text> : null}
      <Text style={styles.timer}>{seconds > 0 ? `Code expires in ${minutes}:${remaining}` : 'Code expired'}</Text>

      <Pressable onPress={handleVerify} disabled={loading} style={[styles.primary, loading && styles.disabled]}>
        {loading ? <ActivityIndicator color={BrandColors.slate} /> : <><Text style={styles.primaryText}>Verify & continue</Text><Text style={styles.arrow}>→</Text></>}
      </Pressable>

      <Text style={styles.resend}>Didn't receive the code? Request again</Text>
      <View style={styles.info}>
        <Text style={styles.infoIcon}>✓</Text>
        <View style={styles.infoCopy}>
          <Text style={styles.infoTitle}>Instant account activation</Text>
          <Text style={styles.infoText}>After successful OTP verification, WorkTrust signs you in automatically and opens your selected dashboard.</Text>
        </View>
      </View>
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
  primary: { height: 56, borderRadius: 15, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  primaryText: { color: BrandColors.slate, fontSize: 16, fontWeight: '900' },
  arrow: { color: BrandColors.slate, position: 'absolute', right: 20, fontSize: 26 },
  resend: { color: BrandColors.gold, textAlign: 'center', fontSize: 13, fontWeight: '800', marginTop: 20 },
  info: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: BrandColors.slateBorder, marginTop: 26, paddingTop: 18 },
  infoIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: BrandColors.goldSoft, color: BrandColors.gold, textAlign: 'center', lineHeight: 38, fontWeight: '900', marginRight: 10 },
  infoCopy: { flex: 1 },
  infoTitle: { color: BrandColors.text, fontSize: 12, fontWeight: '900' },
  infoText: { color: BrandColors.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  disabled: { opacity: 0.6 },
});
