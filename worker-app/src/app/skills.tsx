import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { getMyWorkerProfile, updateMySkills } from '@/api/worker';
import { BrandColors } from '@/constants/theme';

const SKILL_OPTIONS = ['Electrician', 'Plumber', 'Carpenter', 'Painter', 'Mason', 'Welder', 'AC Technician', 'Driver', 'Cleaner', 'Machine Operator', 'Security Guard', 'Cook', 'Tailor', 'Gardener'];
const LANGUAGE_OPTIONS = ['Tamil', 'English', 'Hindi', 'Telugu', 'Kannada', 'Malayalam'];

export default function SkillsScreen() {
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [customLanguage, setCustomLanguage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    getMyWorkerProfile()
      .then((worker) => {
        if (!mounted) return;
        setSkills(worker.skills?.map((item) => item.skill.name) ?? []);
        setLanguages(worker.languages?.map((item) => item.language.name) ?? []);
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  function toggleSkill(skill: string) {
    setSkills((current) => current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill]);
  }

  function toggleLanguage(language: string) {
    setLanguages((current) => current.includes(language) ? current.filter((item) => item !== language) : [...current, language]);
  }

  function addCustomSkill() {
    const value = customSkill.trim();
    if (!value) return;
    setSkills((current) => current.includes(value) ? current : [...current, value]);
    setCustomSkill('');
  }

  function addCustomLanguage() {
    const value = customLanguage.trim();
    if (!value) return;
    setLanguages((current) => current.includes(value) ? current : [...current, value]);
    setCustomLanguage('');
  }

  async function save() {
    if (skills.length === 0) {
      Alert.alert('Select a skill', 'Please select at least one skill.');
      return;
    }
    if (languages.length === 0) {
      Alert.alert('Select a language', 'Please select at least one language.');
      return;
    }
    if (saving) return;

    try {
      setSaving(true);
      await updateMySkills({
        skills: skills.map((skill) => skill.trim()).filter(Boolean),
        languages: languages.map((language) => language.trim()).filter(Boolean),
      });
      setTimeout(() => router.replace('/home'), 100);
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert('Unable to save', Array.isArray(message) ? message.join('\n') : message ?? 'Please try again.');
      setSaving(false);
    }
  }

  function completeLater() {
    if (!saving) router.replace('/home');
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={BrandColors.burgundy} /></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>STEP 3 OF ONBOARDING</Text>
      <Text style={styles.title}>Skills & languages</Text>
      <Text style={styles.subtitle}>Tell employers what work you can do and which languages you can communicate in.</Text>

      <View style={styles.progressCard}>
        <View style={styles.progressRow}><Text style={styles.progressLabel}>Profile completion</Text><Text style={styles.progressValue}>80%</Text></View>
        <View style={styles.track}><View style={styles.fill} /></View>
      </View>

      <Text style={styles.sectionTitle}>Your skills</Text>
      <Text style={styles.helper}>Select all the skills you can confidently perform.</Text>
      <View style={styles.options}>
        {SKILL_OPTIONS.map((skill) => {
          const selected = skills.includes(skill);
          return <Pressable key={skill} onPress={() => toggleSkill(skill)} style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}><Text style={[styles.optionText, selected && styles.optionTextSelected]}>{skill}</Text></Pressable>;
        })}
      </View>

      <View style={styles.customRow}>
        <TextInput value={customSkill} onChangeText={setCustomSkill} placeholder="Other skill" placeholderTextColor={BrandColors.muted} style={styles.customInput} onSubmitEditing={addCustomSkill} returnKeyType="done" />
        <Pressable onPress={addCustomSkill} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}><Text style={styles.addButtonText}>Add</Text></Pressable>
      </View>

      {skills.length > 0 && <View style={styles.selectedCard}><Text style={styles.selectedTitle}>Selected skills</Text><View style={styles.chips}>{skills.map((skill) => <Pressable key={skill} onPress={() => toggleSkill(skill)} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}><Text style={styles.chipText}>{skill} ×</Text></Pressable>)}</View></View>}

      <Text style={styles.sectionTitle}>Languages</Text>
      <Text style={styles.helper}>Select the languages you can communicate in.</Text>
      <View style={styles.options}>
        {LANGUAGE_OPTIONS.map((language) => {
          const selected = languages.includes(language);
          return <Pressable key={language} onPress={() => toggleLanguage(language)} style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}><Text style={[styles.optionText, selected && styles.optionTextSelected]}>{language}</Text></Pressable>;
        })}
      </View>

      <View style={styles.customRow}>
        <TextInput value={customLanguage} onChangeText={setCustomLanguage} placeholder="Other language" placeholderTextColor={BrandColors.muted} style={styles.customInput} onSubmitEditing={addCustomLanguage} returnKeyType="done" />
        <Pressable onPress={addCustomLanguage} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}><Text style={styles.addButtonText}>Add</Text></Pressable>
      </View>

      {languages.length > 0 && <View style={styles.selectedCard}><Text style={styles.selectedTitle}>Selected languages</Text><View style={styles.chips}>{languages.map((language) => <Pressable key={language} onPress={() => toggleLanguage(language)} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}><Text style={styles.chipText}>{language} ×</Text></Pressable>)}</View></View>}

      <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, saving && styles.disabled]} onPress={save} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save & Continue</Text>}</Pressable>
      <Pressable onPress={completeLater} style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]} disabled={saving}><Text style={styles.skipText}>Complete later</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: BrandColors.background, padding: 24, paddingTop: 56, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BrandColors.background },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: BrandColors.rose, marginBottom: 10 },
  title: { fontSize: 30, fontWeight: '800', color: BrandColors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, color: BrandColors.textSecondary, marginBottom: 22 },
  progressCard: { backgroundColor: BrandColors.surface, borderRadius: 16, borderWidth: 1, borderColor: BrandColors.border, padding: 16, marginBottom: 24 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontWeight: '700', color: BrandColors.text },
  progressValue: { fontWeight: '800', color: BrandColors.burgundy },
  track: { height: 8, borderRadius: 8, backgroundColor: '#EEE5E7', overflow: 'hidden' },
  fill: { width: '80%', height: 8, borderRadius: 8, backgroundColor: BrandColors.burgundy },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: BrandColors.text, marginTop: 4, marginBottom: 6 },
  helper: { fontSize: 14, lineHeight: 20, color: BrandColors.textSecondary, marginBottom: 14 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  option: { borderWidth: 1, borderColor: BrandColors.border, backgroundColor: BrandColors.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  optionSelected: { borderColor: BrandColors.burgundy, backgroundColor: BrandColors.burgundySoft },
  optionText: { color: BrandColors.text, fontSize: 14, fontWeight: '700' },
  optionTextSelected: { color: BrandColors.burgundy },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  customInput: { flex: 1, minHeight: 50, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 14, backgroundColor: BrandColors.surface, paddingHorizontal: 14, fontSize: 15, color: BrandColors.text },
  addButton: { height: 50, paddingHorizontal: 20, borderRadius: 14, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  selectedCard: { backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 16, padding: 16, marginBottom: 22 },
  selectedTitle: { fontSize: 15, fontWeight: '800', color: BrandColors.text, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: BrandColors.blushSoft, borderWidth: 1, borderColor: BrandColors.borderStrong, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { color: BrandColors.burgundy, fontSize: 13, fontWeight: '700' },
  primaryButton: { height: 54, borderRadius: 14, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: BrandColors.burgundy, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  skipButton: { alignItems: 'center', padding: 16 },
  skipText: { color: BrandColors.textSecondary, fontWeight: '700' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
