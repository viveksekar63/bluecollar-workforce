import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { BrandColors } from '../constants/colors';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const packages = [
  { credits: 10, price: 250, label: 'Starter' },
  { credits: 25, price: 625, label: 'Growth', popular: true },
  { credits: 50, price: 1250, label: 'Business' },
];

export default function EmployerCredits() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  const token = undefined as string | undefined;

  const loadBalance = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/credits/balance`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('Unable to load credits');
      const data = await res.json();
      setBalance(Number(data.balance || 0));
    } catch (e) {
      console.warn(e);
    } finally { setLoading(false); }
  }, [token]);

  useFocusEffect(useCallback(() => { loadBalance(); }, [loadBalance]));

  const buy = async (credits: number) => {
    try {
      setBuying(true);
      const res = await fetch(`${API_URL}/credits/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ credits }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Unable to create credit order');
      Alert.alert('Order created', `Razorpay order ${data.orderId} is ready. Connect the existing Razorpay checkout here, then call /credits/verify after successful payment.`);
    } catch (e: any) { Alert.alert('Buy credits', e.message || 'Something went wrong'); }
    finally { setBuying(false); }
  };

  return <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹  Back</Text></Pressable>
    <Text style={styles.eyebrow}>EMPLOYER WALLET</Text>
    <Text style={styles.title}>My Credits</Text>
    <Text style={styles.subtitle}>Use credits to unlock worker contact details.</Text>
    <View style={styles.balanceCard}>
      <Text style={styles.balanceLabel}>AVAILABLE CREDITS</Text>
      {loading ? <ActivityIndicator /> : <Text style={styles.balance}>{balance}</Text>}
      <Text style={styles.balanceHint}>1 credit unlocks a worker contact</Text>
    </View>
    <Text style={styles.section}>Buy Credits</Text>
    {packages.map(p => <View key={p.label} style={styles.package}>
      <View style={styles.packageCopy}>
        {p.popular && <Text style={styles.popular}>MOST POPULAR</Text>}
        <Text style={styles.packageTitle}>{p.label}</Text>
        <Text style={styles.packageCredits}>{p.credits} credits</Text>
        <Text style={styles.packagePrice}>₹{p.price}</Text>
      </View>
      <Pressable disabled={buying} onPress={() => buy(p.credits)} style={styles.buy}><Text style={styles.buyText}>{buying ? '...' : 'Buy'}</Text></Pressable>
    </View>)}
    <Pressable style={styles.history} onPress={() => router.push('/credit-history')}><Text style={styles.historyText}>View credit history →</Text></Pressable>
  </ScrollView>;
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:BrandColors.background},content:{padding:20,paddingBottom:60},back:{color:BrandColors.gold,fontSize:14,fontWeight:'800',marginBottom:24},eyebrow:{color:BrandColors.gold,fontSize:10,fontWeight:'900',letterSpacing:1.7},title:{color:BrandColors.text,fontSize:30,fontWeight:'900',marginTop:5},subtitle:{color:BrandColors.textSecondary,fontSize:13,lineHeight:20,marginTop:5},balanceCard:{marginTop:22,padding:22,borderRadius:20,backgroundColor:BrandColors.slateSoft,borderWidth:1,borderColor:BrandColors.gold},balanceLabel:{color:BrandColors.textSecondary,fontSize:10,fontWeight:'900',letterSpacing:1.2},balance:{color:BrandColors.gold,fontSize:48,fontWeight:'900',marginTop:5},balanceHint:{color:BrandColors.textSecondary,fontSize:11,marginTop:2},section:{color:BrandColors.text,fontSize:19,fontWeight:'900',marginTop:28,marginBottom:12},package:{flexDirection:'row',alignItems:'center',padding:16,borderRadius:17,backgroundColor:BrandColors.slateSoft,borderWidth:1,borderColor:BrandColors.slateBorder,marginBottom:10},packageCopy:{flex:1},popular:{color:BrandColors.gold,fontSize:8,fontWeight:'900',letterSpacing:1},packageTitle:{color:BrandColors.text,fontSize:16,fontWeight:'900',marginTop:2},packageCredits:{color:BrandColors.textSecondary,fontSize:11,marginTop:2},packagePrice:{color:BrandColors.text,fontSize:18,fontWeight:'900',marginTop:5},buy:{backgroundColor:BrandColors.gold,borderRadius:12,paddingHorizontal:20,paddingVertical:12},buyText:{color:BrandColors.slate,fontWeight:'900'},history:{alignItems:'center',padding:20},historyText:{color:BrandColors.gold,fontSize:13,fontWeight:'800'}
});
