import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { cancelEmployerSubscription, createEmployerSubscription, EmployerSubscription, EmployerSubscriptionPlan, getCurrentSubscription, getSubscriptionPlans } from '@/api/subscriptions';
import { BrandColors } from '@/constants/theme';

export default function EmployerSubscriptionScreen() {
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  const [plans, setPlans] = useState<EmployerSubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<EmployerSubscription | null>(null);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [planRows, current] = await Promise.all([getSubscriptionPlans(), getCurrentSubscription()]);
      setPlans(planRows); setSubscription(current.subscription); setActive(current.active);
    } catch (error: any) { Alert.alert('Unable to load subscription', error?.response?.data?.message ?? 'Please try again.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function choosePlan(plan: EmployerSubscriptionPlan) {
    if (creating) return;
    try {
      setCreating(plan.code);
      const result = await createEmployerSubscription(plan.code);
      if (result.active && !result.shortUrl) {
        Alert.alert('Plan activated', `${plan.name} is now active.`);
        await load();
        if (jobId) router.replace({ pathname: '/employer-job-details', params: { id: String(jobId) } });
        return;
      }
      if (!result.shortUrl) { Alert.alert('Payment unavailable', 'Razorpay did not return a subscription payment link.'); return; }
      await Linking.openURL(result.shortUrl);
      Alert.alert('Complete subscription payment', 'Finish the Razorpay authorisation in the payment window, then return here and tap Refresh status.');
    } catch (error: any) { Alert.alert('Unable to start subscription', error?.response?.data?.message ?? 'Please try again.'); }
    finally { setCreating(null); }
  }

  async function refreshStatus() {
    setRefreshing(true);
    try {
      const current = await getCurrentSubscription();
      setSubscription(current.subscription); setActive(current.active);
      if (current.active && jobId && current.subscription && current.subscription.jobsUsed < current.subscription.jobLimit) { router.replace({ pathname: '/employer-job-details', params: { id: String(jobId) } }); return; }
      await load();
    } catch (error: any) { Alert.alert('Unable to refresh status', error?.response?.data?.message ?? 'Please try again.'); }
    finally { setRefreshing(false); }
  }

  async function cancel() {
    Alert.alert('Cancel subscription?', 'Your subscription will remain usable until the end of the current billing period.', [
      { text: 'Keep subscription', style: 'cancel' },
      { text: 'Cancel at period end', style: 'destructive', onPress: async () => {
        try { await cancelEmployerSubscription(); await load(); Alert.alert('Cancellation scheduled', 'You can continue using your remaining job postings until the current period ends.'); }
        catch (error: any) { Alert.alert('Unable to cancel', error?.response?.data?.message ?? 'Please try again.'); }
      } },
    ]);
  }

  const freePlanExhausted = subscription?.planCode === 'FREE' && subscription.jobsUsed >= subscription.jobLimit;
  const paidPlans = plans.filter((plan) => plan.code !== 'FREE');

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={BrandColors.gold} /></View></SafeAreaView>;
  return <SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshStatus} tintColor={BrandColors.gold} />}>
    <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><View style={styles.headerCopy}><Text style={styles.eyebrow}>EMPLOYER BILLING</Text><Text style={styles.title}>Choose your plan</Text><Text style={styles.subtitle}>Your first job posting is free. Upgrade when you need more job postings.</Text></View></View>

    {subscription && <View style={styles.currentCard}>
      <Text style={styles.currentEyebrow}>CURRENT PLAN</Text>
      <Text style={styles.currentTitle}>{subscription.planName}</Text>
      <Text style={styles.currentStatus}>{subscription.status.toUpperCase()}{subscription.cancelAtPeriodEnd ? ' • CANCELLING AT PERIOD END' : ''}</Text>
      <View style={styles.usageRow}><Text style={styles.usage}>{subscription.jobsUsed} / {subscription.jobLimit} jobs used</Text><Text style={styles.usage}>{subscription.priceInr === 0 ? 'FREE' : `₹${subscription.priceInr.toLocaleString('en-IN')} / ${subscription.billingInterval.toLowerCase()}`}</Text></View>
      <View style={styles.progressTrack}><View style={[styles.progress, { width: `${Math.min(100, (subscription.jobsUsed / Math.max(1, subscription.jobLimit)) * 100)}%` }]} /></View>
      {subscription.planCode === 'FREE' && !freePlanExhausted && <Text style={styles.freeMessage}>You have 1 free job posting available. No payment is required.</Text>}
      {subscription.planCode === 'FREE' && freePlanExhausted && <Text style={styles.warning}>Your free job posting has been used. Choose a paid plan to publish another job.</Text>}
      {subscription.planCode !== 'FREE' && !active && <Text style={styles.warning}>Payment is not active yet. Complete the Razorpay authorisation and refresh status.</Text>}
      {active && jobId && subscription.jobsUsed < subscription.jobLimit && <Pressable onPress={() => router.replace({ pathname: '/employer-job-details', params: { id: String(jobId) } })} style={styles.primary}><Text style={styles.primaryText}>Continue to publish job</Text></Pressable>}
      {subscription.status === 'active' && subscription.planCode !== 'FREE' && !subscription.cancelAtPeriodEnd && <Pressable onPress={cancel} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel at period end</Text></Pressable>}
    </View>}

    <Pressable onPress={refreshStatus} style={styles.refreshButton}><Text style={styles.refreshText}>↻ Refresh subscription status</Text></Pressable>

    {freePlanExhausted && <View style={styles.upgradeBanner}><Text style={styles.upgradeTitle}>Ready to hire more workers?</Text><Text style={styles.upgradeText}>Choose a monthly plan below. Your subscription controls how many jobs you can publish in each billing period.</Text></View>}

    {(!subscription || freePlanExhausted) && paidPlans.map((plan) => <View key={plan.code} style={styles.planCard}>
      <View style={styles.planTop}><Text style={styles.planName}>{plan.name}</Text><Text style={styles.planPrice}>₹{plan.priceInr.toLocaleString('en-IN')}<Text style={styles.planPeriod}> / month</Text></Text></View>
      <Text style={styles.planDescription}>{plan.description}</Text>
      <View style={styles.featureRow}><Text style={styles.check}>✓</Text><Text style={styles.feature}>{plan.jobLimit} job postings per month</Text></View>
      <View style={styles.featureRow}><Text style={styles.check}>✓</Text><Text style={styles.feature}>Recurring Razorpay billing</Text></View>
      <Pressable disabled={Boolean(creating)} onPress={() => choosePlan(plan)} style={styles.primary}><Text style={styles.primaryText}>{creating === plan.code ? 'Opening payment...' : `Choose ${plan.name}`}</Text></Pressable>
    </View>)}

    {!plans.length && <View style={styles.empty}><Text style={styles.emptyTitle}>Plans are not configured</Text><Text style={styles.emptyText}>Run the subscription seed and configure the Razorpay plan IDs for the paid plans.</Text></View>}
    <Text style={styles.note}>Your card/mandate details are handled by Razorpay. WorkTrust stores subscription status and usage, not card credentials.</Text>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background }, content: { padding: 18, paddingBottom: 40 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, header: { flexDirection: 'row', gap: 10 }, back: { color: BrandColors.gold, fontSize: 36, lineHeight: 32 }, headerCopy: { flex: 1 }, eyebrow: { color: BrandColors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 }, title: { color: BrandColors.text, fontSize: 26, fontWeight: '900', marginTop: 3 }, subtitle: { color: BrandColors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 6 }, currentCard: { marginTop: 18, backgroundColor: BrandColors.slateSoft, borderColor: BrandColors.gold, borderWidth: 1, borderRadius: 18, padding: 16 }, currentEyebrow: { color: BrandColors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, currentTitle: { color: BrandColors.text, fontSize: 22, fontWeight: '900', marginTop: 6 }, currentStatus: { color: BrandColors.textSecondary, fontSize: 10, fontWeight: '800', marginTop: 4 }, usageRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }, usage: { color: BrandColors.text, fontSize: 12, fontWeight: '800' }, progressTrack: { height: 8, borderRadius: 99, backgroundColor: BrandColors.slate, overflow: 'hidden', marginTop: 9 }, progress: { height: 8, backgroundColor: BrandColors.gold, borderRadius: 99 }, freeMessage: { color: BrandColors.text, backgroundColor: '#1C241A', borderRadius: 10, padding: 10, marginTop: 12, fontSize: 11, lineHeight: 16 }, warning: { color: '#F8D77A', backgroundColor: '#2A2416', borderRadius: 10, padding: 10, marginTop: 12, fontSize: 11, lineHeight: 16 }, upgradeBanner: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: '#2A2416', borderWidth: 1, borderColor: BrandColors.gold }, upgradeTitle: { color: BrandColors.gold, fontSize: 14, fontWeight: '900' }, upgradeText: { color: BrandColors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 5 }, planCard: { marginTop: 14, backgroundColor: BrandColors.slateSoft, borderColor: BrandColors.slateBorder, borderWidth: 1, borderRadius: 18, padding: 16 }, planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }, planName: { color: BrandColors.text, fontSize: 20, fontWeight: '900' }, planPrice: { color: BrandColors.gold, fontSize: 20, fontWeight: '900' }, planPeriod: { color: BrandColors.textSecondary, fontSize: 10, fontWeight: '700' }, planDescription: { color: BrandColors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 7 }, featureRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 10 }, check: { color: BrandColors.gold, fontWeight: '900' }, feature: { color: BrandColors.text, fontSize: 12 }, primary: { marginTop: 15, height: 50, borderRadius: 13, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: BrandColors.slate, fontWeight: '900', fontSize: 14 }, refreshButton: { height: 44, marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center' }, refreshText: { color: BrandColors.gold, fontWeight: '900', fontSize: 12 }, cancelButton: { marginTop: 10, height: 44, borderRadius: 12, borderWidth: 1, borderColor: BrandColors.slateBorder, alignItems: 'center', justifyContent: 'center' }, cancelText: { color: BrandColors.textSecondary, fontWeight: '800', fontSize: 12 }, empty: { marginTop: 20, padding: 16, borderRadius: 16, backgroundColor: BrandColors.slateSoft, borderWidth: 1, borderColor: BrandColors.slateBorder }, emptyTitle: { color: BrandColors.text, fontWeight: '900', fontSize: 16 }, emptyText: { color: BrandColors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 7 }, note: { color: BrandColors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 20 },
});
