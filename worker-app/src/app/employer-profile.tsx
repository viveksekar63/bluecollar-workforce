import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

export default function EmployerProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const employer = useAuthStore((state) => state.employer);
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'E';
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Employer';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable>
          <View style={styles.headerCopy}><Text style={styles.eyebrow}>ACCOUNT</Text><Text style={styles.title}>Profile</Text></View>
        </View>

        <View style={styles.profileCard}>
          {user?.profilePhotoUrl ? <Image source={{ uri: user.profilePhotoUrl }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>}
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.company}>{employer?.companyName || 'Employer account'}</Text>
          <View style={styles.status}><Text style={styles.statusText}>{employer?.status || 'ACTIVE'}</Text></View>
        </View>

        <View style={styles.card}>
          <Info label="Email" value={user?.email || 'Not provided'} />
          <Info label="Phone" value={user?.phone || 'Not provided'} />
          <Info label="Company" value={employer?.companyName || 'Not provided'} />
          <Info label="Account status" value={employer?.status || 'Not available'} last />
        </View>

        <Text style={styles.note}>Your employer profile is used when publishing jobs and communicating with workers.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Info({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return <View style={[styles.info, !last && styles.infoBorder]}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background },
  content: { padding: 18, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  back: { color: BrandColors.gold, fontSize: 36, lineHeight: 32, marginRight: 10 },
  headerCopy: { flex: 1 },
  eyebrow: { color: BrandColors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: BrandColors.text, fontSize: 28, fontWeight: '900', marginTop: 3 },
  profileCard: { backgroundColor: BrandColors.slateSoft, borderRadius: 20, borderWidth: 1, borderColor: BrandColors.gold, padding: 24, alignItems: 'center' },
  avatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: BrandColors.slate, fontSize: 28, fontWeight: '900' },
  name: { color: BrandColors.text, fontSize: 21, fontWeight: '900', marginTop: 13 },
  company: { color: BrandColors.textSecondary, fontSize: 13, marginTop: 4 },
  status: { marginTop: 12, borderRadius: 999, borderWidth: 1, borderColor: BrandColors.gold, paddingHorizontal: 12, paddingVertical: 5 },
  statusText: { color: BrandColors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  card: { marginTop: 16, backgroundColor: BrandColors.surface, borderRadius: 18, borderWidth: 1, borderColor: BrandColors.slateBorder, paddingHorizontal: 16 },
  info: { paddingVertical: 15 },
  infoBorder: { borderBottomWidth: 1, borderBottomColor: BrandColors.slateBorder },
  label: { color: BrandColors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },
  value: { color: BrandColors.text, fontSize: 15, fontWeight: '700', marginTop: 5 },
  note: { color: BrandColors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 16, paddingHorizontal: 4 },
});
