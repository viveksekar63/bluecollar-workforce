import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';

const sections = [
  ['Platform Role', 'WorkTrust is a technology platform that helps employers publish job opportunities and manage worker applications. The platform does not guarantee that a particular candidate will be suitable, available or selected for a job.'],
  ['Employer Responsibility', 'Employers are responsible for the accuracy of job information they publish, their hiring decisions, applicable employment requirements and compliance with laws and regulations relevant to their business.'],
  ['Worker Information', 'Information shown in worker profiles or applications is provided through the platform and should be evaluated by the employer using appropriate hiring and verification processes.'],
  ['Verification', 'Where verification services are available, a verification result should not be treated as an absolute guarantee of identity, qualifications, conduct or future performance. Employers remain responsible for making appropriate hiring decisions.'],
  ['Payments & Subscriptions', 'Subscription availability, pricing, billing dates and payment status are subject to the applicable plan and payment provider terms. A successful payment does not by itself guarantee job placement, candidate availability or hiring outcomes.'],
  ['Third-Party Services', 'The app may use third-party services for payments, notifications, hosting, verification and other platform functions. Their own terms and policies may apply.'],
  ['No Guarantee of Results', 'WorkTrust does not guarantee a specific number of applications, hires, response rates, business results or employment outcomes from use of the platform.'],
];

export default function DisclaimerScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} accessibilityLabel="Go back"><Text style={styles.back}>‹</Text></Pressable>
          <View><Text style={styles.eyebrow}>LEGAL</Text><Text style={styles.title}>Disclaimer</Text></View>
        </View>
        <View style={styles.warning}>
          <Text style={styles.warningTitle}>Please read before using the platform</Text>
          <Text style={styles.warningText}>The information below describes important limitations and responsibilities when using WorkTrust.</Text>
        </View>
        {sections.map(([title, body]) => (
          <View key={title} style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
          </View>
        ))}
        <Text style={styles.footer}>WorkTrust • Disclaimer</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background },
  content: { padding: 18, paddingBottom: 42 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  back: { color: BrandColors.gold, fontSize: 36, lineHeight: 32, marginRight: 10 },
  eyebrow: { color: BrandColors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: BrandColors.text, fontSize: 27, fontWeight: '900', marginTop: 3 },
  warning: { backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.gold, borderRadius: 16, padding: 15, marginBottom: 18 },
  warningTitle: { color: BrandColors.text, fontSize: 15, fontWeight: '900' },
  warningText: { color: BrandColors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 5 },
  section: { backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.slateBorder, borderRadius: 15, padding: 15, marginBottom: 10 },
  sectionTitle: { color: BrandColors.gold, fontSize: 14, fontWeight: '900', marginBottom: 6 },
  body: { color: BrandColors.textSecondary, fontSize: 12, lineHeight: 19 },
  footer: { color: BrandColors.muted, fontSize: 10, textAlign: 'center', marginTop: 18 },
});
