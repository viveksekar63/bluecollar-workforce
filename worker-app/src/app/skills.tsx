import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import {
  getMyWorkerProfile,
  updateMySkills,
} from '@/api/worker';

const SKILL_OPTIONS = [
  'Electrician',
  'Plumber',
  'Carpenter',
  'Painter',
  'Mason',
  'Welder',
  'AC Technician',
  'Driver',
  'Cleaner',
  'Machine Operator',
  'Security Guard',
  'Cook',
  'Tailor',
  'Gardener',
];

const LANGUAGE_OPTIONS = [
  'Tamil',
  'English',
  'Hindi',
  'Telugu',
  'Kannada',
  'Malayalam',
];

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
        if (!mounted) {
          return;
        }

        setSkills(
          worker.skills?.map((item) => item.skill.name) ?? [],
        );

        setLanguages(
          worker.languages?.map(
            (item) => item.language.name,
          ) ?? [],
        );
      })
      .catch(() => {
        // Profile may not have skills/languages yet.
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  function toggleSkill(skill: string) {
    setSkills((current) =>
      current.includes(skill)
        ? current.filter((item) => item !== skill)
        : [...current, skill],
    );
  }

  function toggleLanguage(language: string) {
    setLanguages((current) =>
      current.includes(language)
        ? current.filter((item) => item !== language)
        : [...current, language],
    );
  }

  function addCustomSkill() {
    const value = customSkill.trim();

    if (!value) {
      return;
    }

    setSkills((current) => {
      if (current.includes(value)) {
        return current;
      }

      return [...current, value];
    });

    setCustomSkill('');
  }

  function addCustomLanguage() {
    const value = customLanguage.trim();

    if (!value) {
      return;
    }

    setLanguages((current) => {
      if (current.includes(value)) {
        return current;
      }

      return [...current, value];
    });

    setCustomLanguage('');
  }

  async function save() {
    if (skills.length === 0) {
      Alert.alert(
        'Select a skill',
        'Please select at least one skill.',
      );
      return;
    }

    if (languages.length === 0) {
      Alert.alert(
        'Select a language',
        'Please select at least one language.',
      );
      return;
    }

    if (saving) {
      return;
    }

    try {
      setSaving(true);

      await updateMySkills({
        skills: skills.map((skill) => skill.trim()).filter(Boolean),
        languages: languages
          .map((language) => language.trim())
          .filter(Boolean),
      });

      /*
       * Do not put router.replace() inside Alert.alert()
       * callback. Expo Web can sometimes keep the route
       * transition blocked until the alert is dismissed.
       *
       * The Documents screen is not created yet, so we
       * temporarily continue to Home.
       */
      setTimeout(() => {
        router.replace('/home');
      }, 100);
    } catch (error: any) {
      const message = error?.response?.data?.message;

      Alert.alert(
        'Unable to save',
        Array.isArray(message)
          ? message.join('\n')
          : message ?? 'Please try again.',
      );

      setSaving(false);
    }
  }

  function completeLater() {
    if (saving) {
      return;
    }

    router.replace('/home');
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.eyebrow}>
        STEP 3 OF ONBOARDING
      </Text>

      <Text style={styles.title}>
        Skills & languages
      </Text>

      <Text style={styles.subtitle}>
        Tell employers what work you can do and
        which languages you can communicate in.
      </Text>

      <View style={styles.progressCard}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>
            Profile completion
          </Text>

          <Text style={styles.progressValue}>
            80%
          </Text>
        </View>

        <View style={styles.track}>
          <View style={styles.fill} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Your skills
      </Text>

      <Text style={styles.helper}>
        Select all the skills you can confidently
        perform.
      </Text>

      <View style={styles.options}>
        {SKILL_OPTIONS.map((skill) => {
          const selected = skills.includes(skill);

          return (
            <Pressable
              key={skill}
              onPress={() => toggleSkill(skill)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  selected && styles.optionTextSelected,
                ]}
              >
                {skill}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.customRow}>
        <TextInput
          value={customSkill}
          onChangeText={setCustomSkill}
          placeholder="Other skill"
          placeholderTextColor="#9CA3AF"
          style={styles.customInput}
          onSubmitEditing={addCustomSkill}
          returnKeyType="done"
        />

        <Pressable
          onPress={addCustomSkill}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.addButtonText}>
            Add
          </Text>
        </Pressable>
      </View>

      {skills.length > 0 && (
        <View style={styles.selectedCard}>
          <Text style={styles.selectedTitle}>
            Selected skills
          </Text>

          <View style={styles.chips}>
            {skills.map((skill) => (
              <Pressable
                key={skill}
                onPress={() => toggleSkill(skill)}
                style={({ pressed }) => [
                  styles.chip,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.chipText}>
                  {skill} ×
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>
        Languages
      </Text>

      <Text style={styles.helper}>
        Select the languages you can communicate in.
      </Text>

      <View style={styles.options}>
        {LANGUAGE_OPTIONS.map((language) => {
          const selected = languages.includes(language);

          return (
            <Pressable
              key={language}
              onPress={() => toggleLanguage(language)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  selected && styles.optionTextSelected,
                ]}
              >
                {language}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.customRow}>
        <TextInput
          value={customLanguage}
          onChangeText={setCustomLanguage}
          placeholder="Other language"
          placeholderTextColor="#9CA3AF"
          style={styles.customInput}
          onSubmitEditing={addCustomLanguage}
          returnKeyType="done"
        />

        <Pressable
          onPress={addCustomLanguage}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.addButtonText}>
            Add
          </Text>
        </Pressable>
      </View>

      {languages.length > 0 && (
        <View style={styles.selectedCard}>
          <Text style={styles.selectedTitle}>
            Selected languages
          </Text>

          <View style={styles.chips}>
            {languages.map((language) => (
              <Pressable
                key={language}
                onPress={() => toggleLanguage(language)}
                style={({ pressed }) => [
                  styles.chip,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.chipText}>
                  {language} ×
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.pressed,
          saving && styles.disabled,
        ]}
        onPress={save}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryText}>
            Save & Continue
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={completeLater}
        style={({ pressed }) => [
          styles.skipButton,
          pressed && styles.pressed,
        ]}
        disabled={saving}
      >
        <Text style={styles.skipText}>
          Complete later
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F7F8FA',
    padding: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F8FA',
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#2563EB',
    marginBottom: 10,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    marginBottom: 22,
  },

  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },

  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  progressLabel: {
    fontWeight: '700',
    color: '#374151',
  },

  progressValue: {
    fontWeight: '800',
    color: '#2563EB',
  },

  track: {
    height: 8,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },

  fill: {
    width: '80%',
    height: 8,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
    marginBottom: 6,
  },

  helper: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 14,
  },

  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },

  option: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  optionSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },

  optionText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '700',
  },

  optionTextSelected: {
    color: '#2563EB',
  },

  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },

  customInput: {
    flex: 1,
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#111827',
  },

  addButton: {
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  selectedCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 22,
  },

  selectedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },

  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  chip: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  chipText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },

  primaryButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  skipButton: {
    alignItems: 'center',
    padding: 16,
  },

  skipText: {
    color: '#6B7280',
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.85,
  },

  disabled: {
    opacity: 0.6,
  },
});