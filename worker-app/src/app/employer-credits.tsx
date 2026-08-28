import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { BrandColors } from '../constants/theme';
import { api } from '../api/client';

type CreditPackage = { id: string; code: string; name: string; credits: number; priceInr: number; isActive: boolean };

declare global { interface Window { Razorpay?: any; } }

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

export default function EmployerCredits() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  const load = useCallback(async () => {
    try {
      const [balanceResponse, packagesResponse] = await Promise.all([
        api.get('/credits/balance'),
        api.get<CreditPackage[]>('/credits/packages'),
      ]);
      setBalance(Number(balanceResponse.data?.balance || 0));
      setPackages(packagesResponse.data || []);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const buy = async (creditPackage: CreditPackage) => {
    if (buying) return;
    try {
      setBuying(true);
      const { data: order } = await api.post('/credits/orders', { credits: creditPackage.credits });
      const completePayment = async (payment: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        await api.post('/credits/verify', {
          orderId: payment.razorpay_order_id,
          paymentId: payment.razorpay_payment_id,
          signature: payment.razorpay_signature,
        });
        await load();
        Alert.alert('Credits added', `${creditPackage.credits} credits were added to your wallet.`);
      };

      if (Platform.OS === 'web') {
        const Razorpay = await loadRazorpayWebCheckout();
        const checkout = new Razorpay({
          key: order.keyId,
          amount: String(order.amount),
          currency: order.currency,
          name: 'WorkTrust',
          description: `${creditPackage.name} - ${creditPackage.credits} credits`,
          order_id: order.orderId,
          theme: { color: '#F7B93E' },
          modal: { confirm_close: true, escape: true },
          handler: async (response: any) => {
            try { await completePayment(response); }
            catch (e: any) { Alert.alert('Payment verification failed', e?.response?.data?.message ?? 'Please contact support if money was deducted.'); }
            finally { setBuying(false); }
          },
        });
        checkout.open();
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const RazorpayCheckout = require('react-native-razorpay').default;
      const response = await RazorpayCheckout.open({
        description: `${creditPackage.name} - ${creditPackage.credits} credits`,
        currency: order.currency,
        key: order.keyId,
        amount: String(order.amount),
        name: 'WorkTrust',
        order_id: order.orderId,
        theme: { color: '#F7B93E' },
      });
      await completePayment(response);
    } catch (e: any) {
      if (e?.code === 2 || e?.description === 'Payment cancelled') Alert.alert('Payment cancelled', 'No credits were deducted.');
      else Alert.alert('Buy credits', e?.response?.data?.message ?? e?.description ?? e?.message ?? 'Unable to complete payment.');
    } finally {
      if (Platform.OS !== 'web') setBuying(false);
    }
  };

  return <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹  Back</Text></Pressable>
    <Text style={styles.eyebrow}>EMPLOYER WALLET</Text>
    <Text style={styles.title}>My Credits</Text>
    <Text style={styles.subtitle}>Use credits to unlock worker contact details.</Text>
    <View style={styles.balanceCard}>
      <Text style={styles.balanceLabel}>AVAILABLE CREDITS</Text>
      {loading ? <ActivityIndicator color={BrandColors.gold} /> : <Text style={styles.balance}>{balance}</Text>}
      <Text style={styles.balanceHint}>1 credit unlocks one worker contact</Text>
    </View>
    <Text style={styles.section}>Buy Credits</Text>
    {packages.map((p, index) => <View key={p.code} style={styles.package}>
      <View style={styles.packageCopy}>
        {index === 1 && <Text style={styles.popular}>MOST POPULAR</Text>}
        <Text style={styles.packageTitle}>{p.name}</Text>
        <Text style={styles.packageCredits}>{p.credits} credits</Text>
        <Text style={styles.packagePrice}>₹{Number(p.priceInr).toLocaleString('en-IN')}</Text>
      </View>
      <Pressable disabled={buying} onPress={() => buy(p)} style={[styles.buy, buying && styles.disabled]}><Text style={styles.buyText}>{buying ? '...' : 'Buy'}</Text></Pressable>
    </View>)}
    {!loading && !packages.length && <Text style={styles.muted}>Credit packages are currently unavailable.</Text>}
    <Pressable style={styles.history} onPress={() => router.push('/credit-history')}><Text style={styles.historyText}>View credit history →</Text></Pressable>
  </ScrollView>;
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:BrandColors.background},content:{padding:20,paddingBottom:60},back:{color:BrandColors.gold,fontSize:14,fontWeight:'800',marginBottom:24},eyebrow:{color:BrandColors.gold,fontSize:10,fontWeight:'900',letterSpacing:1.7},title:{color:BrandColors.text,fontSize:30,fontWeight:'900',marginTop:5},subtitle:{color:BrandColors.textSecondary,fontSize:13,lineHeight:20,marginTop:5},balanceCard:{marginTop:22,padding:22,borderRadius:20,backgroundColor:BrandColors.slateSoft,borderWidth:1,borderColor:BrandColors.gold},balanceLabel:{color:BrandColors.textSecondary,fontSize:10,fontWeight:'900',letterSpacing:1.2},balance:{color:BrandColors.gold,fontSize:48,fontWeight:'900',marginTop:5},balanceHint:{color:BrandColors.textSecondary,fontSize:11,marginTop:2},section:{color:BrandColors.text,fontSize:19,fontWeight:'900',marginTop:28,marginBottom:12},package:{flexDirection:'row',alignItems:'center',padding:16,borderRadius:17,backgroundColor:BrandColors.slateSoft,borderWidth:1,borderColor:BrandColors.slateBorder,marginBottom:10},packageCopy:{flex:1},popular:{color:BrandColors.gold,fontSize:8,fontWeight:'900',letterSpacing:1},packageTitle:{color:BrandColors.text,fontSize:16,fontWeight:'900',marginTop:2},packageCredits:{color:BrandColors.textSecondary,fontSize:11,marginTop:2},packagePrice:{color:BrandColors.text,fontSize:18,fontWeight:'900',marginTop:5},buy:{backgroundColor:BrandColors.gold,borderRadius:12,paddingHorizontal:20,paddingVertical:12},buyText:{color:BrandColors.slate,fontWeight:'900'},disabled:{opacity:0.55},history:{alignItems:'center',padding:20},historyText:{color:BrandColors.gold,fontSize:13,fontWeight:'800'},muted:{color:BrandColors.muted,fontSize:11,textAlign:'center',marginTop:16}
});
