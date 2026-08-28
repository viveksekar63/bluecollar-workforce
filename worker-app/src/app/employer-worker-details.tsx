import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getManpowerWorker, unlockManpowerWorkerContact } from '@/api/employer-manpower';
import { BrandColors } from '@/constants/theme';

export default function EmployerWorkerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);

  const load = useCallback(async () => {
    try { setWorker(await getManpowerWorker(String(id))); }
    catch { Alert.alert('Unable to load worker', 'Please try again.'); }
    finally { setLoading(false); }
  }, [id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const unlockContact = async () => {
    try {
      setUnlocking(true);
      const result = await unlockManpowerWorkerContact(String(id));
      if (!result?.success) {
        Alert.alert('Contact access', result?.message || 'Unable to unlock contact details.');
        return;
      }
      setWorker((current: any) => ({
        ...current,
        user: { ...(current?.user ?? {}), ...(result.contact ?? {}) },
      }));
      Alert.alert(
        result.alreadyUnlocked ? 'Contact already unlocked' : 'Contact unlocked',
        result.alreadyUnlocked
          ? 'You already have access to this worker contact.'
          : `1 credit used. Remaining credits: ${result.balance}`,
      );
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Unable to unlock contact details.';
      if (String(message).toLowerCase().includes('insufficient credits')) {
        Alert.alert('Not enough credits', 'Please purchase credits to view this worker contact.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Credits', onPress: () => router.push('/employer-credits') },
        ]);
      } else {
        Alert.alert('Contact access', message);
      }
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={BrandColors.gold} /></View></SafeAreaView>;
  if (!worker) return <SafeAreaView style={styles.container}><View style={styles.center}><Text style={styles.title}>Worker not found</Text></View></SafeAreaView>;

  const user = worker.user ?? {};
  const name = `${user.firstName ?? 'Worker'} ${user.lastName ?? ''}`.trim();
  const phone = user.phone;
  const email = user.email;
  const contactUnlocked = Boolean(phone || email);
  const verified = ['VERIFIED', 'COMPLETED', 'APPROVED'].includes(String(worker.verificationStatus ?? '').toUpperCase());

  return <SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><Text style={styles.eyebrow}>WORKER PROFILE</Text></View>
    <View style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text></View><Text style={styles.title}>{name}</Text><Text style={styles.profession}>{worker.profession || 'Worker'}</Text><Text style={styles.code}>{worker.workerCode || 'Worker profile'}</Text></View>
    <View style={styles.badges}><View style={styles.badge}><Text style={styles.badgeText}>{verified ? '✓ VERIFIED' : 'VERIFICATION PENDING'}</Text></View><View style={styles.availability}><Text style={styles.availabilityText}>● {worker.availabilityStatus === 'AVAILABLE' ? 'Available' : 'Availability not confirmed'}</Text></View></View>
    <View style={styles.grid}><Info label="Experience" value={`${Number(worker.experienceYears ?? 0)} years`} /><Info label="Location" value={`${worker.addresses?.[0]?.city ?? 'Not specified'}, ${worker.addresses?.[0]?.state ?? ''}`} /><Info label="Category" value={worker.professionCategory ?? 'Not specified'} /><Info label="Verification score" value={`${worker.verificationScore ?? 0}%`} /></View>
    <View style={styles.card}><Text style={styles.sectionTitle}>Skills</Text><View style={styles.chips}>{(worker.skills ?? []).map((item: any) => <View key={item.skill?.id ?? item.skill?.name} style={styles.chip}><Text style={styles.chipText}>{item.skill?.name}</Text></View>)}</View>{!(worker.skills?.length) && <Text style={styles.muted}>No skills listed.</Text>}</View>
    <View style={styles.card}><Text style={styles.sectionTitle}>About</Text><Text style={styles.body}>{worker.bio || 'No additional profile information available.'}</Text></View>
    {contactUnlocked ? <View style={styles.unlockedCard}>
      <Text style={styles.unlockedIcon}>✓</Text>
      <View style={styles.contactCopy}><Text style={styles.contactTitle}>Contact details unlocked</Text>{phone && <Text style={styles.contactValue}>Phone: {phone}</Text>}{email && <Text style={styles.contactValue}>Email: {email}</Text>}</View>
    </View> : <View style={styles.contactCard}>
      <Text style={styles.lock}>🔒</Text><View style={styles.contactCopy}><Text style={styles.contactTitle}>Contact details are protected</Text><Text style={styles.contactText}>1 credit is used to reveal this worker's phone and email.</Text></View>
      <Pressable disabled={unlocking} style={[styles.contactButton, unlocking && styles.disabled]} onPress={unlockContact}><Text style={styles.contactButtonText}>{unlocking ? '...' : 'View Contact'}</Text></Pressable>
    </View>}
  </ScrollView></SafeAreaView>;
}

function Info({ label, value }: { label: string; value: string }) { return <View style={styles.info}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>; }
const styles = StyleSheet.create({ container:{flex:1,backgroundColor:BrandColors.background},content:{padding:18,paddingBottom:50},center:{flex:1,alignItems:'center',justifyContent:'center'},header:{flexDirection:'row',alignItems:'center',gap:10},back:{color:BrandColors.gold,fontSize:36,lineHeight:32},eyebrow:{color:BrandColors.gold,fontSize:11,fontWeight:'900',letterSpacing:1.5},profile:{alignItems:'center',paddingVertical:20},avatar:{width:82,height:82,borderRadius:41,backgroundColor:BrandColors.slate,borderWidth:1,borderColor:BrandColors.gold,alignItems:'center',justifyContent:'center'},avatarText:{color:BrandColors.gold,fontSize:31,fontWeight:'900'},title:{color:BrandColors.text,fontSize:24,fontWeight:'900',marginTop:10},profession:{color:BrandColors.gold,fontSize:13,fontWeight:'800',marginTop:3},code:{color:BrandColors.muted,fontSize:10,marginTop:4},badges:{flexDirection:'row',gap:8,alignItems:'center'},badge:{borderWidth:1,borderColor:BrandColors.gold,borderRadius:999,paddingHorizontal:10,paddingVertical:6},badgeText:{color:BrandColors.gold,fontSize:9,fontWeight:'900'},availability:{paddingHorizontal:8},availabilityText:{color:'#8FD6A5',fontSize:9,fontWeight:'900'},grid:{flexDirection:'row',flexWrap:'wrap',gap:9,marginTop:14},info:{width:'48%',backgroundColor:BrandColors.slateSoft,borderWidth:1,borderColor:BrandColors.slateBorder,borderRadius:14,padding:13},infoLabel:{color:BrandColors.muted,fontSize:9,fontWeight:'800'},infoValue:{color:BrandColors.text,fontSize:12,fontWeight:'900',marginTop:4},card:{marginTop:12,padding:15,borderRadius:16,backgroundColor:BrandColors.slateSoft,borderWidth:1,borderColor:BrandColors.slateBorder},sectionTitle:{color:BrandColors.text,fontSize:15,fontWeight:'900'},chips:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:9},chip:{borderRadius:999,borderWidth:1,borderColor:BrandColors.slateBorder,paddingHorizontal:10,paddingVertical:6},chipText:{color:BrandColors.textSecondary,fontSize:10,fontWeight:'700'},muted:{color:BrandColors.muted,fontSize:11,marginTop:8},body:{color:BrandColors.textSecondary,fontSize:12,lineHeight:19,marginTop:7},contactCard:{marginTop:14,padding:15,borderRadius:17,borderWidth:1,borderColor:BrandColors.gold,backgroundColor:'#2A2416',flexDirection:'row',alignItems:'center',gap:10},unlockedCard:{marginTop:14,padding:15,borderRadius:17,borderWidth:1,borderColor:BrandColors.gold,backgroundColor:BrandColors.slateSoft,flexDirection:'row',alignItems:'center',gap:10},unlockedIcon:{width:30,height:30,borderRadius:15,backgroundColor:BrandColors.gold,color:BrandColors.slate,textAlign:'center',lineHeight:30,fontWeight:'900'},lock:{fontSize:22},contactCopy:{flex:1},contactTitle:{color:BrandColors.text,fontSize:13,fontWeight:'900'},contactText:{color:BrandColors.textSecondary,fontSize:10,lineHeight:15,marginTop:3},contactValue:{color:BrandColors.textSecondary,fontSize:11,lineHeight:17,marginTop:2},contactButton:{backgroundColor:BrandColors.gold,borderRadius:11,paddingHorizontal:11,paddingVertical:10},contactButtonText:{color:BrandColors.slate,fontSize:10,fontWeight:'900'},disabled:{opacity:0.6}});
