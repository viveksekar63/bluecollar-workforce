import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import {
  getMyVerification,
  submitVerificationConsent,
  type VerificationCheck,
  type WorkerVerification,
} from '@/api/worker';
import { BrandColors } from '@/constants/theme';

const CHECK_LABELS: Record<string, { title: string; description: string }> = {
  IDENTITY: {
    title: 'Identity verification',
    description: 'Confirm your identity using the documents you provide.',
  },
  ADDRESS: {
    title: 'Address verification',
    description: 'Verify the address you added during onboarding.',
  },
  DOCUMENT: {
    title: 'Document verification',
    description: 'Review and verify supporting documents when required.',
  },
  EMPLOYMENT: {
    title: 'Work experience verification',
    description: 'Confirm previous workplaces or work history when applicable.',
  },
  REFERENCE: {
    title: 'Reference verification',
    description: 'Contact work references when they are available.',
  },
  EDUCATION: {
    title: 'Education verification',
    description: 'Verify education details only when you have provided them.',
  },
  CRIMINAL: {
    title: 'Background check',
    description: 'Run the applicable background verification checks.',
  },
  SKILL: {
    title: 'Skill verification',
    description: 'Validate the skills and trade experience on your profile.',
  },
};

function formatCheckTitle(type: string) {
  return (
    CHECK_LABELS[type]?.title ??
    type
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );
}

function statusLabel(status?: string) {
  switch (status) {
    case 'VERIFIED':
      return 'Verified';
    case 'IN_PROGRESS':
      return 'In progress';
    case 'FAILED':
      return 'Needs attention';
    case 'MANUAL_REVIEW':
      return 'Under review';
    case 'EXPIRED':
      return 'Expired';
    default:
      return 'Pending';
  }
}

function statusStyle(status?: string) {
  if (status === 'VERIFIED') return styles.statusSuccess;
  if (status === 'FAILED') return styles.statusDanger;
  if (status === 'IN_PROGRESS' || status === 'MANUAL_REVIEW') return styles.statusActive;
  return styles.statusPending;
}

export default function VerificationScreen() {
  const [verification, setVerification] = useState<WorkerVerification | null>(null);
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    getMyVerification()
      .then((result) => {
        if (!mounted) return;
        setVerification(result);
        setConsented(result.consents.some((item) => item.consented));
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const checks = verification?.request?.checks ?? [];
  const completedCount = useMemo(
    () => checks.filter((check) => check.status === 'VERIFIED').length,
    [checks],
  );

  const requestStatus = verification?.request?.status ?? verification?.workerStatus;
  const hasRequest = Boolean(verification?.request);
  const isCompleted = requestStatus === 'VERIFIED';

  async function startVerification() {
    if (!consented || saving) return;

    try {
      setSaving(true);
      const result = await submitVerificationConsent();
      setVerification(result);
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert(
        'Unable to start verification',
        Array.isArray(message) ? message.join('\n') : message ?? 'Please try again.',
      );
    } finally {
      setSaving(false);
    }
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
      <Text style={styles.eyebrow}>STEP 6 OF ONBOARDING</Text>
      <Text style={styles.title}>Complete your verification</Text>
      <Text style={styles.subtitle}>
        Verification helps employers trust your profile. The checks are designed for every type of worker — from skilled trades and delivery workers to professionals.
      </Text>

      <View style={styles.progressCard}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Verification progress</Text>
          <Text style={styles.progressValue}>
            {checks.length ? `${completedCount}/${checks.length}` : hasRequest ? '0/0' : 'Ready'}
          </Text>
        </View>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${checks.length ? Math.round((completedCount / checks.length) * 100) : 0}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>What happens next?</Text>
        <Text style={styles.infoText}>
          We will review the information in your profile and complete the checks that apply to you. Some checks may require documents or a manual review.
        </Text>
      </View>

      {checks.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification checks</Text>
          {checks.map((check: VerificationCheck) => {
            const description = CHECK_LABELS[check.type]?.description;

            return (
              <View key={check.id} style={styles.checkCard}>
                <View style={styles.checkIcon}>
                  <Text style={styles.checkIconText}>{check.status === 'VERIFIED' ? '✓' : '•'}</Text>
                </View>
                <View style={styles.checkContent}>
                  <Text style={styles.checkTitle}>{formatCheckTitle(check.type)}</Text>
                  <Text style={styles.checkDescription}>{description}</Text>
                  <View style={[styles.statusPill, statusStyle(check.status)]}>
                    <Text style={styles.statusText}>{statusLabel(check.status)}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {!hasRequest ? (
        <View style={styles.consentCard}>
          <Pressable
            onPress={() => setConsented((current) => !current)}
            style={({ pressed }) => [styles.consentRow, pressed && styles.pressed]}
          >
            <View style={[styles.checkbox, consented && styles.checkboxSelected]}>
              {consented ? <Text style={styles.checkboxTick}>✓</Text> : null}
            </View>
            <Text style={styles.consentText}>
              I consent to the applicable identity, address, document, background, skill, employment, reference and education verification checks for my worker profile.
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        onPress={hasRequest || isCompleted ? () => router.replace('/home') : startVerification}
        disabled={saving || (!hasRequest && !consented)}
        style={({ pressed }) => [
          styles.primaryButton,
          (!hasRequest && !consented) && styles.primaryButtonDisabled,
          pressed && styles.pressed,
        ]}
      >
        {saving ? (
          <ActivityIndicator color={BrandColors.surface} />
        ) : (
          <Text style={styles.primaryButtonText}>
            {isCompleted ? 'Continue to Home' : hasRequest ? 'Continue to Home' : 'Start Verification'}
          </Text>
        )}
      </Pressable>

      {!isCompleted ? (
        <Pressable onPress={() => router.replace('/home')} style={styles.laterButton}>
          <Text style={styles.laterText}>Complete later</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.background,
  },
  container: {
    padding: 16,
    paddingBottom: 36,
    backgroundColor: BrandColors.background,
  },
  eyebrow: {
    color: BrandColors.burgundy,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  title: {
    color: BrandColors.text,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  subtitle: {
    color: BrandColors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  progressCard: {
    backgroundColor: BrandColors.surface,
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: BrandColors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  progressValue: {
    color: BrandColors.burgundy,
    fontSize: 12,
    fontWeight: '800',
  },
  track: {
    height: 6,
    backgroundColor: '#EEE4E5',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 10,
  },
  fill: {
    height: '100%',
    backgroundColor: BrandColors.burgundy,
    borderRadius: 999,
  },
  infoCard: {
    backgroundColor: BrandColors.burgundySoft,
    borderRadius: 14,
    padding: 15,
    marginTop: 12,
  },
  infoTitle: {
    color: BrandColors.burgundyDark,
    fontSize: 14,
    fontWeight: '800',
  },
  infoText: {
    color: BrandColors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  section: {
    marginTop: 22,
  },
  sectionTitle: {
    color: BrandColors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  checkCard: {
    flexDirection: 'row',
    backgroundColor: BrandColors.surface,
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  checkIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BrandColors.blushSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkIconText: {
    color: BrandColors.burgundy,
    fontSize: 18,
    fontWeight: '800',
  },
  checkContent: {
    flex: 1,
  },
  checkTitle: {
    color: BrandColors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  checkDescription: {
    color: BrandColors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: 8,
  },
  statusSuccess: {
    backgroundColor: BrandColors.successSoft,
  },
  statusActive: {
    backgroundColor: BrandColors.burgundySoft,
  },
  statusPending: {
    backgroundColor: BrandColors.blushSoft,
  },
  statusDanger: {
    backgroundColor: '#FBE9EA',
  },
  statusText: {
    color: BrandColors.burgundyDark,
    fontSize: 11,
    fontWeight: '800',
  },
  consentCard: {
    backgroundColor: BrandColors.surface,
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: BrandColors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  checkboxSelected: {
    backgroundColor: BrandColors.burgundy,
    borderColor: BrandColors.burgundy,
  },
  checkboxTick: {
    color: BrandColors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  consentText: {
    flex: 1,
    color: BrandColors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: BrandColors.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: BrandColors.surface,
    fontSize: 15,
    fontWeight: '800',
  },
  laterButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  laterText: {
    color: BrandColors.burgundy,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
