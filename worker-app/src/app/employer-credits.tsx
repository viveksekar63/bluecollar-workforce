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
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
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
          theme: { color: BrandColors.indigo },
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
        theme: { color: BrandColors.indigo },
      });
      await completePayment(response);
    } catch (e: any) {
      if (e?.code === 2 || e?.description === 'Payment cancelled') Alert.alert('Payment cancelled', 'No credits were deducted.');
      else Alert.alert('Buy credits', e?.response?.data?.message ?? e?.description ?? e?.message ?? 'Unable to complete payment.');
    } finally {
      if (Platform.OS !== 'web') setBuying(false);
    }
  };

  return <View style={styles.screen}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topHeader}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>EMPLOYER WALLET</Text>
          <Text style={styles.title}>My Credits</Text>
          <Text style={styles.subtitle}>Unlock trusted worker contacts when you need them.</Text>
        </View>
        <View style={styles.headerIcon}>
          <Text style={styles.creditGlyph}>▤</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.heroTopRow}>
          <View style={styles.heroIconCircle}>
            <Text style={styles.heroIcon}>▤</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>YOUR CREDIT BALANCE</Text>
            <Text style={styles.heroTitle}>Ready to hire?</Text>
          </View>
          <View style={styles.securePill}><Text style={styles.secureText}>SECURE</Text></View>
        </View>

        <View style={styles.balanceRow}>
          {loading ? <ActivityIndicator color={BrandColors.white} size="large" /> : <Text style={styles.balance}>{balance}</Text>}
          <View style={styles.balanceCopy}>
            <Text style={styles.balanceLabel}>AVAILABLE CREDITS</Text>
            <Text style={styles.balanceHint}>1 credit = 1 worker contact</Text>
          </View>
        </View>

        <Pressable style={styles.findButton} onPress={() => router.push('/employer-find-manpower')}>
          <Text style={styles.findButtonText}>Find verified workers</Text>
          <Text style={styles.findButtonArrow}>→</Text>
        </Pressable>
      </View>

      <View style={styles.trustRow}>
        <TrustItem icon="✓" title="Verified" subtitle="Worker profiles" />
        <View style={styles.trustDivider} />
        <TrustItem icon="▤" title="Simple" subtitle="1 credit per contact" />
        <View style={styles.trustDivider} />
        <TrustItem icon="↗" title="Instant" subtitle="Credits added fast" />
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.section}>Choose your plan</Text>
          <Text style={styles.sectionSubtitle}>Buy credits and unlock contacts anytime.</Text>
        </View>
        <View style={styles.valuePill}><Text style={styles.valuePillText}>BEST VALUE</Text></View>
      </View>

      {packages.map((p, index) => {
        const popular = index === 1;
        const perCredit = p.priceInr / p.credits;
        return <View key={p.code} style={[styles.package, popular && styles.packagePopular]}>
          {popular && <View style={styles.popularRibbon}><Text style={styles.popularRibbonText}>MOST POPULAR</Text></View>}
          <View style={styles.packageTop}>
            <View style={[styles.packageIcon, popular && styles.packageIconPopular]}>
              <Text style={[styles.packageIconText, popular && styles.packageIconTextPopular]}>▤</Text>
            </View>
            <View style={styles.packageCopy}>
              <Text style={styles.packageTitle}>{p.name.replace(' Credits', '')}</Text>
              <Text style={styles.packageDescription}>{p.credits} contacts to unlock</Text>
            </View>
            <View style={styles.priceBlock}>
              <Text style={styles.packagePrice}>₹{Number(p.priceInr).toLocaleString('en-IN')}</Text>
              <Text style={styles.perCredit}>₹{perCredit.toFixed(0)} / credit</Text>
            </View>
          </View>
          <View style={styles.packageBottom}>
            <View style={styles.featureLine}><Text style={styles.check}>✓</Text><Text style={styles.featureText}>{p.credits} worker contact unlocks</Text></View>
            <Pressable disabled={buying} onPress={() => buy(p)} style={[styles.buy, popular && styles.buyPopular, buying && styles.disabled]}>
              <Text style={styles.buyText}>{buying ? '...' : 'Buy now'}</Text>
              {!buying && <Text style={styles.buyArrow}>→</Text>}
            </Pressable>
          </View>
        </View>;
      })}

      {!loading && !packages.length && <View style={styles.empty}><Text style={styles.muted}>Credit packages are currently unavailable.</Text></View>}

      <Pressable style={styles.historyCard} onPress={() => router.push('/credit-history')}>
        <View style={styles.historyIcon}><Text style={styles.historyGlyph}>▤</Text></View>
        <View style={styles.historyCopy}>
          <Text style={styles.historyTitle}>Credit history</Text>
          <Text style={styles.historySubtitle}>View purchases, usage and wallet activity.</Text>
        </View>
        <Text style={styles.historyArrow}>→</Text>
      </Pressable>

      <View style={styles.safeNote}>
        <Text style={styles.safeIcon}>✓</Text>
        <Text style={styles.safeText}>Secure payments • Your balance updates after successful payment</Text>
      </View>
    </ScrollView>
  </View>;
}

function TrustItem({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return <View style={styles.trustItem}>
    <View style={styles.trustIcon}><Text style={styles.trustIconText}>{icon}</Text></View>
    <Text style={styles.trustTitle}>{title}</Text>
    <Text style={styles.trustSubtitle}>{subtitle}</Text>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.background },
  container: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 88, paddingBottom: 122 },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  headerCopy: { flex: 1, paddingRight: 12 },
  eyebrow: { color: BrandColors.indigo, fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: BrandColors.navy, fontSize: 30, lineHeight: 34, fontWeight: '900', marginTop: 4 },
  subtitle: { color: BrandColors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 5, maxWidth: 300 },
  headerIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: BrandColors.skySoft, borderWidth: 1, borderColor: BrandColors.border, alignItems: 'center', justifyContent: 'center' },
  creditGlyph: { color: BrandColors.indigo, fontSize: 26, fontWeight: '900' },
  hero: { overflow: 'hidden', minHeight: 248, borderRadius: 26, padding: 20, backgroundColor: BrandColors.navy, borderWidth: 1, borderColor: BrandColors.indigo, shadowColor: BrandColors.navy, shadowOpacity: .18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 7 },
  heroGlow: { position: 'absolute', width: 190, height: 190, borderRadius: 95, right: -55, top: -55, backgroundColor: '#173D78', opacity: .9 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center' },
  heroIconCircle: { width: 46, height: 46, borderRadius: 16, backgroundColor: BrandColors.indigo, alignItems: 'center', justifyContent: 'center' },
  heroIcon: { color: BrandColors.white, fontSize: 23, fontWeight: '900' },
  heroCopy: { flex: 1, marginLeft: 12 },
  heroEyebrow: { color: '#BFDBFE', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  heroTitle: { color: BrandColors.white, fontSize: 18, fontWeight: '900', marginTop: 2 },
  securePill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,.18)' },
  secureText: { color: '#BAE6FD', fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  balanceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 24 },
  balance: { color: BrandColors.white, fontSize: 56, lineHeight: 58, fontWeight: '900' },
  balanceCopy: { marginLeft: 13, marginBottom: 6 },
  balanceLabel: { color: '#BAE6FD', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  balanceHint: { color: '#E0F2FE', fontSize: 11, fontWeight: '700', marginTop: 3 },
  findButton: { marginTop: 20, height: 48, borderRadius: 14, paddingHorizontal: 16, backgroundColor: BrandColors.indigo, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  findButtonText: { color: BrandColors.white, fontSize: 13, fontWeight: '900' },
  findButtonArrow: { color: BrandColors.white, fontSize: 20, fontWeight: '700' },
  trustRow: { marginTop: 14, minHeight: 86, borderRadius: 20, backgroundColor: BrandColors.surfaceLight, borderWidth: 1, borderColor: BrandColors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 6, shadowColor: BrandColors.navy, shadowOpacity: .05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  trustItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  trustIcon: { width: 28, height: 28, borderRadius: 10, backgroundColor: BrandColors.skySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  trustIconText: { color: BrandColors.indigo, fontSize: 14, fontWeight: '900' },
  trustTitle: { color: BrandColors.navy, fontSize: 10, fontWeight: '900' },
  trustSubtitle: { color: BrandColors.muted, fontSize: 7, marginTop: 2, textAlign: 'center' },
  trustDivider: { width: 1, height: 38, backgroundColor: BrandColors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 },
  section: { color: BrandColors.navy, fontSize: 19, fontWeight: '900' },
  sectionSubtitle: { color: BrandColors.textSecondary, fontSize: 10, marginTop: 3 },
  valuePill: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, backgroundColor: BrandColors.skySoft },
  valuePillText: { color: BrandColors.indigo, fontSize: 7, fontWeight: '900', letterSpacing: .8 },
  package: { position: 'relative', overflow: 'hidden', padding: 16, borderRadius: 20, backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.border, marginBottom: 12, shadowColor: BrandColors.navy, shadowOpacity: .07, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  packagePopular: { borderColor: BrandColors.indigo, borderWidth: 1.5, paddingTop: 21 },
  popularRibbon: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 11, paddingVertical: 5, borderBottomLeftRadius: 11, backgroundColor: BrandColors.indigo },
  popularRibbonText: { color: BrandColors.white, fontSize: 7, fontWeight: '900', letterSpacing: .8 },
  packageTop: { flexDirection: 'row', alignItems: 'center' },
  packageIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: BrandColors.skySoft, alignItems: 'center', justifyContent: 'center' },
  packageIconPopular: { backgroundColor: BrandColors.indigo },
  packageIconText: { color: BrandColors.indigo, fontSize: 21, fontWeight: '900' },
  packageIconTextPopular: { color: BrandColors.white },
  packageCopy: { flex: 1, marginLeft: 12, paddingRight: 8 },
  packageTitle: { color: BrandColors.navy, fontSize: 17, fontWeight: '900' },
  packageDescription: { color: BrandColors.textSecondary, fontSize: 10, marginTop: 3 },
  priceBlock: { alignItems: 'flex-end' },
  packagePrice: { color: BrandColors.navy, fontSize: 20, fontWeight: '900' },
  perCredit: { color: BrandColors.muted, fontSize: 8, marginTop: 2 },
  packageBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: BrandColors.border },
  featureLine: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
  check: { color: BrandColors.success, fontSize: 12, fontWeight: '900', marginRight: 5 },
  featureText: { color: BrandColors.textSecondary, fontSize: 9, fontWeight: '700' },
  buy: { minWidth: 98, height: 40, borderRadius: 12, paddingHorizontal: 13, backgroundColor: BrandColors.skySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buyPopular: { backgroundColor: BrandColors.indigo },
  buyText: { color: BrandColors.navy, fontSize: 11, fontWeight: '900' },
  buyArrow: { color: BrandColors.navy, fontSize: 15, fontWeight: '900', marginLeft: 5 },
  disabled: { opacity: .55 },
  empty: { padding: 18, alignItems: 'center' },
  muted: { color: BrandColors.muted, fontSize: 11, textAlign: 'center' },
  historyCard: { marginTop: 4, padding: 15, minHeight: 70, borderRadius: 18, backgroundColor: BrandColors.skySoft, borderWidth: 1, borderColor: BrandColors.border, flexDirection: 'row', alignItems: 'center' },
  historyIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: BrandColors.white, alignItems: 'center', justifyContent: 'center' },
  historyGlyph: { color: BrandColors.indigo, fontSize: 19, fontWeight: '900' },
  historyCopy: { flex: 1, marginLeft: 11 },
  historyTitle: { color: BrandColors.navy, fontSize: 13, fontWeight: '900' },
  historySubtitle: { color: BrandColors.textSecondary, fontSize: 9, marginTop: 3 },
  historyArrow: { color: BrandColors.indigo, fontSize: 20, fontWeight: '900' },
  safeNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, paddingHorizontal: 8 },
  safeIcon: { color: BrandColors.success, fontSize: 12, fontWeight: '900', marginRight: 5 },
  safeText: { color: BrandColors.muted, fontSize: 8, textAlign: 'center' },
});
