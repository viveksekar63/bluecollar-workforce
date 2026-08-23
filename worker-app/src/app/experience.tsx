import { useEffect, useMemo, useState } from 'react';
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
  createMyEmploymentHistory,
  deleteMyEmploymentHistory,
  getMyEmploymentHistory,
  type WorkerEmployment,
  type WorkerEmploymentInput,
} from '@/api/worker';
import { BrandColors } from '@/constants/theme';

const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full time' },
  { value: 'PART_TIME', label: 'Part time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'DAILY_WAGE', label: 'Daily wage' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'SELF_EMPLOYED', label: 'Self employed' },
] as const;

const EMPTY_FORM: WorkerEmploymentInput = {
  companyName: '',
  companyAddress: '',
  designation: '',
  startDate: '',
  endDate: '',
  salary: undefined,
  employmentType: undefined,
  supervisorName: '',
  supervisorPhone: '',
  supervisorEmail: '',
  reasonForLeaving: '',
};

export default function ExperienceScreen() {
  const [history, setHistory] = useState<WorkerEmployment[]>([]);
  const [hasExperience, setHasExperience] = useState<boolean | null>(null);
  const [form, setForm] = useState<WorkerEmploymentInput>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    getMyEmploymentHistory()
      .then((records) => {
        if (!mounted) return;
        setHistory(records);
        setHasExperience(records.length > 0 ? true : null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const experienceYears = useMemo(() => {
    if (!history.length) return 0;

    const now = new Date();
    let months = 0;

    for (const item of history) {
      const start = new Date(item.startDate);
      const end = item.endDate ? new Date(item.endDate) : now;
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;

      months += Math.max(
        0,
        (end.getFullYear() - start.getFullYear()) * 12 +
          (end.getMonth() - start.getMonth()),
      );
    }

    return Math.floor(months / 12);
  }, [history]);

  function setField<K extends keyof WorkerEmploymentInput>(
    key: K,
    value: WorkerEmploymentInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function beginAddingExperience() {
    setHasExperience(true);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function chooseNoExperience() {
    setHasExperience(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
  }

  async function saveExperience() {
    if (!form.companyName?.trim()) {
      Alert.alert('Company or workplace required', 'Enter the place where you worked.');
      return;
    }

    if (!form.designation?.trim()) {
      Alert.alert('Work role required', 'Enter your job role or trade.');
      return;
    }

    if (!form.startDate?.trim()) {
      Alert.alert('Start date required', 'Use YYYY-MM-DD format.');
      return;
    }

    const start = new Date(form.startDate);
    const end = form.endDate?.trim() ? new Date(form.endDate) : null;

    if (Number.isNaN(start.getTime())) {
      Alert.alert('Invalid start date', 'Use YYYY-MM-DD format.');
      return;
    }

    if (end && Number.isNaN(end.getTime())) {
      Alert.alert('Invalid end date', 'Use YYYY-MM-DD format.');
      return;
    }

    if (end && end < start) {
      Alert.alert('Invalid date range', 'End date cannot be before start date.');
      return;
    }

    if (saving) return;

    try {
      setSaving(true);

      const payload: WorkerEmploymentInput = {
        ...form,
        companyName: form.companyName!.trim(),
        companyAddress: form.companyAddress?.trim() || undefined,
        designation: form.designation!.trim(),
        startDate: form.startDate!.trim(),
        endDate: form.endDate?.trim() || undefined,
        salary:
          form.salary !== undefined && form.salary !== null && String(form.salary).trim() !== ''
            ? Number(form.salary)
            : undefined,
        employmentType: form.employmentType || undefined,
        supervisorName: form.supervisorName?.trim() || undefined,
        supervisorPhone: form.supervisorPhone?.trim() || undefined,
        supervisorEmail: form.supervisorEmail?.trim() || undefined,
        reasonForLeaving: form.reasonForLeaving?.trim() || undefined,
      };

      const created = await createMyEmploymentHistory(payload);

      setHistory((current) => [created, ...current]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert(
        'Unable to save experience',
        Array.isArray(message) ? message.join('\n') : message ?? 'Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeExperience(id: string) {
    if (saving) return;

    try {
      setSaving(true);
      await deleteMyEmploymentHistory(id);
      setHistory((current) => current.filter((item) => item.id !== id));
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert(
        'Unable to remove experience',
        Array.isArray(message) ? message.join('\n') : message ?? 'Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  function continueToVerification() {
    router.replace('/verification');
  }

  function completeLater() {
    router.replace('/home');
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BrandColors.burgundy} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>STEP 5 OF ONBOARDING</Text>
      <Text style={styles.title}>Tell us about your work experience</Text>
      <Text style={styles.subtitle}>
        Add previous workplaces, trades or jobs. This works for both experienced workers and first-time job seekers.
      </Text>

      <View style={styles.progressCard}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Profile completion</Text>
          <Text style={styles.progressValue}>90%</Text>
        </View>
        <View style={styles.track}>
          <View style={styles.fill} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Have you worked before?</Text>
      <View style={styles.choiceRow}>
        <Pressable
          onPress={beginAddingExperience}
          style={({ pressed }) => [
            styles.choice,
            hasExperience === true && styles.choiceSelected,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.choiceIcon}>✓</Text>
          <Text style={[styles.choiceText, hasExperience === true && styles.choiceTextSelected]}>
            Yes, I have worked
          </Text>
        </Pressable>

        <Pressable
          onPress={chooseNoExperience}
          style={({ pressed }) => [
            styles.choice,
            hasExperience === false && styles.choiceSelected,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.choiceIcon}>○</Text>
          <Text style={[styles.choiceText, hasExperience === false && styles.choiceTextSelected]}>
            No, I am a fresher
          </Text>
        </Pressable>
      </View>

      {history.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View>
              <Text style={styles.summaryLabel}>Total recorded experience</Text>
              <Text style={styles.summaryValue}>{experienceYears} years</Text>
            </View>
            <Text style={styles.summaryCount}>{history.length} workplace{history.length === 1 ? '' : 's'}</Text>
          </View>

          {history.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyMain}>
                <Text style={styles.historyRole}>{item.designation}</Text>
                <Text style={styles.historyCompany}>{item.companyName}</Text>
                <Text style={styles.historyDates}>
                  {item.startDate.slice(0, 10)}
                  {'  –  '}
                  {item.endDate ? item.endDate.slice(0, 10) : 'Present'}
                </Text>
              </View>
              <Pressable
                onPress={() => removeExperience(item.id)}
                style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
              >
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {hasExperience === true && (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.sectionTitle}>{showForm ? 'Add workplace' : 'Work history'}</Text>
            {!showForm ? (
              <Pressable onPress={beginAddingExperience} style={styles.linkButton}>
                <Text style={styles.linkText}>+ Add</Text>
              </Pressable>
            ) : null}
          </View>

          {showForm && (
            <>
              <Field label="Company / workplace" value={form.companyName ?? ''} placeholder="e.g. Hotel ABC" onChange={(value) => setField('companyName', value)} />
              <Field label="Work role / designation" value={form.designation ?? ''} placeholder="e.g. Parota Master" onChange={(value) => setField('designation', value)} />
              <Field label="Workplace address (optional)" value={form.companyAddress ?? ''} placeholder="City / area" onChange={(value) => setField('companyAddress', value)} />
              <View style={styles.rowFields}>
                <View style={styles.halfField}>
                  <Field label="Start date" value={form.startDate ?? ''} placeholder="YYYY-MM-DD" onChange={(value) => setField('startDate', value)} />
                </View>
                <View style={styles.halfField}>
                  <Field label="End date" value={form.endDate ?? ''} placeholder="YYYY-MM-DD" onChange={(value) => setField('endDate', value)} />
                </View>
              </View>

              <Text style={styles.label}>Employment type</Text>
              <View style={styles.options}>
                {EMPLOYMENT_TYPES.map((type) => {
                  const selected = form.employmentType === type.value;
                  return (
                    <Pressable
                      key={type.value}
                      onPress={() => setField('employmentType', type.value)}
                      style={({ pressed }) => [
                        styles.option,
                        selected && styles.optionSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{type.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Field label="Salary / earning (optional)" value={form.salary == null ? '' : String(form.salary)} placeholder="Amount" keyboardType="numeric" onChange={(value) => setField('salary', value ? Number(value.replace(/[^0-9.]/g, '')) : undefined)} />
              <Field label="Supervisor / employer name (optional)" value={form.supervisorName ?? ''} placeholder="Name" onChange={(value) => setField('supervisorName', value)} />
              <Field label="Supervisor phone (optional)" value={form.supervisorPhone ?? ''} placeholder="Phone" keyboardType="phone-pad" onChange={(value) => setField('supervisorPhone', value)} />
              <Field label="Supervisor email (optional)" value={form.supervisorEmail ?? ''} placeholder="Email" keyboardType="email-address" onChange={(value) => setField('supervisorEmail', value)} />
              <Field label="Reason for leaving (optional)" value={form.reasonForLeaving ?? ''} placeholder="Why did you leave?" multiline onChange={(value) => setField('reasonForLeaving', value)} />

              <Pressable
                onPress={saveExperience}
                disabled={saving}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, saving && styles.disabled]}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save Workplace</Text>}
              </Pressable>
            </>
          )}
        </View>
      )}

      {hasExperience === false && (
        <View style={styles.fresherCard}>
          <Text style={styles.fresherTitle}>That's okay.</Text>
          <Text style={styles.fresherText}>
            You can continue as a fresher. Experience is not required to create your worker profile.
          </Text>
        </View>
      )}

      {hasExperience !== null && !showForm && (
        <Pressable
          onPress={continueToVerification}
          disabled={saving}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, saving && styles.disabled]}
        >
          <Text style={styles.primaryText}>Continue to Verification</Text>
        </Pressable>
      )}

      <Pressable onPress={completeLater} style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]} disabled={saving}>
        <Text style={styles.skipText}>Complete later</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={BrandColors.muted}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.textArea]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: BrandColors.background,
    padding: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.background,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: BrandColors.rose,
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: BrandColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: BrandColors.textSecondary,
    marginBottom: 22,
  },
  progressCard: {
    backgroundColor: BrandColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BrandColors.border,
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
    color: BrandColors.text,
  },
  progressValue: {
    fontWeight: '800',
    color: BrandColors.burgundy,
  },
  track: {
    height: 8,
    borderRadius: 8,
    backgroundColor: '#EEE5E7',
    overflow: 'hidden',
  },
  fill: {
    width: '90%',
    height: 8,
    borderRadius: 8,
    backgroundColor: BrandColors.burgundy,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BrandColors.text,
    marginBottom: 10,
  },
  choiceRow: {
    gap: 12,
    marginBottom: 22,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: BrandColors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  choiceSelected: {
    borderColor: BrandColors.burgundy,
    backgroundColor: BrandColors.burgundySoft,
  },
  choiceIcon: {
    color: BrandColors.burgundy,
    fontSize: 22,
    fontWeight: '800',
  },
  choiceText: {
    color: BrandColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  choiceTextSelected: {
    color: BrandColors.burgundy,
  },
  summaryCard: {
    backgroundColor: BrandColors.surface,
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 13,
    color: BrandColors.textSecondary,
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: 22,
    color: BrandColors.burgundy,
    fontWeight: '800',
    marginTop: 2,
  },
  summaryCount: {
    fontSize: 12,
    color: BrandColors.textSecondary,
    fontWeight: '700',
    marginTop: 4,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 14,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: BrandColors.border,
  },
  historyMain: {
    flex: 1,
  },
  historyRole: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.text,
  },
  historyCompany: {
    fontSize: 14,
    color: BrandColors.burgundy,
    fontWeight: '700',
    marginTop: 3,
  },
  historyDates: {
    fontSize: 12,
    color: BrandColors.textSecondary,
    marginTop: 4,
  },
  removeButton: {
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: BrandColors.blushSoft,
  },
  removeText: {
    color: BrandColors.burgundy,
    fontSize: 12,
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: BrandColors.surface,
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  linkText: {
    color: BrandColors.burgundy,
    fontWeight: '800',
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.text,
    marginBottom: 7,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 14,
    backgroundColor: BrandColors.background,
    paddingHorizontal: 14,
    fontSize: 15,
    color: BrandColors.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  rowFields: {
    flexDirection: 'row',
    gap: 10,
  },
  halfField: {
    flex: 1,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  option: {
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: BrandColors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionSelected: {
    borderColor: BrandColors.burgundy,
    backgroundColor: BrandColors.burgundySoft,
  },
  optionText: {
    color: BrandColors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  optionTextSelected: {
    color: BrandColors.burgundy,
  },
  fresherCard: {
    backgroundColor: BrandColors.blushSoft,
    borderWidth: 1,
    borderColor: BrandColors.borderStrong,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  fresherTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: BrandColors.burgundy,
    marginBottom: 5,
  },
  fresherText: {
    fontSize: 14,
    lineHeight: 20,
    color: BrandColors.text,
  },
  primaryButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: BrandColors.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: BrandColors.burgundy,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
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
    color: BrandColors.textSecondary,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
});
