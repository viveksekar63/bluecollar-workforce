import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchManpower } from '@/api/employer-manpower';
import { BrandColors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

const categories = ['Parota Master', 'Chef', 'Waiter', 'Housekeeping', 'Security', 'Driver'];

export default function EmployerHomeScreen() {
  const user = useAuthStore((s) => s.user);
  const employer = useAuthStore((s) => s.employer);
  const setActiveRole = useAuthStore((s) => s.setActiveRole);
  const [totalWorkers, setTotalWorkers] = useState(0);
  const [availableWorkers, setAvailableWorkers] = useState(0);
  const [verifiedWorkers, setVerifiedWorkers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await searchManpower({ limit: 1 });
      setTotalWorkers(result.total ?? 0);
      setAvailableWorkers((result.items ?? []).filter((w) => String(w.availability).toUpperCase() === 'AVAILABLE').length);
      setVerifiedWorkers((result.items ?? []).filter((w) => ['VERIFIED', 'COMPLETED', 'APPROVED'].includes(String(w.verificationStatus).toUpperCase())).length);
    } catch { setTotalWorkers(0); setAvailableWorkers(0); setVerifiedWorkers(0); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const name = user?.firstName || employer?.companyName || 'Employer';
  const company = employer?.companyName || 'Your business';

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={BrandColors.gold} /></View></SafeAreaView>;

  return <SafeAreaView style={styles.container}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={BrandColors.gold} />}>
      <View style={styles.header}><View style={styles.headerCopy}><Text style={styles.eyebrow}>EMPLOYER</Text><Text style={styles.title}>Welcome, {name}</Text><Text style={styles.subtitle}>{company} · Find trusted manpower for your business.</Text></View><Pressable style={styles.profile} onPress={() => router.push('/employer-profile')}><Text style={styles.profileText}>👤</Text></Pressable></View>

      <View style={styles.hero}><Text style={styles.heroEyebrow}>YOUR MANPOWER DESK</Text><Text style={styles.heroTitle}>Find the right worker, faster.</Text><Text style={styles.heroText}>Search our worker database by profession, skill and location. Contact details are revealed only after per-worker payment.</Text><Pressable style={styles.heroButton} onPress={() => router.push('/employer-find-manpower')}><Text style={styles.heroButtonText}>Find Manpower →</Text></Pressable></View>

      <View style={styles.stats}><View style={styles.stat}><Text style={styles.statValue}>{totalWorkers}</Text><Text style={styles.statLabel}>Workers available in database</Text></View><View style={styles.stat}><Text style={styles.statValue}>{verifiedWorkers}</Text><Text style={styles.statLabel}>Verified profiles</Text></View><View style={styles.stat}><Text style={styles.statValue}>{availableWorkers}</Text><Text style={styles.statLabel}>Ready for work</Text></View></View>

      <View style={styles.section}><Text style={styles.sectionTitle}>What are you hiring for?</Text><Text style={styles.sectionSubtitle}>Start with a common category</Text><View style={styles.categoryGrid}>{categories.map((category) => <Pressable key={category} style={styles.category} onPress={() => router.push({ pathname: '/employer-find-manpower', params: { skill: category } })}><View style={styles.categoryIcon}><Text>{category === 'Parota Master' || category === 'Chef' ? '🍳' : category === 'Driver' ? '🚗' : category === 'Security' ? '🛡️' : '👷'}</Text></View><Text style={styles.categoryText}>{category}</Text><Text style={styles.categoryArrow}>›</Text></Pressable>)}</View></View>

      <View style={styles.section}><View style={styles.row}><View><Text style={styles.sectionTitle}>How it works</Text><Text style={styles.sectionSubtitle}>Simple, transparent manpower access</Text></View></View><Step number="1" title="Search workers" text="Filter by category, experience and location." /><Step number="2" title="Review profile" text="See skills, experience and verification status." /><Step number="3" title="Unlock contact" text="Pay a small per-worker charge to reveal contact details." /></View>

      <View style={styles.trust}><Text style={styles.trustIcon}>✓</Text><View style={styles.trustCopy}><Text style={styles.trustTitle}>Verified worker information</Text><Text style={styles.trustText}>Worker records are supplied through our admin/API pipeline and verification checks are performed separately.</Text></View></View>

      <View style={styles.quick}><Pressable onPress={() => router.push('/employer-find-manpower')}><Text style={styles.quickTitle}>Find Manpower</Text><Text style={styles.quickText}>Search worker profiles →</Text></Pressable><Pressable onPress={() => router.push('/employer-subscription')}><Text style={styles.quickTitle}>My Subscription</Text><Text style={styles.quickText}>Manage account →</Text></Pressable></View>

      <Pressable style={styles.switch} onPress={() => { setActiveRole('WORKER'); router.replace('/home'); }}><Text style={styles.switchText}>Switch to Worker</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}

function Step({ number, title, text }: { number: string; title: string; text: string }) { return <View style={styles.step}><View style={styles.number}><Text style={styles.numberText}>{number}</Text></View><View style={styles.stepCopy}><Text style={styles.stepTitle}>{title}</Text><Text style={styles.stepText}>{text}</Text></View></View>; }

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:BrandColors.background},content:{padding:18,paddingBottom:55},center:{flex:1,alignItems:'center',justifyContent:'center'},header:{flexDirection:'row',alignItems:'center',marginBottom:18},headerCopy:{flex:1},eyebrow:{color:BrandColors.gold,fontSize:10,fontWeight:'900',letterSpacing:1.6},title:{color:BrandColors.text,fontSize:27,fontWeight:'900',marginTop:4},subtitle:{color:BrandColors.textSecondary,fontSize:12,lineHeight:18,marginTop:4},profile:{width:44,height:44,borderRadius:22,backgroundColor:BrandColors.slateSoft,borderWidth:1,borderColor:BrandColors.slateBorder,alignItems:'center',justifyContent:'center'},profileText:{fontSize:19},hero:{padding:19,borderRadius:19,backgroundColor:BrandColors.goldSoft,borderWidth:1,borderColor:BrandColors.gold},heroEyebrow:{color:BrandColors.gold,fontSize:10,fontWeight:'900',letterSpacing:1.4},heroTitle:{color:BrandColors.text,fontSize:22,fontWeight:'900',marginTop:6},heroText:{color:BrandColors.textSecondary,fontSize:12,lineHeight:18,marginTop:7},heroButton:{height:48,borderRadius:13,backgroundColor:BrandColors.gold,alignItems:'center',justifyContent:'center',marginTop:15},heroButtonText:{color:BrandColors.slate,fontSize:14,fontWeight:'900'},stats:{flexDirection:'row',gap:8,marginTop:12},stat:{flex:1,minHeight:91,padding:11,borderRadius:14,backgroundColor:BrandColors.slateSoft,borderWidth:1,borderColor:BrandColors.slateBorder},statValue:{color:BrandColors.text,fontSize:22,fontWeight:'900'},statLabel:{color:BrandColors.textSecondary,fontSize:9,lineHeight:13,marginTop:3},section:{marginTop:23},sectionTitle:{color:BrandColors.text,fontSize:17,fontWeight:'900'},sectionSubtitle:{color:BrandColors.textSecondary,fontSize:10,marginTop:3},categoryGrid:{flexDirection:'row',flexWrap:'wrap',gap:9,marginTop:10},category:{width:'48%',minHeight:66,borderRadius:14,backgroundColor:BrandColors.slateSoft,borderWidth:1,borderColor:BrandColors.slateBorder,padding:10,flexDirection:'row',alignItems:'center'},categoryIcon:{width:35,height:35,borderRadius:10,backgroundColor:BrandColors.slate,alignItems:'center',justifyContent:'center'},categoryText:{flex:1,color:BrandColors.text,fontSize:10,fontWeight:'800',marginLeft:8},categoryArrow:{color:BrandColors.gold,fontSize:21},row:{marginBottom:9},step:{flexDirection:'row',padding:12,borderRadius:13,backgroundColor:BrandColors.slateSoft,borderWidth:1,borderColor:BrandColors.slateBorder,marginTop:7},number:{width:27,height:27,borderRadius:14,backgroundColor:BrandColors.gold,alignItems:'center',justifyContent:'center'},numberText:{color:BrandColors.slate,fontWeight:'900'},stepCopy:{flex:1,marginLeft:10},stepTitle:{color:BrandColors.text,fontSize:12,fontWeight:'900'},stepText:{color:BrandColors.textSecondary,fontSize:10,lineHeight:15,marginTop:2},trust:{marginTop:20,padding:14,borderRadius:15,borderWidth:1,borderColor:BrandColors.gold,backgroundColor:'#2A2416',flexDirection:'row',alignItems:'center'},trustIcon:{width:30,height:30,borderRadius:15,backgroundColor:BrandColors.gold,color:BrandColors.slate,textAlign:'center',lineHeight:30,fontWeight:'900'},trustCopy:{flex:1,marginLeft:10},trustTitle:{color:BrandColors.text,fontSize:12,fontWeight:'900'},trustText:{color:BrandColors.textSecondary,fontSize:9,lineHeight:14,marginTop:3},quick:{flexDirection:'row',gap:9,marginTop:20},quick>Pressable:{flex:1},quickTitle:{color:BrandColors.gold,fontSize:11,fontWeight:'900'},quickText:{color:BrandColors.textSecondary,fontSize:10,marginTop:4},switch:{marginTop:20,alignItems:'center',padding:12},switchText:{color:BrandColors.muted,fontSize:11,fontWeight:'800'}
});
