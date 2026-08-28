import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchManpower } from '@/api/employer-manpower';
import { BrandColors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

const categories = [
  ['Parota Master', '🍳'], ['Chef', '👨‍🍳'], ['Waiter', '🍽️'], ['Housekeeping', '🧹'], ['Security', '🛡️'], ['Driver', '🚗'],
] as const;

// Local vector artwork keeps the hero consistent on Android, iOS and web without a remote image dependency.
const bannerSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="760" height="420" viewBox="0 0 760 420"><defs><radialGradient id="g"><stop stop-color="#2563eb" stop-opacity=".8"/><stop offset="1" stop-color="#0a1f44" stop-opacity="0"/></radialGradient></defs><rect width="760" height="420" fill="#0a1f44"/><circle cx="570" cy="115" r="220" fill="url(#g)"/><path d="M600 42l70 28 70-28v82c0 70-46 106-70 118-24-12-70-48-70-118z" fill="#173d78" stroke="#7dd3fc" stroke-width="9"/><path d="M625 111l31 29 61-65" fill="none" stroke="#7dd3fc" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/><g stroke="#7dd3fc" stroke-width="3" opacity=".22"><path d="M390 60h110M350 100h140M420 140h100M320 180h180"/></g><g><circle cx="430" cy="220" r="58" fill="#f0b48a"/><path d="M375 216c6-63 112-71 113 4-28-22-70-18-113-4z" fill="#102b56"/><path d="M360 390c8-101 27-136 70-136h18c43 0 62 35 70 136z" fill="#123a68"/><path d="M392 285h94l-13 105h-68z" fill="#0d315a"/><circle cx="300" cy="245" r="43" fill="#eab08b"/><path d="M258 245c3-50 83-57 85 3-24-15-51-14-85-3z" fill="#0d2342"/><path d="M236 390c7-82 23-111 58-111h14c35 0 51 29 58 111z" fill="#174b80"/><circle cx="575" cy="252" r="43" fill="#d99b74"/><path d="M534 249c2-48 78-56 82 2-22-15-49-13-82-2z" fill="#111c32"/><path d="M508 390c7-82 23-111 58-111h14c35 0 51 29 58 111z" fill="#102b56"/></g></svg>`);
const bannerImage = `data:image/svg+xml;charset=utf-8,${bannerSvg}`;

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
      const result = await searchManpower({ limit: 100 });
      const items = result.items ?? [];
      setTotalWorkers(result.total ?? items.length);
      setAvailableWorkers(items.filter((w) => String(w.availability).toUpperCase() === 'AVAILABLE').length);
      setVerifiedWorkers(items.filter((w) => ['VERIFIED', 'COMPLETED', 'APPROVED'].includes(String(w.verificationStatus).toUpperCase())).length);
    } catch {
      setTotalWorkers(0); setAvailableWorkers(0); setVerifiedWorkers(0);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const name = user?.firstName || employer?.companyName || 'Employer';
  const company = employer?.companyName || 'Your business';

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={BrandColors.indigo} /></View></SafeAreaView>;

  return <SafeAreaView style={styles.container}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={BrandColors.indigo} />}>
      <View style={styles.header}>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>EMPLOYER</Text><Text style={styles.title} numberOfLines={1}>Welcome, {name} 👋</Text><Text style={styles.subtitle}>{company} · Find trusted manpower for your business.</Text></View>
        <Pressable style={styles.profile} onPress={() => router.push('/employer-profile')}><Text style={styles.profileText}>👤</Text></Pressable>
      </View>

      <View style={styles.hero}>
        <Image source={bannerImage} style={styles.heroArt} contentFit="cover" />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <View style={styles.heroBadge}><Text style={styles.heroBadgeIcon}>✦</Text><Text style={styles.heroBadgeText}>YOUR MANPOWER DESK</Text></View>
          <Text style={styles.heroTitle}>Find the right worker, faster.</Text>
          <Text style={styles.heroText}>Search our verified worker database by profession, skill and location. Contact details are revealed only after per-worker payment.</Text>
          <Pressable style={styles.heroButton} onPress={() => router.push('/employer-find-manpower')}><Text style={styles.heroButtonText}>Find Manpower</Text><Text style={styles.heroButtonArrow}>→</Text></Pressable>
        </View>
      </View>

      <View style={styles.statsCard}>
        <Stat icon="♙" value={totalWorkers} label={<>Workers available{`\n`}in database</>} />
        <View style={styles.statDivider}/><Stat icon="✦" value={verifiedWorkers} label={<>Verified{`\n`}profiles</>} />
        <View style={styles.statDivider}/><Stat icon="➜" value={availableWorkers} label={<>Ready for{`\n`}work</>} />
      </View>

      <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>What are you hiring for?</Text><Text style={styles.sectionSubtitle}>Start with a common category</Text></View><Pressable onPress={() => router.push('/employer-find-manpower')}><Text style={styles.viewAll}>View all →</Text></Pressable></View>
      <View style={styles.categoryGrid}>{categories.map(([label, icon]) => <Pressable key={label} style={styles.category} onPress={() => router.push({ pathname:'/employer-find-manpower', params:{ skill:label } })}><View style={styles.categoryIcon}><Text style={styles.categoryEmoji}>{icon}</Text></View><Text style={styles.categoryText}>{label}</Text><Text style={styles.categoryArrow}>›</Text></Pressable>)}</View>

      <View style={styles.sectionHeaderBlock}><Text style={styles.sectionTitle}>How it works</Text><Text style={styles.sectionSubtitle}>Simple, transparent manpower access</Text></View>
      <Step number="1" icon="⌕" title="Search workers" text="Filter by category, experience and location." />
      <Step number="2" icon="▣" title="Review profile" text="See skills, experience and verification status." />
      <Step number="3" icon="⌕" title="Unlock contact" text="Pay a small per-worker charge to reveal contact details." />

      <Pressable style={styles.trust} onPress={() => router.push('/employer-find-manpower')}><View style={styles.trustIcon}><Text style={styles.trustIconText}>✓</Text></View><View style={styles.trustCopy}><Text style={styles.trustTitle}>Verified worker information</Text><Text style={styles.trustText}>Worker records are supplied through our admin/API pipeline and verification checks are performed separately.</Text></View><Text style={styles.trustArrow}>›</Text></Pressable>

      <View style={styles.bottomActions}><Pressable onPress={() => router.push('/employer-find-manpower')} style={styles.actionLink}><Text style={styles.actionTitle}>Find Manpower</Text><Text style={styles.actionText}>Search worker profiles →</Text></Pressable><Pressable onPress={() => router.push('/employer-credits')} style={styles.actionLink}><Text style={styles.actionTitle}>Credits</Text><Text style={styles.actionText}>Buy & manage credits →</Text></Pressable></View>
      <Pressable style={styles.switch} onPress={() => { setActiveRole('WORKER'); router.replace('/home'); }}><Text style={styles.switchText}>Switch to Worker</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}

function Stat({ icon, value, label }: { icon:string; value:number; label:ReactNode }) { return <View style={styles.stat}><View style={styles.statIcon}><Text style={styles.statIconText}>{icon}</Text></View><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function Step({ number, icon, title, text }: { number:string; icon:string; title:string; text:string }) { return <View style={styles.step}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View><View style={styles.stepCopy}><Text style={styles.stepTitle}>{title}</Text><Text style={styles.stepText}>{text}</Text></View><View style={styles.stepIcon}><Text style={styles.stepIconText}>{icon}</Text></View></View>; }

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:BrandColors.background},content:{paddingHorizontal:20,paddingTop:10,paddingBottom:110},center:{flex:1,alignItems:'center',justifyContent:'center'},header:{flexDirection:'row',alignItems:'center',marginBottom:19,paddingLeft:56},headerCopy:{flex:1,minWidth:0},eyebrow:{color:BrandColors.indigo,fontSize:10,fontWeight:'900',letterSpacing:1.7},title:{color:BrandColors.navy,fontSize:24,fontWeight:'900',marginTop:4},subtitle:{color:BrandColors.textSecondary,fontSize:11,lineHeight:17,marginTop:4},profile:{width:48,height:48,borderRadius:24,backgroundColor:BrandColors.skySoft,borderWidth:1,borderColor:BrandColors.border,alignItems:'center',justifyContent:'center',marginLeft:8},profileText:{fontSize:20},hero:{overflow:'hidden',backgroundColor:BrandColors.navy,borderRadius:24,minHeight:285,marginBottom:14},heroArt:{...StyleSheet.absoluteFillObject},heroOverlay:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(10,31,68,.56)'},heroContent:{padding:20,zIndex:2,maxWidth:'72%'},heroBadge:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',backgroundColor:'#173D78',borderRadius:20,paddingHorizontal:11,paddingVertical:7,marginBottom:14},heroBadgeIcon:{color:BrandColors.sky,fontSize:13,marginRight:6},heroBadgeText:{color:'#E0F2FE',fontSize:9,fontWeight:'900',letterSpacing:1.2},heroTitle:{color:'#FFFFFF',fontSize:27,lineHeight:33,fontWeight:'900'},heroText:{color:'#D9E9FF',fontSize:12,lineHeight:18,marginTop:9},heroButton:{height:50,borderRadius:15,backgroundColor:BrandColors.indigo,marginTop:18,paddingHorizontal:17,flexDirection:'row',alignItems:'center',justifyContent:'center',alignSelf:'flex-start',minWidth:190,shadowColor:'#2563EB',shadowOpacity:.3,shadowRadius:12,shadowOffset:{width:0,height:5},elevation:4},heroButtonText:{color:'#FFFFFF',fontSize:15,fontWeight:'900'},heroButtonArrow:{color:'#FFFFFF',fontSize:22,fontWeight:'900',marginLeft:8},statsCard:{backgroundColor:'#FFFFFF',borderRadius:20,paddingVertical:16,paddingHorizontal:10,borderWidth:1,borderColor:BrandColors.border,flexDirection:'row',alignItems:'center',marginBottom:23,shadowColor:'#0A1F44',shadowOpacity:.08,shadowRadius:12,shadowOffset:{width:0,height:5},elevation:2},stat:{flex:1,alignItems:'center'},statIcon:{width:38,height:38,borderRadius:12,backgroundColor:BrandColors.skySoft,alignItems:'center',justifyContent:'center',marginBottom:6},statIconText:{color:BrandColors.indigo,fontSize:17,fontWeight:'900'},statValue:{color:BrandColors.navy,fontSize:24,fontWeight:'900'},statLabel:{color:BrandColors.textSecondary,fontSize:8,marginTop:2,textAlign:'center',lineHeight:12},statDivider:{width:1,height:55,backgroundColor:BrandColors.border},sectionHeader:{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',marginBottom:12},sectionHeaderBlock:{marginTop:25,marginBottom:10},sectionTitle:{color:BrandColors.navy,fontSize:19,fontWeight:'900'},sectionSubtitle:{color:BrandColors.textSecondary,fontSize:11,marginTop:3},viewAll:{color:BrandColors.indigo,fontSize:11,fontWeight:'900',marginBottom:2},categoryGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'},category:{width:'31.5%',minHeight:96,backgroundColor:'#FFFFFF',borderRadius:17,borderWidth:1,borderColor:BrandColors.border,padding:10,alignItems:'flex-start',justifyContent:'center',marginBottom:10,shadowColor:'#0A1F44',shadowOpacity:.05,shadowRadius:8,shadowOffset:{width:0,height:3},elevation:1},categoryIcon:{width:42,height:42,borderRadius:14,backgroundColor:BrandColors.navy,alignItems:'center',justifyContent:'center',marginBottom:8},categoryEmoji:{fontSize:20},categoryText:{color:BrandColors.navy,fontSize:10,fontWeight:'900',flex:1},categoryArrow:{position:'absolute',right:10,top:12,color:BrandColors.indigo,fontSize:20},step:{backgroundColor:'#F7FBFF',borderRadius:17,borderWidth:1,borderColor:'#D8E8FB',minHeight:76,padding:12,flexDirection:'row',alignItems:'center',marginBottom:9},stepNumber:{width:34,height:34,borderRadius:17,backgroundColor:BrandColors.indigo,alignItems:'center',justifyContent:'center'},stepNumberText:{color:'#FFFFFF',fontSize:14,fontWeight:'900'},stepCopy:{flex:1,marginLeft:11},stepTitle:{color:BrandColors.navy,fontSize:12,fontWeight:'900'},stepText:{color:BrandColors.textSecondary,fontSize:9.5,lineHeight:14,marginTop:2},stepIcon:{width:40,height:40,borderRadius:14,backgroundColor:BrandColors.skySoft,alignItems:'center',justifyContent:'center',marginLeft:8},stepIconText:{color:BrandColors.indigo,fontSize:18,fontWeight:'900'},trust:{marginTop:8,borderRadius:18,backgroundColor:BrandColors.navy,padding:15,flexDirection:'row',alignItems:'center'},trustIcon:{width:42,height:42,borderRadius:14,backgroundColor:BrandColors.indigo,alignItems:'center',justifyContent:'center'},trustIconText:{color:'#FFFFFF',fontSize:19,fontWeight:'900'},trustCopy:{flex:1,marginLeft:11},trustTitle:{color:'#FFFFFF',fontSize:12,fontWeight:'900'},trustText:{color:'#C7E9FF',fontSize:9.5,lineHeight:14,marginTop:3},trustArrow:{color:'#FFFFFF',fontSize:28,marginLeft:7},bottomActions:{flexDirection:'row',gap:10,marginTop:18},actionLink:{flex:1,borderWidth:1,borderColor:BrandColors.border,borderRadius:16,backgroundColor:'#FFFFFF',padding:13},actionTitle:{color:BrandColors.indigo,fontSize:11,fontWeight:'900'},actionText:{color:BrandColors.textSecondary,fontSize:9,marginTop:4},switch:{alignItems:'center',padding:14,marginTop:7},switchText:{color:BrandColors.muted,fontSize:11,fontWeight:'800'}
});
