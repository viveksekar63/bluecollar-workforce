import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WORKTRUST_HERO_IMAGE } from '@/constants/worktrust-hero';

const MAROON = '#7B3045';
const MAROON_DARK = '#64263A';
const MAROON_SOFT = '#F6E8EC';
const MAROON_BORDER = '#E7C3CC';
const PAGE = '#FBF9FA';
const TEXT = '#172A46';
const MUTED = '#667085';
const GREEN = '#0E9F6E';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>W</Text>
          </View>
          <View>
            <Text style={styles.brand}>WORKTRUST</Text>
            <Text style={styles.tagline}>Verified people. Trusted work.</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Image
            source={{ uri: WORKTRUST_HERO_IMAGE }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
          />
          <View style={styles.heroTint} />

          <View style={styles.verifiedBadge}>
            <View style={styles.badgeCheck}>
              <Text style={styles.badgeCheckText}>✓</Text>
            </View>
            <View>
              <Text style={styles.badgeEyebrow}>VERIFIED WORK</Text>
              <Text style={styles.badgeTitle}>Skills &amp; experience</Text>
            </View>
          </View>

          <View style={styles.heroMark}>
            <Text style={styles.heroMarkText}>□</Text>
          </View>

          <View style={styles.opportunityBadge}>
            <View style={styles.opportunityIcon} />
            <View style={styles.opportunityCopy}>
              <Text style={styles.badgeEyebrow}>NEW OPPORTUNITY</Text>
              <Text style={styles.badgeTitle}>A job that fits you</Text>
            </View>
          </View>
        </View>

        <View style={styles.copyBlock}>
          <Text style={styles.eyebrow}>ONE APP. TWO WAYS TO WORK.</Text>
          <Text style={styles.title}>Find work. Hire people. Build trust.</Text>
          <Text style={styles.subtitle}>
            WorkTrust brings workers and employers together in one simple, verified platform.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.primaryText}>Sign in</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.secondaryText}>Create an account</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>Worker and Employer access in one app</Text>

        <View style={styles.security}>
          <View style={styles.securityIcon}>
            <Text style={styles.securityIconText}>✓</Text>
          </View>
          <View style={styles.securityCopy}>
            <Text style={styles.securityTitle}>Safe. Secure. Reliable.</Text>
            <Text style={styles.securityText}>
              Your data is protected with industry-leading security.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAGE,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: MAROON,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  logoText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
  },
  brand: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  tagline: {
    color: MUTED,
    fontSize: 10,
    marginTop: 2,
  },
  hero: {
    height: 260,
    borderRadius: 27,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: MAROON_SOFT,
    borderWidth: 1,
    borderColor: MAROON_BORDER,
  },
  heroTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(246,232,236,0.18)',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 34,
    left: 14,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#4A1728',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  badgeCheck: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E6F7F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  badgeCheckText: {
    color: GREEN,
    fontSize: 15,
    fontWeight: '900',
  },
  badgeEyebrow: {
    color: '#C26A7D',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
  },
  badgeTitle: {
    color: TEXT,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  heroMark: {
    position: 'absolute',
    top: 30,
    right: 16,
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: MAROON,
    transform: [{ rotate: '7deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMarkText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  opportunityBadge: {
    position: 'absolute',
    right: 14,
    bottom: 34,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#4A1728',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  opportunityIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#F7E8ED',
    marginRight: 9,
  },
  opportunityCopy: {
    minWidth: 116,
  },
  copyBlock: {
    paddingTop: 27,
  },
  eyebrow: {
    color: '#B85D72',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 11,
  },
  title: {
    color: TEXT,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
    maxWidth: 360,
  },
  actions: {
    marginTop: 38,
    gap: 11,
  },
  primary: {
    height: 55,
    borderRadius: 15,
    backgroundColor: MAROON,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: MAROON_DARK,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  secondary: {
    height: 55,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: MAROON_BORDER,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: MAROON,
    fontSize: 15,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  footer: {
    textAlign: 'center',
    color: '#9A7D86',
    fontSize: 10,
    marginTop: 13,
  },
  security: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 27,
    paddingHorizontal: 8,
  },
  securityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F7F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  securityIconText: {
    color: GREEN,
    fontSize: 18,
    fontWeight: '900',
  },
  securityCopy: {
    flex: 1,
  },
  securityTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '900',
  },
  securityText: {
    color: MUTED,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
});
