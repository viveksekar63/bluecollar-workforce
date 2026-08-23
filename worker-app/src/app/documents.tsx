import { useEffect, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  deleteMyDocument,
  getMyDocumentUrl,
  getMyDocuments,
  uploadMyDocument,
  type WorkerDocument,
  type WorkerDocumentType,
} from '@/api/documents';
import { BrandColors } from '@/constants/theme';

const OPTIONS: Array<{ type: WorkerDocumentType; title: string; description: string; required?: boolean }> = [
  { type: 'ID_PROOF', title: 'Identity proof', description: 'Aadhaar, passport, voter ID, driving licence or another accepted ID.', required: true },
  { type: 'ADDRESS_PROOF', title: 'Address proof', description: 'A document supporting the current address in your profile.', required: true },
  { type: 'SKILL_CERTIFICATE', title: 'Skill certificate', description: 'Trade, safety, technical or other skill certification if available.' },
  { type: 'EXPERIENCE_LETTER', title: 'Experience letter', description: 'Previous employer or workplace evidence when available.' },
  { type: 'SALARY_SLIP', title: 'Salary slip', description: 'Optional evidence of previous employment or salary.' },
  { type: 'EDUCATION_CERTIFICATE', title: 'Education certificate', description: 'Upload this only if education details were added.' },
  { type: 'OTHER', title: 'Other supporting document', description: 'Any additional document that helps verify your profile.' },
];

function statusLabel(status: string) {
  if (status === 'VERIFIED') return 'Verified';
  if (status === 'FAILED') return 'Needs attention';
  if (status === 'IN_PROGRESS') return 'In review';
  if (status === 'MANUAL_REVIEW') return 'Under review';
  return 'Pending';
}

function formatSize(size: number) {
  return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<WorkerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<WorkerDocumentType | null>(null);
  const [documentNumber, setDocumentNumber] = useState('');

  async function loadDocuments() {
    try {
      setLoading(true);
      setDocuments(await getMyDocuments());
    } catch {
      Alert.alert('Unable to load documents', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  async function pickAndUpload(type: WorkerDocumentType) {
    if (uploading) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      if (asset.size && asset.size > 10 * 1024 * 1024) {
        Alert.alert('File too large', 'Please choose a file smaller than 10 MB.');
        return;
      }

      setUploading(type);
      await uploadMyDocument(type, {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        size: asset.size,
      }, documentNumber);
      setDocumentNumber('');
      await loadDocuments();
      Alert.alert('Document uploaded', 'Your document is now pending verification.');
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert('Upload failed', Array.isArray(message) ? message.join('\n') : message ?? 'Please try again.');
    } finally {
      setUploading(null);
    }
  }

  async function removeDocument(document: WorkerDocument) {
    Alert.alert('Remove document?', document.fileName, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMyDocument(document.id);
            await loadDocuments();
          } catch (error: any) {
            const message = error?.response?.data?.message;
            Alert.alert('Unable to remove', Array.isArray(message) ? message.join('\n') : message ?? 'Please try again.');
          }
        },
      },
    ]);
  }

  async function openDocument(document: WorkerDocument) {
    try {
      const url = document.downloadUrl || (await getMyDocumentUrl(document.id)).url;
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open document', 'Please try again.');
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={BrandColors.burgundy} /></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>‹ Back</Text></Pressable>
      <Text style={styles.eyebrow}>VERIFICATION DOCUMENTS</Text>
      <Text style={styles.title}>Upload your documents</Text>
      <Text style={styles.subtitle}>
        Add clear documents that help us verify your identity, address and skills. Education documents are only relevant when education details exist on your profile.
      </Text>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Keep your documents safe</Text>
        <Text style={styles.noticeText}>Files are stored securely and used for verification and permitted workforce services.</Text>
      </View>

      <View style={styles.numberCard}>
        <Text style={styles.fieldLabel}>Document number (optional)</Text>
        <TextInput
          value={documentNumber}
          onChangeText={setDocumentNumber}
          placeholder="Example: ID / certificate number"
          placeholderTextColor={BrandColors.muted}
          style={styles.input}
          autoCapitalize="characters"
        />
        <Text style={styles.fieldHint}>Leave blank if the document has no number.</Text>
      </View>

      <Text style={styles.sectionTitle}>Available documents</Text>
      {OPTIONS.map((option) => {
        const existing = documents.find((document) => document.type === option.type);
        const isUploading = uploading === option.type;
        return (
          <View key={option.type} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.iconCircle}><Text style={styles.iconText}>▣</Text></View>
              <View style={styles.cardContent}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle}>{option.title}</Text>
                  {option.required ? <Text style={styles.required}>Required</Text> : null}
                </View>
                <Text style={styles.cardDescription}>{option.description}</Text>
              </View>
            </View>

            {existing ? (
              <View style={styles.uploadedBox}>
                <Text style={styles.fileName} numberOfLines={1}>{existing.fileName}</Text>
                <Text style={styles.fileMeta}>{formatSize(existing.fileSize)} · {statusLabel(existing.verificationStatus)}</Text>
                <View style={styles.actionRow}>
                  <Pressable onPress={() => openDocument(existing)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>View</Text></Pressable>
                  {(existing.verificationStatus === 'PENDING' || existing.verificationStatus === 'FAILED') ? (
                    <Pressable onPress={() => removeDocument(existing)} style={styles.removeButton}><Text style={styles.removeButtonText}>Remove</Text></Pressable>
                  ) : null}
                </View>
              </View>
            ) : (
              <Pressable onPress={() => pickAndUpload(option.type)} disabled={Boolean(uploading)} style={({ pressed }) => [styles.uploadButton, pressed && styles.pressed]}>
                {isUploading ? <ActivityIndicator color={BrandColors.surface} /> : <Text style={styles.uploadButtonText}>Choose document</Text>}
              </Pressable>
            )}
          </View>
        );
      })}

      <Pressable onPress={() => router.replace('/verification')} style={styles.continueButton}>
        <Text style={styles.continueButtonText}>Back to Verification</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BrandColors.background },
  container: { padding: 16, paddingBottom: 36, backgroundColor: BrandColors.background },
  backButton: { alignSelf: 'flex-start', paddingVertical: 4, marginBottom: 14 },
  backText: { color: BrandColors.burgundy, fontSize: 14, fontWeight: '800' },
  eyebrow: { color: BrandColors.burgundy, fontSize: 11, fontWeight: '800', letterSpacing: 1.1, marginBottom: 8 },
  title: { color: BrandColors.text, fontSize: 26, fontWeight: '800', lineHeight: 32 },
  subtitle: { color: BrandColors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 8 },
  notice: { backgroundColor: BrandColors.burgundySoft, borderRadius: 14, padding: 15, marginTop: 18 },
  noticeTitle: { color: BrandColors.burgundyDark, fontSize: 14, fontWeight: '800' },
  noticeText: { color: BrandColors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 4 },
  numberCard: { backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 14, padding: 14, marginTop: 12 },
  fieldLabel: { color: BrandColors.text, fontSize: 12, fontWeight: '800' },
  input: { height: 46, borderWidth: 1, borderColor: BrandColors.borderStrong, borderRadius: 10, paddingHorizontal: 12, color: BrandColors.text, marginTop: 8, backgroundColor: BrandColors.background },
  fieldHint: { color: BrandColors.muted, fontSize: 11, marginTop: 6 },
  sectionTitle: { color: BrandColors.text, fontSize: 17, fontWeight: '800', marginTop: 22, marginBottom: 10 },
  card: { backgroundColor: BrandColors.surface, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 14, padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: 'row' },
  iconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: BrandColors.blushSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iconText: { color: BrandColors.burgundy, fontSize: 17, fontWeight: '800' },
  cardContent: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  cardTitle: { color: BrandColors.text, fontSize: 14, fontWeight: '800' },
  required: { color: BrandColors.burgundy, fontSize: 10, fontWeight: '800', backgroundColor: BrandColors.burgundySoft, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, marginLeft: 7 },
  cardDescription: { color: BrandColors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 4 },
  uploadButton: { minHeight: 42, borderRadius: 10, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  uploadButtonText: { color: BrandColors.surface, fontSize: 13, fontWeight: '800' },
  uploadedBox: { backgroundColor: BrandColors.background, borderRadius: 10, padding: 10, marginTop: 12 },
  fileName: { color: BrandColors.text, fontSize: 12, fontWeight: '800' },
  fileMeta: { color: BrandColors.textSecondary, fontSize: 11, marginTop: 3 },
  actionRow: { flexDirection: 'row', marginTop: 9 },
  secondaryButton: { borderWidth: 1, borderColor: BrandColors.borderStrong, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  secondaryButtonText: { color: BrandColors.burgundy, fontSize: 11, fontWeight: '800' },
  removeButton: { borderWidth: 1, borderColor: '#EBC7CB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, marginLeft: 7 },
  removeButtonText: { color: BrandColors.danger, fontSize: 11, fontWeight: '800' },
  continueButton: { minHeight: 50, borderRadius: 12, backgroundColor: BrandColors.burgundy, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  continueButtonText: { color: BrandColors.surface, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.8 },
});
