import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { getRecruitmentRecommendations } from '@/api/employer-recruitment';
import type { RecruitmentCandidate } from '@/api/employer-recruitment';
import { BrandColors } from '@/constants/theme';

const COLUMNS = [
  { key: 'NOT_CONTACTED', label: 'Shortlisted', hint: 'Ready to contact' },
  { key: 'CONTACTED', label: 'Contacted', hint: 'Outreach started' },
  { key: 'INTERESTED', label: 'Interested', hint: 'Positive response' },
  { key: 'INTERVIEW', label: 'Interview', hint: 'Interview stage' },
  { key: 'SELECTED', label: 'Selected', hint: 'Ready to hire' },
  { key: 'HIRED', label: 'Hired', hint: 'Converted' },
] as const;

function columnFor(candidate: RecruitmentCandidate) {
  const status = candidate.outreach.status;
  if (status === 'NO_RESPONSE' || status === 'UNAVAILABLE') return 'CONTACTED';
  if (status === 'NOT_INTERESTED' || status === 'WRONG_NUMBER') return 'CONTACTED';
  return COLUMNS.some((c) => c.key === status) ? status : 'NOT_CONTACTED';
}

export default function EmployerRecruitmentPipelineScreen() {
  const { jobId: rawJobId } = useLocalSearchParams<{ jobId?: string }>();
  const jobId = String(rawJobId ?? '');
  const [candidates, setCandidates] = useState<RecruitmentCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!jobId) { setLoading(false); return; }
    try {
      const result = await getRecruitmentRecommendations(jobId, 100);
      setCandidates(result.recommendations ?? []);
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [jobId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const columns = useMemo(() => COLUMNS.map((column) => ({
    ...column,
    candidates: candidates.filter((candidate) => columnFor(candidate) === column.key),
  })), [candidates]);

  if (loading) return <SafeAreaViewFallback><ActivityIndicator size="large" color={BrandColors.indigo} /></SafeAreaViewFallback>;

  return <SafeAreaViewFallback>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={BrandColors.indigo} />}
      contentContainerStyle={styles.horizontal}
    >
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>AI RECRUITMENT</Text>
            <Text style={styles.title}>Pipeline</Text>
            <Text style={styles.subtitle}>{candidates.length} shortlisted candidate{candidates.length === 1 ? '' : 's'} · AI-prioritized</Text>
          </View>
          <Pressable style={styles.refresh} onPress={() => void load()}><Text style={styles.refreshText}>↻</Text></Pressable>
        </View>

        <View style={styles.aiBanner}>
          <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>AI PIPELINE</Text></View>
          <Text style={styles.aiTitle}>Work the recruitment queue from left to right.</Text>
          <Text style={styles.aiText}>Open a candidate to contact, update the outcome, or schedule the next follow-up.</Text>
        </View>

        <View style={styles.columns}>
          {columns.map((column) => <View key={column.key} style={styles.column}>
            <View style={styles.columnHeader}>
              <View style={styles.columnTitleRow}><Text style={styles.columnTitle}>{column.label}</Text><View style={styles.count}><Text style={styles.countText}>{column.candidates.length}</Text></View></View>
              <Text style={styles.columnHint}>{column.hint}</Text>
            </View>
            {column.candidates.length ? column.candidates.map((candidate) => <PipelineCard key={candidate.workerId} candidate={candidate} jobId={jobId} />) : <View style={styles.empty}><Text style={styles.emptyText}>No candidates</Text></View>}
          </View>)}
        </View>
      </View>
    </ScrollView>
  </SafeAreaFallback>;
}

function PipelineCard({ candidate, jobId }: { candidate: RecruitmentCandidate; jobId: string }) {
  const initials = candidate.name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();
  const overdue = candidate.outreach.nextFollowUpAt ? new Date(candidate.outreach.nextFollowUpAt).getTime() <= Date.now() : false;
  return <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={() => router.push({ pathname: '/employer-recruitment-workspace', params: { jobId, workerId: candidate.workerId } })}>
    <View style={styles.cardTop}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{initials || 'W'}</Text></View>
      <View style={styles.cardCopy}><Text style={styles.name} numberOfLines={1}>{candidate.name || candidate.workerCode}</Text><Text style={styles.meta}>{candidate.profession} · {candidate.experienceYears ?? 0} yrs</Text></View>
      <Text style={styles.match}>{candidate.matchScore ?? 0}%</Text>
    </View>
    <View style={styles.scoreRow}><Text style={styles.scorePill}>{candidate.conversionScore}% conversion</Text><Text style={styles.scorePill}>{candidate.outreach.contactAttempts} attempts</Text></View>
    {overdue ? <View style={styles.due}><Text style={styles.dueText}>FOLLOW-UP DUE</Text></View> : null}
    <Text style={styles.action}>{candidate.action.replaceAll('_', ' ')}</Text>
  </Pressable>;
}

function SafeAreaViewFallback({ children }: { children: React.ReactNode }) {
  return <View style={styles.safe}>{children}</View>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:BrandColors.background},horizontal:{paddingBottom:110},page:{padding:20,minWidth:1120},header:{flexDirection:'row',alignItems:'center',marginBottom:15},back:{width:42,height:42,borderRadius:14,backgroundColor:'#FFF',borderWidth:1,borderColor:BrandColors.border,alignItems:'center',justifyContent:'center',marginRight:10},backText:{fontSize:29,color:BrandColors.navy,lineHeight:31},headerCopy:{flex:1},eyebrow:{fontSize:9,fontWeight:'900',letterSpacing:1.4,color:BrandColors.indigo},title:{fontSize:24,fontWeight:'900',color:BrandColors.navy,marginTop:2},subtitle:{fontSize:10,color:BrandColors.textSecondary,marginTop:3},refresh:{width:42,height:42,borderRadius:14,backgroundColor:'#FFF',borderWidth:1,borderColor:BrandColors.border,alignItems:'center',justifyContent:'center',marginLeft:8},refreshText:{fontSize:22,color:BrandColors.indigo},aiBanner:{backgroundColor:BrandColors.indigo,borderRadius:20,padding:18,marginBottom:14,width:1080},aiBadge:{alignSelf:'flex-start',backgroundColor:'rgba(255,255,255,.16)',paddingHorizontal:9,paddingVertical:5,borderRadius:10},aiBadgeText:{fontSize:8,fontWeight:'900',letterSpacing:1,color:'#E0F2FE'},aiTitle:{fontSize:18,fontWeight:'900',color:'#FFF',marginTop:9},aiText:{fontSize:10,color:'#D9E9FF',marginTop:5},columns:{flexDirection:'row',gap:10},column:{width:175,backgroundColor:'#EEF4FA',borderRadius:18,padding:9,minHeight:500},columnHeader:{padding:7,paddingBottom:10},columnTitleRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},columnTitle:{fontSize:11,fontWeight:'900',color:BrandColors.navy},columnHint:{fontSize:8,color:BrandColors.textSecondary,marginTop:3},count:{minWidth:23,height:23,borderRadius:8,backgroundColor:'#FFF',alignItems:'center',justifyContent:'center'},countText:{fontSize:9,fontWeight:'900',color:BrandColors.indigo},card:{backgroundColor:'#FFF',borderRadius:15,borderWidth:1,borderColor:BrandColors.border,padding:11,marginBottom:8},pressed:{opacity:.82},cardTop:{flexDirection:'row',alignItems:'center'},avatar:{width:34,height:34,borderRadius:11,backgroundColor:BrandColors.skySoft,alignItems:'center',justifyContent:'center'},avatarText:{fontSize:9,fontWeight:'900',color:BrandColors.indigo},cardCopy:{flex:1,marginLeft:7,marginRight:4},name:{fontSize:10,fontWeight:'900',color:BrandColors.navy},meta:{fontSize:7.5,color:BrandColors.textSecondary,marginTop:2},match:{fontSize:11,fontWeight:'900',color:BrandColors.indigo},scoreRow:{flexDirection:'row',flexWrap:'wrap',gap:4,marginTop:8},scorePill:{fontSize:7,fontWeight:'900',color:BrandColors.indigo,backgroundColor:BrandColors.skySoft,paddingHorizontal:5,paddingVertical:4,borderRadius:6},due:{backgroundColor:'#FEF3C7',borderRadius:6,padding:4,marginTop:6},dueText:{fontSize:7,fontWeight:'900',color:'#92400E'},action:{fontSize:7.5,fontWeight:'900',color:BrandColors.textSecondary,marginTop:7},empty:{borderWidth:1,borderStyle:'dashed',borderColor:BrandColors.border,borderRadius:12,padding:15,alignItems:'center'},emptyText:{fontSize:8,color:BrandColors.textSecondary}
});
