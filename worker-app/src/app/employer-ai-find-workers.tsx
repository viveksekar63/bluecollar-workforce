import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createAiJobDraft, parseAiManpowerRequirement } from '@/api/employer-recruitment';
import { BrandColors } from '@/constants/theme';

const EXAMPLES = [
  'I need 5 electricians in Chennai who speak Tamil',
  'Need 3 plumbers in Thanjavur with 2 years experience',
  'I need 10 construction workers available immediately',
];

export default function EmployerAiFindWorkersScreen() {
  const [query, setQuery] = useState('');
  const [parsed, setParsed] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const parse = async () => {
    const text = query.trim();
    if (!text) { setError('Tell us what kind of workers you need.'); return; }
    setLoading(true); setError(''); setParsed(null);
    try {
      const result = await parseAiManpowerRequirement(text);
      if (result.status === 'CLARIFICATION_REQUIRED') {
        setError('I need a little more information before finding workers. Please include the worker type and quantity.');
      } else setParsed(result);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Unable to understand the requirement. Please try again.');
    } finally { setLoading(false); }
  };

  const findWorkers = async () => {
    if (!parsed?.suggestedJob) return;
    setCreating(true); setError('');
    try {
      const result = await createAiJobDraft(query.trim(), { title: parsed.suggestedJob.title, description: query.trim() });
      if (!result.job?.id) throw new Error('Unable to create recruitment request');
      router.replace({ pathname: '/employer-ai-contact-recommendations', params: { jobId: result.job.id } });
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Unable to start the worker search.');
    } finally { setCreating(false); }
  };

  const job = parsed?.suggestedJob;
  const requirement = parsed?.requirement;

  return <SafeAreaView style={styles.container} edges={['top']}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></Pressable>
          <View><Text style={styles.eyebrow}>AI MANPOWER SEARCH</Text><Text style={styles.title}>Find Workers</Text></View>
        </View>

        <View style={styles.hero}>
          <View style={styles.sparkle}><Text style={styles.sparkleText}>✦</Text></View>
          <Text style={styles.heroTitle}>Tell us who you need</Text>
          <Text style={styles.heroText}>Describe your manpower requirement naturally. AI will understand it and find the strongest workers for you.</Text>
        </View>

        <Text style={styles.label}>What manpower do you need?</Text>
        <View style={styles.inputCard}>
          <TextInput value={query} onChangeText={setQuery} multiline placeholder="Example: I need 5 electricians in Chennai who speak Tamil..." placeholderTextColor="#94A3B8" style={styles.input} textAlignVertical="top" />
          <View style={styles.inputFooter}><Text style={styles.voiceHint}>🎤 Voice input can be added here</Text><Text style={styles.count}>{query.length}/500</Text></View>
        </View>

        <View style={styles.examples}><Text style={styles.examplesTitle}>Try an example</Text>{EXAMPLES.map((example) => <Pressable key={example} onPress={() => {setQuery(example);setParsed(null);setError('');}} style={styles.example}><Text style={styles.exampleIcon}>✦</Text><Text style={styles.exampleText}>{example}</Text></Pressable>)}</View>

        {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}

        {!parsed ? <Pressable disabled={loading} onPress={() => void parse()} style={[styles.primary, loading && styles.disabled]}><Text style={styles.primaryText}>{loading ? 'AI is understanding…' : '✨ Understand requirement'}</Text></Pressable> : null}

        {parsed && job ? <View style={styles.result}>
          <View style={styles.resultHeader}><View><Text style={styles.resultEyebrow}>AI UNDERSTOOD</Text><Text style={styles.resultTitle}>Your requirement</Text></View><View style={styles.ready}><Text style={styles.readyText}>✓ READY</Text></View></View>
          <Requirement label="Workers" value={`${job.openings ?? 1} ${job.openings === 1 ? 'worker' : 'workers'}`} />
          <Requirement label="Profession" value={job.title?.replace(/^\d+\s*/, '').replace(/ Required$/, '') || 'Worker'} />
          {job.city || job.district || job.state ? <Requirement label="Location" value={[job.city, job.district, job.state].filter(Boolean).join(', ')} /> : null}
          {job.minimumExperienceYears != null ? <Requirement label="Experience" value={`${job.minimumExperienceYears}+ years`} /> : null}
          {job.languages?.length ? <Requirement label="Language" value={job.languages.join(', ')} /> : null}
          {job.availability ? <Requirement label="Availability" value={String(job.availability).replaceAll('_',' ')} /> : null}
          {job.accommodationAvailable ? <Requirement label="Accommodation" value="Available" /> : null}
          {requirement?.skills?.length ? <Requirement label="Skills" value={requirement.skills.map((s:any)=>s.name).join(', ')} /> : null}
          <Pressable disabled={creating} onPress={() => void findWorkers()} style={[styles.findButton, creating && styles.disabled]}><Text style={styles.findText}>{creating ? 'Finding workers…' : '✨ Find best workers'}</Text></Pressable>
          <Pressable disabled={creating} onPress={() => setParsed(null)} style={styles.edit}><Text style={styles.editText}>Edit requirement</Text></Pressable>
        </View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function Requirement({label,value}:{label:string;value:string}) { return <View style={styles.req}><Text style={styles.reqLabel}>{label}</Text><Text style={styles.reqValue}>{value}</Text></View>; }

const styles=StyleSheet.create({
  flex:{flex:1},container:{flex:1,backgroundColor:BrandColors.background},content:{padding:20,paddingBottom:130},header:{flexDirection:'row',alignItems:'center',marginBottom:18},back:{width:42,height:42,borderRadius:14,backgroundColor:'#FFF',borderWidth:1,borderColor:BrandColors.border,alignItems:'center',justifyContent:'center',marginRight:11},backText:{fontSize:29,lineHeight:31,color:BrandColors.navy},eyebrow:{fontSize:9,fontWeight:'900',letterSpacing:1.5,color:BrandColors.indigo},title:{fontSize:25,fontWeight:'900',color:BrandColors.navy,marginTop:2},hero:{backgroundColor:BrandColors.indigo,borderRadius:22,padding:20,marginBottom:20},sparkle:{width:38,height:38,borderRadius:13,backgroundColor:'rgba(255,255,255,.16)',alignItems:'center',justifyContent:'center'},sparkleText:{fontSize:19,color:'#FFF'},heroTitle:{fontSize:22,fontWeight:'900',color:'#FFF',marginTop:14},heroText:{fontSize:11,lineHeight:17,color:'#E0EDFF',marginTop:6},label:{fontSize:13,fontWeight:'900',color:BrandColors.navy,marginBottom:8},inputCard:{backgroundColor:'#FFF',borderWidth:1,borderColor:'#BFDBFE',borderRadius:18,padding:12,shadowColor:'#0A1F44',shadowOpacity:.07,shadowRadius:10,shadowOffset:{width:0,height:4},elevation:2},input:{minHeight:125,fontSize:14,lineHeight:21,color:BrandColors.navy,padding:4},inputFooter:{borderTopWidth:1,borderTopColor:'#E5EEF9',paddingTop:8,flexDirection:'row',justifyContent:'space-between'},voiceHint:{fontSize:9,color:BrandColors.textSecondary},count:{fontSize:9,color:'#94A3B8'},examples:{marginTop:18},examplesTitle:{fontSize:11,fontWeight:'900',color:BrandColors.navy,marginBottom:8},example:{flexDirection:'row',alignItems:'center',padding:10,borderRadius:12,backgroundColor:'#F8FBFF',borderWidth:1,borderColor:'#E5EEF9',marginBottom:7},exampleIcon:{color:BrandColors.indigo,fontSize:12,marginRight:8},exampleText:{flex:1,fontSize:10,color:BrandColors.textSecondary,lineHeight:15},error:{marginTop:12,padding:12,borderRadius:12,backgroundColor:'#FEF2F2',borderWidth:1,borderColor:'#FECACA'},errorText:{fontSize:10,color:'#B91C1C',lineHeight:15},primary:{height:52,borderRadius:15,backgroundColor:BrandColors.indigo,alignItems:'center',justifyContent:'center',marginTop:14},primaryText:{color:'#FFF',fontSize:12,fontWeight:'900'},disabled:{opacity:.5},result:{marginTop:18,backgroundColor:'#FFF',borderRadius:20,borderWidth:1,borderColor:'#BFDBFE',padding:16},resultHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:6},resultEyebrow:{fontSize:8,fontWeight:'900',letterSpacing:1.3,color:BrandColors.indigo},resultTitle:{fontSize:19,fontWeight:'900',color:BrandColors.navy,marginTop:3},ready:{backgroundColor:'#ECFDF5',borderRadius:9,paddingHorizontal:8,paddingVertical:6},readyText:{fontSize:8,fontWeight:'900',color:'#15803D'},req:{paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#EEF3F9'},reqLabel:{fontSize:9,color:BrandColors.textSecondary},reqValue:{fontSize:12,fontWeight:'900',color:BrandColors.navy,marginTop:3},findButton:{height:50,borderRadius:14,backgroundColor:BrandColors.navy,alignItems:'center',justifyContent:'center',marginTop:16},findText:{fontSize:12,fontWeight:'900',color:'#FFF'},edit:{height:42,alignItems:'center',justifyContent:'center'},editText:{fontSize:10,fontWeight:'900',color:BrandColors.indigo}
});