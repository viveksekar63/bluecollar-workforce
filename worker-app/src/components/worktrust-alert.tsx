import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandColors } from '@/constants/theme';

type AlertButton = { text?: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' };
type AlertRequest = { title?: string; message?: string; buttons?: AlertButton[] };
type Tone = { icon: string; bg: string; fg: string; label: string };
type Listener = (request: AlertRequest) => void;

let listener: Listener | null = null;

export function showWorkTrustAlert(title?: string, message?: string, buttons?: AlertButton[]) {
  listener?.({ title, message, buttons });
}

function getTone(title?: string): Tone {
  const value = (title || '').toLowerCase();
  if (/success|saved|updated|verified|completed|sent|welcome|created/.test(value)) {
    return { icon: '✓', bg: BrandColors.successSoft, fg: BrandColors.success, label: 'Success' };
  }
  if (/error|failed|invalid|unable|problem|failed|failure/.test(value)) {
    return { icon: '×', bg: '#FEE2E2', fg: BrandColors.danger, label: 'Error' };
  }
  if (/warning|attention|notice|expired|limit/.test(value)) {
    return { icon: '!', bg: '#FEF3C7', fg: '#B45309', label: 'Warning' };
  }
  if (/confirm|delete|remove|logout|cancel/.test(value)) {
    return { icon: '?', bg: BrandColors.skySoft, fg: BrandColors.indigo, label: 'Confirmation' };
  }
  return { icon: 'i', bg: BrandColors.skySoft, fg: BrandColors.indigo, label: 'Information' };
}

export function WorkTrustAlertHost() {
  const [request, setRequest] = useState<AlertRequest | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    listener = setRequest;
    return () => { listener = null; };
  }, []);

  useEffect(() => {
    if (!request) return;
    opacity.setValue(0);
    scale.setValue(0.94);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 8, tension: 90, useNativeDriver: true }),
    ]).start();
  }, [request, opacity, scale]);

  if (!request) return null;

  const tone = getTone(request.title);
  const buttons = request.buttons?.length ? request.buttons : [{ text: 'OK', style: 'default' as const }];
  const primary = buttons.find((button) => button.style !== 'cancel') ?? buttons[buttons.length - 1];
  const cancel = buttons.find((button) => button.style === 'cancel');

  const close = (button?: AlertButton) => {
    setRequest(null);
    requestAnimationFrame(() => button?.onPress?.());
  };

  return (
    <Modal transparent visible animationType="none" onRequestClose={() => close(cancel)} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <View style={styles.topRow}>
            <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
              <Text style={[styles.icon, { color: tone.fg }]}>{tone.icon}</Text>
            </View>
            <View style={styles.brandPill}>
              <View style={styles.brandDot} />
              <Text style={styles.brandText}>WORKTRUST</Text>
            </View>
          </View>

          <Text style={styles.toneLabel}>{tone.label}</Text>
          <Text style={styles.title}>{request.title || tone.label}</Text>
          {!!request.message && <Text style={styles.message}>{request.message}</Text>}

          <View style={styles.actions}>
            {cancel && (
              <Pressable onPress={() => close(cancel)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <Text style={styles.secondaryText}>{cancel.text || 'Cancel'}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => close(primary)}
              style={({ pressed }) => [styles.primaryButton, primary?.style === 'destructive' && styles.destructiveButton, !cancel && styles.fullButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryText}>{primary?.text || 'OK'}</Text>
              <Text style={styles.arrow}>→</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(4,18,45,0.52)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  card: { width: Math.min(width - 44, 390), borderRadius: 26, backgroundColor: BrandColors.white, borderWidth: 1, borderColor: BrandColors.border, padding: 22, shadowColor: BrandColors.navy, shadowOpacity: 0.24, shadowRadius: 26, shadowOffset: { width: 0, height: 14 }, elevation: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconWrap: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 28, fontWeight: '900' },
  brandPill: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 99, backgroundColor: BrandColors.surfaceLight },
  brandDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: BrandColors.indigo },
  brandText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, color: BrandColors.navy },
  toneLabel: { marginTop: 18, fontSize: 11, fontWeight: '800', letterSpacing: 0.7, color: BrandColors.indigo, textTransform: 'uppercase' },
  title: { marginTop: 3, color: BrandColors.navy, fontSize: 22, lineHeight: 28, fontWeight: '900' },
  message: { color: BrandColors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  primaryButton: { flex: 1, minHeight: 50, borderRadius: 15, backgroundColor: BrandColors.indigo, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  fullButton: { flex: 1 },
  destructiveButton: { backgroundColor: BrandColors.danger },
  primaryText: { color: BrandColors.white, fontSize: 15, fontWeight: '900' },
  arrow: { color: BrandColors.white, fontSize: 19, fontWeight: '800', marginLeft: 10 },
  secondaryButton: { flex: 1, minHeight: 50, borderRadius: 15, backgroundColor: BrandColors.white, borderWidth: 1, borderColor: BrandColors.borderStrong, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  secondaryText: { color: BrandColors.indigo, fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
