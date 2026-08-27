import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';
import { getEmployerProfile, updateEmployerProfile } from '@/api/employer-profile';
import { useAuthStore } from '@/store/auth';

export default function EmployerProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const employer = useAuthStore((state) => state.employer);
  const updateStore = useAuthStore((state) => state.updateEmployerProfile);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', companyName: '', companyType: '', registrationNo: '', gstNumber: '', description: '' });

  const loadProfile = async () => {
    try {
      const profile = await getEmployerProfile();
      setForm({
        firstName: profile.user.firstName ?? '',
        lastName: profile.user.lastName ?? '',
        companyName: profile.companyName ?? '',
        companyType: profile.companyType ?? '',
        registrationNo: profile.registrationNo ?? '',
        gstNumber: profile.gstNumber ?? '',
        description: profile.description ?? '',
      });
      updateStore(profile.user, { id: profile.id, companyName: profile.companyName, status: profile.status });
    } catch (error) {
      Alert.alert('Unable to load profile', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadProfile(); }, []);

  const save = async () => {
    if (!form.firstName.trim() || !form.companyName.trim()) {
      Alert.alert('Required fields', 'First name and company name are required.');
      return;
    }
    setSaving(true);
    try {
      const profile = await updateEmployerProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        companyName: form.companyName,
        companyType: form.companyType,
        registrationNo: form.registrationNo,
        gstNumber: form.gstNumber,
        description: form.description,
      });
      updateStore(profile.user, { id: profile.id, companyName: profile.companyName, status: profile.status });
      setEditing(false);
      Alert.alert('Profile updated', 'Your employer profile has been saved successfully.');
    } catch (error) {
      Alert.alert('Update failed', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'E';
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Employer';
  const verified = employer?.status === 'ACTIVE' || employer?.status === 'VERIFIED';

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.loading}><ActivityIndicator color={BrandColors.gold} /><Text style={styles.loadingText}>Loading profile…</Text></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable>
          <View style={styles.headerCopy}><Text style={styles.eyebrow}>ACCOUNT</Text><Text style={styles.title}>My Profile</Text></View>
          <Pressable style={styles.editButton} onPress={() => setEditing((value) => !value)}><Text style={styles.editText}>{editing ? 'Cancel' : 'Edit'}</Text></Pressable>
        </View>

        <View style={styles.profileCard}>
          {user?.profilePhotoUrl ? <Image source={{ uri: user.profilePhotoUrl }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>}
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.company}>{employer?.companyName || 'Employer account'}</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{verified ? '✓ VERIFIED EMPLOYER' : 'EMPLOYER ACCOUNT'}</Text></View>
          {editing && <Text style={styles.photoNote}>Profile photo management will be added with the media upload module.</Text>}
        </View>

        <Section title="Personal Information">
          {editing ? <>
            <Field label="First name" value={form.firstName} onChangeText={(value) => setForm({ ...form, firstName: value })} />
            <Field label="Last name" value={form.lastName} onChangeText={(value) => setForm({ ...form, lastName: value })} last />
          </> : <><Info label="Full name" value={name} /><Info label="Email" value={user?.email || 'Not provided'} /><Info label="Phone" value={user?.phone || 'Not provided'} last /></>}
        </Section>

        <Section title="Company Information">
          {editing ? <>
            <Field label="Company name" value={form.companyName} onChangeText={(value) => setForm({ ...form, companyName: value })} />
            <Field label="Company type" value={form.companyType} onChangeText={(value) => setForm({ ...form, companyType: value })} />
            <Field label="Registration number" value={form.registrationNo} onChangeText={(value) => setForm({ ...form, registrationNo: value })} />
            <Field label="GST number" value={form.gstNumber} onChangeText={(value) => setForm({ ...form, gstNumber: value })} />
            <Field label="Description" value={form.description} onChangeText={(value) => setForm({ ...form, description: value })} multiline last />
          </> : <><Info label="Company name" value={employer?.companyName || 'Not provided'} /><Info label="Company type" value={form.companyType || 'Not provided'} /><Info label="Registration number" value={form.registrationNo || 'Not provided'} /><Info label="GST number" value={form.gstNumber || 'Not provided'} /><Info label="Description" value={form.description || 'No company description added'} last /></>}
        </Section>

        <Section title="Account & Verification">
          <Info label="Employer status" value={employer?.status || 'Not available'} />
          <Info label="Profile photo" value={user?.profilePhotoUrl ? 'Uploaded' : 'Not uploaded'} last />
        </Section>

        {editing && <Pressable style={[styles.primary, saving && styles.disabled]} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color={BrandColors.slate} /> : <Text style={styles.primaryText}>Save Changes</Text>}
        </Pressable>}

        <View style={styles.tip}><Text style={styles.tipTitle}>Complete your profile</Text><Text style={styles.tipText}>A complete company profile helps workers understand who they are applying to and builds trust.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <><Text style={styles.sectionTitle}>{title}</Text><View style={styles.card}>{children}</View></>; }
function Info({ label, value, last }: { label: string; value: string; last?: boolean }) { return <View style={[styles.info, !last && styles.infoBorder]}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>; }
function Field({ label, value, onChangeText, multiline, last }: { label: string; value: string; onChangeText: (value: string) => void; multiline?: boolean; last?: boolean }) { return <View style={[styles.info, !last && styles.infoBorder]}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} multiline={multiline} style={[styles.input, multiline && styles.multiline]} placeholder={`Enter ${label.toLowerCase()}`} placeholderTextColor={BrandColors.muted} /></View>; }
function getErrorMessage(error: unknown) { return (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Please try again.'; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background }, content: { padding: 18, paddingBottom: 40 }, headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 }, back: { color: BrandColors.gold, fontSize: 36, lineHeight: 32, marginRight: 10 }, headerCopy: { flex: 1 }, eyebrow: { color: BrandColors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, title: { color: BrandColors.text, fontSize: 28, fontWeight: '900', marginTop: 3 }, editButton: { borderWidth: 1, borderColor: BrandColors.gold, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }, editText: { color: BrandColors.gold, fontSize: 12, fontWeight: '900' }, profileCard: { backgroundColor: BrandColors.slateSoft, borderRadius: 20, borderWidth: 1, borderColor: BrandColors.gold, padding: 24, alignItems: 'center' }, avatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: BrandColors.slate, fontSize: 28, fontWeight: '900' }, name: { color: BrandColors.text, fontSize: 21, fontWeight: '900', marginTop: 13 }, company: { color: BrandColors.textSecondary, fontSize: 13, marginTop: 4 }, badge: { marginTop: 12, borderRadius: 999, borderWidth: 1, borderColor: BrandColors.gold, paddingHorizontal: 12, paddingVertical: 5 }, badgeText: { color: BrandColors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, photoNote: { color: BrandColors.muted, fontSize: 11, textAlign: 'center', marginTop: 12 }, sectionTitle: { color: BrandColors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 20, marginBottom: 9 }, card: { backgroundColor: BrandColors.surface, borderRadius: 18, borderWidth: 1, borderColor: BrandColors.slateBorder, paddingHorizontal: 16 }, info: { paddingVertical: 15 }, infoBorder: { borderBottomWidth: 1, borderBottomColor: BrandColors.slateBorder }, label: { color: BrandColors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 }, value: { color: BrandColors.text, fontSize: 15, fontWeight: '700', marginTop: 5 }, input: { minHeight: 46, borderWidth: 1, borderColor: BrandColors.slateBorder, borderRadius: 10, backgroundColor: BrandColors.slateSoft, color: BrandColors.text, fontSize: 15, paddingHorizontal: 12, marginTop: 7 }, multiline: { minHeight: 90, paddingTop: 12, textAlignVertical: 'top' }, primary: { height: 54, borderRadius: 15, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center', marginTop: 20 }, primaryText: { color: BrandColors.slate, fontSize: 15, fontWeight: '900' }, disabled: { opacity: 0.6 }, tip: { marginTop: 18, padding: 16, borderRadius: 16, backgroundColor: BrandColors.slateSoft, borderWidth: 1, borderColor: BrandColors.slateBorder }, tipTitle: { color: BrandColors.text, fontSize: 14, fontWeight: '900' }, tipText: { color: BrandColors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 5 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center' }, loadingText: { color: BrandColors.textSecondary, marginTop: 10, fontSize: 13 },
});
