import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>WORKTRUST</Text>
        <Text style={styles.title}>Build your work profile. Find better opportunities.</Text>
        <Text style={styles.subtitle}>Create your worker account, complete your profile and move through verification from one place.</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.primary} onPress={() => router.push('/login')}><Text style={styles.primaryText}>Sign in</Text></Pressable>
        <Pressable style={styles.secondary} onPress={() => router.push('/register')}><Text style={styles.secondaryText}>Create worker account</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA', padding: 24, paddingTop: 72, justifyContent: 'space-between' },
  hero: { paddingTop: 40 },
  eyebrow: { fontSize: 13, fontWeight: '800', letterSpacing: 2.5, color: '#2563EB', marginBottom: 16 },
  title: { fontSize: 38, lineHeight: 45, fontWeight: '800', color: '#111827', marginBottom: 16 },
  subtitle: { fontSize: 17, lineHeight: 26, color: '#6B7280' },
  actions: { gap: 12, paddingBottom: 20 },
  primary: { height: 56, borderRadius: 14, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondary: { height: 56, borderRadius: 14, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#1F2937', fontSize: 16, fontWeight: '800' },
});
