import { useState } from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

export default function EmployerNavigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const employer = useAuthStore((s) => s.employer);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setActiveRole = useAuthStore((s) => s.setActiveRole);
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'E';
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Employer';
  const navigate = (path: string) => { setOpen(false); router.push(path as never); };
  const logout = () => Alert.alert('Logout', 'Are you sure you want to logout?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Logout', style: 'destructive', onPress: () => { clearSession(); router.replace('/login'); } }]);

  return <>
    <Pressable accessibilityLabel="Open employer menu" style={styles.menuButton} onPress={() => setOpen(true)}><Text style={styles.menuIcon}>☰</Text></Pressable>
    {!open && <View style={styles.bottomBar}>
      <Tab icon="⌂" label="Home" active={pathname === '/employer-home'} onPress={() => navigate('/employer-home')} />
      <Tab icon="⌕" label="Find Workers" active={pathname === '/employer-find-manpower'} onPress={() => navigate('/employer-find-manpower')} />
      <Tab icon="▣" label="My Jobs" active={pathname === '/employer-jobs'} onPress={() => navigate('/employer-jobs')} />
      <Tab icon="▤" label="Credits" active={pathname === '/employer-credits'} onPress={() => navigate('/employer-credits')} />
      <Tab icon="◉" label="Profile" active={pathname === '/employer-profile'} onPress={() => navigate('/employer-profile')} />
    </View>}
    {open && <View style={styles.layer} pointerEvents="box-none"><Pressable style={styles.backdrop} onPress={() => setOpen(false)} /><SafeAreaView style={styles.drawer}>
      <View style={styles.profileHeader}>{user?.profilePhotoUrl ? <Image source={{ uri: user.profilePhotoUrl }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>}<View style={styles.profileCopy}><Text style={styles.name} numberOfLines={1}>{displayName}</Text><Text style={styles.company} numberOfLines={1}>{employer?.companyName || 'Employer account'}</Text><Text style={styles.role}>EMPLOYER</Text></View><Pressable onPress={() => setOpen(false)} style={styles.closeButton}><Text style={styles.close}>×</Text></Pressable></View><View style={styles.divider} />
      <NavItem icon="⌕" label="Find Manpower" onPress={() => navigate('/employer-find-manpower')} /><NavItem icon="▣" label="Contact Purchases" onPress={() => navigate('/employer-contact-purchases')} /><NavItem icon="✓" label="Verification & Trust" onPress={() => navigate('/employer-verification')} /><NavItem icon="₹" label="My Subscription" onPress={() => navigate('/employer-subscription')} /><NavItem icon="▤" label="Payment Methods" onPress={() => navigate('/employer-payment-method')} /><NavItem icon="◉" label="Profile" onPress={() => navigate('/employer-profile')} /><NavItem icon="⚙" label="Settings" onPress={() => navigate('/employer-settings')} />
      <View style={styles.legalSection}><Text style={styles.sectionLabel}>LEGAL</Text><NavItem icon="▤" label="Privacy Policy" onPress={() => navigate('/privacy-policy')} /><NavItem icon="ⓘ" label="Disclaimer" onPress={() => navigate('/disclaimer')} /></View><View style={styles.bottomArea}>{(user?.roles ?? []).includes('WORKER') && <NavItem icon="⇄" label="Switch to Worker" onPress={() => { setOpen(false); setActiveRole('WORKER'); router.replace('/home'); }} />}<Pressable style={styles.logout} onPress={logout}><Text style={styles.logoutIcon}>↪</Text><Text style={styles.logoutText}>Logout</Text></Pressable></View>
    </SafeAreaView></View>}
  </>;
}

function Tab({ icon, label, active, onPress }: { icon:string; label:string; active:boolean; onPress:()=>void }) { return <Pressable style={styles.tab} onPress={onPress}><Text style={[styles.tabIcon, active && styles.tabIconActive]}>{icon}</Text><Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>{label}</Text></Pressable>; }
function NavItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) { return <Pressable style={({ pressed }) => [styles.item, pressed && styles.itemPressed]} onPress={onPress}><Text style={styles.itemIcon}>{icon}</Text><Text style={styles.itemLabel}>{label}</Text><Text style={styles.chevron}>›</Text></Pressable>; }

const styles = StyleSheet.create({
  menuButton:{position:'absolute',top:Platform.OS==='ios'?52:32,left:20,zIndex:150,width:46,height:46,borderRadius:16,backgroundColor:'#EFF6FF',borderWidth:1,borderColor:BrandColors.border,alignItems:'center',justifyContent:'center',shadowColor:'#0A1F44',shadowOpacity:.1,shadowRadius:8,shadowOffset:{width:0,height:3},elevation:4},menuIcon:{color:BrandColors.indigo,fontSize:24,fontWeight:'800',lineHeight:25},bottomBar:{position:'absolute',left:12,right:12,bottom:10,height:74,zIndex:90,borderRadius:22,backgroundColor:'rgba(255,255,255,.97)',borderWidth:1,borderColor:BrandColors.border,flexDirection:'row',alignItems:'center',justifyContent:'space-around',paddingHorizontal:4,shadowColor:'#0A1F44',shadowOpacity:.12,shadowRadius:15,shadowOffset:{width:0,height:5},elevation:8},tab:{flex:1,height:64,alignItems:'center',justifyContent:'center'},tabIcon:{color:'#64748B',fontSize:24,lineHeight:28},tabIconActive:{color:BrandColors.indigo},tabLabel:{color:'#64748B',fontSize:9,fontWeight:'700',marginTop:3},tabLabelActive:{color:BrandColors.indigo,fontWeight:'900'},layer:{...StyleSheet.absoluteFillObject,zIndex:200},backdrop:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(10,31,68,.62)'},drawer:{width:292,maxWidth:'84%',height:'100%',backgroundColor:BrandColors.background,borderRightWidth:1,borderRightColor:BrandColors.border,paddingHorizontal:14,shadowColor:'#000',shadowOpacity:.35,shadowRadius:18,shadowOffset:{width:8,height:0},elevation:18},profileHeader:{flexDirection:'row',alignItems:'center',paddingTop:10,paddingBottom:16},avatar:{width:54,height:54,borderRadius:27,backgroundColor:BrandColors.skySoft,alignItems:'center',justifyContent:'center'},avatarText:{color:BrandColors.navy,fontSize:18,fontWeight:'900'},profileCopy:{flex:1,marginLeft:12},name:{color:BrandColors.text,fontSize:16,fontWeight:'900'},company:{color:BrandColors.textSecondary,fontSize:12,marginTop:3},role:{color:BrandColors.indigo,fontSize:9,fontWeight:'900',letterSpacing:1.3,marginTop:5},closeButton:{width:36,height:36,alignItems:'center',justifyContent:'center'},close:{color:BrandColors.textSecondary,fontSize:28,lineHeight:28},divider:{height:1,backgroundColor:BrandColors.border,marginBottom:10},item:{minHeight:48,borderRadius:12,flexDirection:'row',alignItems:'center',paddingHorizontal:12,marginBottom:3},itemPressed:{backgroundColor:BrandColors.skySoft},itemIcon:{width:30,color:BrandColors.indigo,fontSize:18,textAlign:'center',fontWeight:'800'},itemLabel:{flex:1,color:BrandColors.text,fontSize:14,fontWeight:'700',marginLeft:10},chevron:{color:BrandColors.muted,fontSize:22},legalSection:{marginTop:8,paddingTop:9,borderTopWidth:1,borderTopColor:BrandColors.border},sectionLabel:{color:BrandColors.muted,fontSize:9,fontWeight:'900',letterSpacing:1.4,marginHorizontal:12,marginBottom:3},bottomArea:{marginTop:'auto',paddingBottom:10,borderTopWidth:1,borderTopColor:BrandColors.border,paddingTop:10},logout:{minHeight:52,borderRadius:12,flexDirection:'row',alignItems:'center',paddingHorizontal:12,marginTop:4},logoutIcon:{width:30,color:'#DC2626',fontSize:21,textAlign:'center',fontWeight:'900'},logoutText:{color:'#DC2626',fontSize:14,fontWeight:'800',marginLeft:10}
});
