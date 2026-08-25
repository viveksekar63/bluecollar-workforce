import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors } from '@/constants/theme';
import { WORKTRUST_HERO_IMAGE } from '@/constants/worktrust-hero';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <View style={styles.logo}><Text style={styles.logoText}>W</Text></View>
          <View><Text style={styles.brand}>WorkTrust</Text><Text style={styles.tagline}>Verified people. Trusted work.</Text></View>
        </View>

        <View style={styles.hero}>
          <Image source={{ uri: WORKTRUST_HERO_IMAGE }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          <View style={styles.heroShade} />
          <View style={styles.heroContent}>
            <Text style={styles.eyebrow}>ONE APP FOR WORKERS & EMPLOYERS</Text>
            <Text style={styles.title}>Find work.</Text>
            <Text style={styles.title}>Hire people.</Text>
            <Text style={[styles.title, styles.gold]}>Build trust.</Text>
            <Text style={styles.heroSubtitle}>One trusted platform for finding work, hiring people and growing together.</Text>
          </View>
          <View style={styles.trustBadge}><Text style={styles.badgeIcon}>✓</Text><View><Text style={styles.badgeTitle}>Trusted</Text><Text style={styles.badgeText}>Verified workers & employers</Text></View></View>
        </View>

        <View style={styles.features}>
          <Feature icon="◈" title="Trusted" text="Verified workers and employers" />
          <Feature icon="⌖" title="Local" text="Find jobs near you" />
          <Feature icon="♧" title="Simple" text="Easy to connect and manage" />
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.primary} onPress={() => router.push('/login')}><Text style={styles.primaryText}>Continue</Text><Text style={styles.arrow}>→</Text></Pressable>
          <Pressable style={styles.secondary} onPress={() => router.push('/login')}><Text style={styles.secondaryText}>Login</Text></Pressable>
          <Pressable style={styles.create} onPress={() => router.push('/register')}><Text style={styles.createText}>Create an account</Text></Pressable>
        </View>
        <Text style={styles.footer}>One app. Two ways to work. &nbsp;•&nbsp; Safe. Secure. Reliable.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Feature({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <View style={styles.feature}><View style={styles.featureIcon}><Text style={styles.featureIconText}>{icon}</Text></View><Text style={styles.featureTitle}>{title}</Text><Text style={styles.featureText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 22 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  logo: { width: 48, height: 48, borderRadius: 16, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  logoText: { color: BrandColors.slate, fontSize: 28, fontWeight: '900' },
  brand: { color: BrandColors.text, fontSize: 20, fontWeight: '900', letterSpacing: .3 },
  tagline: { color: BrandColors.textSecondary, fontSize: 11, marginTop: 2 },
  hero: { height: 470, borderRadius: 28, overflow: 'hidden', position: 'relative', backgroundColor: BrandColors.slateSoft, borderWidth: 1, borderColor: BrandColors.slateBorder },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,12,16,.58)' },
  heroContent: { flex: 1, justifyContent: 'flex-end', padding: 24, paddingBottom: 88 },
  eyebrow: { color: BrandColors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.6, marginBottom: 10 },
  title: { color: '#fff', fontSize: 36, lineHeight: 40, fontWeight: '900' },
  gold: { color: BrandColors.gold },
  heroSubtitle: { color: '#E5E9EC', fontSize: 14, lineHeight: 20, marginTop: 12, maxWidth: 310 },
  trustBadge: { position: 'absolute', left: 16, bottom: 16, right: 16, borderRadius: 16, backgroundColor: 'rgba(13,20,26,.9)', borderWidth: 1, borderColor: '#5A4A25', padding: 12, flexDirection: 'row', alignItems: 'center' },
  badgeIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: BrandColors.goldSoft, color: BrandColors.gold, textAlign: 'center', lineHeight: 34, fontSize: 18, fontWeight: '900', marginRight: 10 },
  badgeTitle: { color: BrandColors.gold, fontSize: 13, fontWeight: '900' },
  badgeText: { color: BrandColors.textSecondary, fontSize: 10, marginTop: 2 },
  features: { flexDirection: 'row', gap: 8, marginTop: 14 },
  feature: { flex: 1, alignItems: 'center', paddingVertical: 13, paddingHorizontal: 6, backgroundColor: BrandColors.slateSoft, borderRadius: 16, borderWidth: 1, borderColor: BrandColors.slateBorder },
  featureIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: BrandColors.goldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  featureIconText: { color: BrandColors.gold, fontSize: 18 },
  featureTitle: { color: BrandColors.text, fontSize: 12, fontWeight: '900' },
  featureText: { color: BrandColors.muted, fontSize: 9, textAlign: 'center', lineHeight: 13, marginTop: 3 },
  actions: { marginTop: 16, gap: 10 },
  primary: { height: 56, borderRadius: 15, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  primaryText: { color: BrandColors.slate, fontSize: 17, fontWeight: '900' },
  arrow: { position: 'absolute', right: 20, color: BrandColors.slate, fontSize: 27 },
  secondary: { height: 54, borderRadius: 15, borderWidth: 1, borderColor: BrandColors.gold, backgroundColor: BrandColors.slateSoft, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: BrandColors.gold, fontSize: 16, fontWeight: '900' },
  create: { height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  createText: { color: BrandColors.textSecondary, fontSize: 14, fontWeight: '800' },
  footer: { textAlign: 'center', color: BrandColors.muted, fontSize: 10, marginTop: 5 },
});
