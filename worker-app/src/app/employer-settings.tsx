import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { BrandColors } from '@/constants/theme';

export default function EmployerSettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [applicationAlerts, setApplicationAlerts] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable>
          <View><Text style={styles.eyebrow}>ACCOUNT</Text><Text style={styles.title}>Settings</Text></View>
        </View>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <SettingRow title="Push notifications" description="Receive important account and billing updates." value={notifications} onChange={setNotifications} />
          <SettingRow title="Application alerts" description="Get notified when workers apply to your jobs." value={applicationAlerts} onChange={setApplicationAlerts} last />
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <Pressable style={styles.linkRow} onPress={() => router.push('/employer-profile')}><View><Text style={styles.linkTitle}>Profile</Text><Text style={styles.description}>View your employer account details.</Text></View><Text style={styles.chevron}>›</Text></Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/employer-payment-method')}><View><Text style={styles.linkTitle}>Payment methods</Text><Text style={styles.description}>Manage saved payment methods.</Text></View><Text style={styles.chevron}>›</Text></Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/employer-subscription')}><View><Text style={styles.linkTitle}>My subscription</Text><Text style={styles.description}>View plan, usage and billing status.</Text></View><Text style={styles.chevron}>›</Text></Pressable>
        </View>

        <Text style={styles.version}>WorkTrust Employer • Settings</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ title, description, value, onChange, last }: { title: string; description: string; value: boolean; onChange: (value: boolean) => void; last?: boolean }) {
  return <View style={[styles.settingRow, !last && styles.rowBorder]}><View style={styles.copy}><Text style={styles.linkTitle}>{title}</Text><Text style={styles.description}>{description}</Text></View><Switch value={value} onValueChange={onChange} trackColor={{ false: BrandColors.slateBorder, true: BrandColors.gold }} thumbColor={BrandColors.text} /></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background },
  content: { padding: 18, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  back: { color: BrandColors.gold, fontSize: 36, lineHeight: 32, marginRight: 10 },
  eyebrow: { color: BrandColors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: BrandColors.text, fontSize: 28, fontWeight: '900', marginTop: 3 },
  sectionTitle: { color: BrandColors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.3, textTransform: 'uppercase', marginTop: 10, marginBottom: 9 },
  card: { backgroundColor: BrandColors.surface, borderRadius: 18, borderWidth: 1, borderColor: BrandColors.slateBorder, paddingHorizontal: 15 },
  settingRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: BrandColors.slateBorder },
  copy: { flex: 1, paddingRight: 12 },
  linkRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: BrandColors.slateBorder },
  linkRowLast: { borderBottomWidth: 0 },
  linkTitle: { color: BrandColors.text, fontSize: 14, fontWeight: '800' },
  description: { color: BrandColors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 3 },
  chevron: { color: BrandColors.gold, fontSize: 24 },
  version: { color: BrandColors.muted, textAlign: 'center', fontSize: 10, marginTop: 28 },
});
