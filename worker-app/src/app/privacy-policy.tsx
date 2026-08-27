import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';

const sections = [
  ['Information We Collect', 'We may collect account details such as your name, phone number, email address, company information, profile information, job postings, applications and subscription or payment-related records needed to provide the service.'],
  ['How We Use Information', 'Information is used to create and manage your account, publish and manage jobs, process applications, provide subscription services, communicate important updates and improve the WorkTrust experience.'],
  ['Payments', 'Payments and recurring billing are processed through our payment service provider. WorkTrust does not ask you to share card credentials directly in the app. Payment information is handled according to the provider’s security and privacy practices.'],
  ['Information Sharing', 'We may share information with service providers that help us operate the platform, process payments, provide notifications, host data or perform required verification and compliance services. We do not sell personal information as a product.'],
  ['Data Security', 'We use reasonable technical and organisational safeguards designed to protect account and transaction information. No internet service can guarantee absolute security.'],
  ['Your Choices', 'You may review and update available account information through your profile and settings. You may also contact the platform support team regarding privacy-related requests.'],
  ['Policy Updates', 'This policy may be updated as the platform, legal requirements or our services change. The latest version will be made available in the app.'],
];

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} accessibilityLabel="Go back"><Text style={styles.back}>‹</Text></Pressable>
          <View><Text style={styles.eyebrow}>LEGAL</Text><Text style={styles.title}>Privacy Policy</Text></View>
        </View>
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Your privacy matters</Text>
          <Text style={styles.noticeText}>This page explains how information is handled when you use the WorkTrust employer experience.</Text>
        </View>
        {sections.map(([title, body]) => (
          <View key={title} style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
          </View>
        ))}
        <Text style={styles.footer}>WorkTrust • Privacy Policy</Text>
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
  notice: { backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.gold, borderRadius: 16, padding: 15, marginBottom: 18 },
  noticeTitle: { color: BrandColors.text, fontSize: 15, fontWeight: '900' },
  noticeText: { color: BrandColors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 5 },
  section: { backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.slateBorder, borderRadius: 15, padding: 15, marginBottom: 10 },
  sectionTitle: { color: BrandColors.gold, fontSize: 14, fontWeight: '900', marginBottom: 6 },
  body: { color: BrandColors.textSecondary, fontSize: 12, lineHeight: 19 },
  footer: { color: BrandColors.muted, fontSize: 10, textAlign: 'center', marginTop: 18 },
});
