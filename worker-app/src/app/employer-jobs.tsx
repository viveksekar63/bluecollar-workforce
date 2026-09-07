import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmployerJob, getEmployerJobs } from '@/api/employer-recruitment';
import { BrandColors } from '@/constants/theme';

export default function EmployerJobsScreen() {
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setJobs((await getEmployerJobs()) ?? []); }
    catch { setJobs([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={BrandColors.indigo} /></View></SafeAreaView>;

  return <SafeAreaView style={styles.container} edges={['top']}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={BrandColors.indigo} />}>
      <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><View style={styles.headerCopy}><Text style={styles.eyebrow}>EMPLOYER</Text><Text style={styles.title}>My Jobs</Text><Text style={styles.subtitle}>Select a job to manage AI recruitment.</Text></View></View>
      {jobs.length === 0 ? <View style={styles.empty}><Text style={styles.emptyIcon}>▤</Text><Text style={styles.emptyTitle}>No jobs yet</Text><Text style={styles.emptyText}>Create a job to start matching and recruiting workers.</Text></View> : jobs.map((job) => <Pressable key={job.id} style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={() => router.push({ pathname: '/employer-ai-recruiter', params: { jobId: job.id } })}>
        <View style={styles.cardTop}><View style={styles.jobIcon}><Text style={styles.jobIconText}>▤</Text></View><View style={styles.cardCopy}><Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text><Text style={styles.location}>{[job.city, job.state].filter(Boolean).join(', ') || 'Location not specified'}</Text></View><View style={styles.status}><Text style={styles.statusText}>{job.status ?? 'DRAFT'}</Text></View></View>
        <View style={styles.cardBottom}><Text style={styles.openings}>{job.openings ?? 0} openings</Text><Text style={styles.aiLink}>AI Recruiter →</Text></View>
      </Pressable>)}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:BrandColors.background},content:{padding:20,paddingTop:10,paddingBottom:120},center:{flex:1,alignItems:'center',justifyContent:'center'},header:{flexDirection:'row',alignItems:'center',marginBottom:22},back:{width:44,height:44,borderRadius:14,backgroundColor:'#FFF',borderWidth:1,borderColor:BrandColors.border,alignItems:'center',justifyContent:'center',marginRight:12},backText:{fontSize:30,color:BrandColors.navy,lineHeight:32},headerCopy:{flex:1},eyebrow:{fontSize:9,fontWeight:'900',letterSpacing:1.5,color:BrandColors.indigo},title:{fontSize:26,fontWeight:'900',color:BrandColors.navy,marginTop:2},subtitle:{fontSize:11,color:BrandColors.textSecondary,marginTop:4},card:{backgroundColor:'#FFF',borderRadius:20,borderWidth:1,borderColor:BrandColors.border,padding:16,marginBottom:12,shadowColor:'#0A1F44',shadowOpacity:.06,shadowRadius:10,shadowOffset:{width:0,height:4},elevation:2},pressed:{opacity:.86},cardTop:{flexDirection:'row',alignItems:'center'},jobIcon:{width:46,height:46,borderRadius:15,backgroundColor:BrandColors.skySoft,alignItems:'center',justifyContent:'center'},jobIconText:{fontSize:20,color:BrandColors.indigo},cardCopy:{flex:1,marginLeft:12,marginRight:8},jobTitle:{fontSize:15,fontWeight:'900',color:BrandColors.navy},location:{fontSize:10,color:BrandColors.textSecondary,marginTop:4},status:{paddingHorizontal:9,paddingVertical:6,borderRadius:10,backgroundColor:'#EFF6FF'},statusText:{fontSize:8,fontWeight:'900',color:BrandColors.indigo},cardBottom:{marginTop:14,paddingTop:12,borderTopWidth:1,borderTopColor:BrandColors.border,flexDirection:'row',justifyContent:'space-between'},openings:{fontSize:10,color:BrandColors.textSecondary,fontWeight:'700'},aiLink:{fontSize:10,color:BrandColors.indigo,fontWeight:'900'},empty:{backgroundColor:'#FFF',borderRadius:20,borderWidth:1,borderColor:BrandColors.border,padding:30,alignItems:'center',marginTop:20},emptyIcon:{fontSize:28,color:BrandColors.indigo},emptyTitle:{fontSize:18,fontWeight:'900',color:BrandColors.navy,marginTop:10},emptyText:{fontSize:11,color:BrandColors.textSecondary,textAlign:'center',lineHeight:17,marginTop:6},
});
