import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  createJobPublishPaymentOrder,
  verifyJobPublishPayment,
  EmployerJobPaymentOrder,
} from '@/api/employer-jobs';
import { BrandColors } from '@/constants/theme';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

async function loadRazorpayWebCheckout() {
  if (typeof window === 'undefined') throw new Error('Web payment is unavailable here.');
  if (window.Razorpay) return window.Razorpay;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-razorpay-checkout]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Unable to load Razorpay checkout.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpayCheckout = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load Razorpay checkout.'));
    document.body.appendChild(script);
  });

  if (!window.Razorpay) throw new Error('Razorpay checkout is unavailable.');
  return window.Razorpay;
}

export default function EmployerPaymentMethodScreen() {
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [order, setOrder] = useState<EmployerJobPaymentOrder | null>(null);

  const load = useCallback(async () => {
    if (!jobId) {
      setChecking(false);
      return;
    }

    try {
      const created = await createJobPublishPaymentOrder(String(jobId));
      setOrder(created);
    } catch (e: any) {
      Alert.alert('Unable to start payment', e?.response?.data?.message ?? 'Please try again.');
    } finally {
      setChecking(false);
    }
  }, [jobId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function completePayment(result: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
    if (!jobId) return;
    await verifyJobPublishPayment(String(jobId), result);
    Alert.alert('Payment successful', 'Payment verified and your job is now published.', [
      { text: 'View job', onPress: () => router.replace({ pathname: '/employer-job-details', params: { id: String(jobId) } }) },
    ]);
  }

  async function pay() {
    if (!jobId || !order || loading) return;

    try {
      setLoading(true);

      if (Platform.OS === 'web') {
        const Razorpay = await loadRazorpayWebCheckout();
        const checkout = new Razorpay({
          key: order.keyId,
          amount: String(order.amount),
          currency: order.currency,
          name: 'WorkTrust',
          description: `Publish job: ${order.jobTitle}`,
          order_id: order.orderId,
          theme: { color: '#F7B93E' },
          modal: { confirm_close: true, escape: true },
          handler: async (response: any) => {
            try {
              await completePayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
            } catch (e: any) {
              Alert.alert('Payment verification failed', e?.response?.data?.message ?? 'Please contact support if money was deducted.');
            } finally {
              setLoading(false);
            }
          },
        });
        checkout.open();
        return;
      }

      // Native Android/iOS uses Razorpay's official React Native SDK.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const RazorpayCheckout = require('react-native-razorpay').default;
      const response = await RazorpayCheckout.open({
        description: `Publish job: ${order.jobTitle}`,
        currency: order.currency,
        key: order.keyId,
        amount: String(order.amount),
        name: 'WorkTrust',
        order_id: order.orderId,
        theme: { color: '#F7B93E' },
      });

      await completePayment({
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      });
    } catch (e: any) {
      if (e?.code === 2 || e?.description === 'Payment cancelled') {
        Alert.alert('Payment cancelled', 'Your job remains in draft.');
      } else {
        Alert.alert('Payment failed', e?.response?.data?.message ?? e?.description ?? e?.message ?? 'Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return <SafeAreaView style={styles.container}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>EMPLOYER</Text>
          <Text style={styles.title}>Payment to publish</Text>
          <Text style={styles.subtitle}>Complete the secure payment to make your job visible to workers.</Text>
        </View>
      </View>

      {checking ? <View style={styles.loading}><ActivityIndicator color={BrandColors.gold} /><Text style={styles.loadingText}>Preparing secure checkout…</Text></View> : !jobId ? <View style={styles.card}><Text style={styles.sectionTitle}>No job selected</Text><Text style={styles.note}>Return to a draft job and choose Publish Job again.</Text></View> : order ? <>
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>JOB PUBLISHING FEE</Text>
          <Text style={styles.amount}>₹{order.amountInr.toLocaleString('en-IN')}</Text>
          <Text style={styles.jobTitle}>{order.jobTitle}</Text>
          <Text style={styles.note}>Payment is processed securely by Razorpay. WorkTrust does not store card numbers, CVV or UPI credentials.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Secure payment</Text>
          <Text style={styles.note}>Choose UPI, card, net banking or another method available in your Razorpay checkout.</Text>
          <Pressable disabled={loading} onPress={pay} style={[styles.primary, loading && styles.disabled]}>
            {loading ? <ActivityIndicator color={BrandColors.slate} /> : <Text style={styles.primaryText}>Pay ₹{order.amountInr.toLocaleString('en-IN')} & Publish</Text>}
          </Pressable>
        </View>
      </> : null}

      <Text style={styles.security}>Safe. Secure. Verified payment.</Text>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background },
  content: { padding: 18, paddingBottom: 32 },
  header: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 18 },
  back: { color: BrandColors.gold, fontSize: 36, lineHeight: 32 },
  headerCopy: { flex: 1 },
  eyebrow: { color: BrandColors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: BrandColors.text, fontSize: 27, fontWeight: '900', marginTop: 3 },
  subtitle: { color: BrandColors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 5 },
  loading: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { color: BrandColors.textSecondary, marginTop: 10, fontSize: 12 },
  summary: { backgroundColor: BrandColors.slateSoft, borderColor: BrandColors.gold, borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 14 },
  summaryLabel: { color: BrandColors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  amount: { color: BrandColors.text, fontSize: 32, fontWeight: '900', marginTop: 7 },
  jobTitle: { color: BrandColors.text, fontSize: 15, fontWeight: '800', marginTop: 5 },
  card: { backgroundColor: BrandColors.slateSoft, borderColor: BrandColors.slateBorder, borderWidth: 1, borderRadius: 18, padding: 16 },
  sectionTitle: { color: BrandColors.text, fontSize: 16, fontWeight: '900' },
  note: { color: BrandColors.textSecondary, fontSize: 11, lineHeight: 17, marginTop: 7 },
  primary: { marginTop: 18, minHeight: 54, borderRadius: 14, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  primaryText: { color: BrandColors.slate, fontWeight: '900', fontSize: 15 },
  disabled: { opacity: 0.55 },
  security: { color: BrandColors.muted, textAlign: 'center', fontSize: 10, marginTop: 18 },
});
