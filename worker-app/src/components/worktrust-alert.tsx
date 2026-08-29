import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BrandColors } from '@/constants/theme';

type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type AlertRequest = {
  title?: string;
  message?: string;
  buttons?: AlertButton[];
};

type Listener = (request: AlertRequest) => void;

let listener: Listener | null = null;

export function showWorkTrustAlert(title?: string, message?: string, buttons?: AlertButton[]) {
  listener?.({ title, message, buttons });
}

export function WorkTrustAlertHost() {
  const [request, setRequest] = useState<AlertRequest | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    listener = setRequest;
    return () => {
      listener = null;
    };
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
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>W</Text>
          </View>

          <Text style={styles.title}>{request.title || 'WorkTrust'}</Text>
          {!!request.message && <Text style={styles.message}>{request.message}</Text>}

          <View style={styles.actions}>
            {buttons.length > 1 && cancel && (
              <Pressable
                onPress={() => close(cancel)}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.secondaryText}>{cancel.text || 'Cancel'}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => close(primary)}
              style={({ pressed }) => [
                styles.primaryButton,
                primary?.style === 'destructive' && styles.destructiveButton,
                pressed && styles.pressed,
              ]}
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 18, 45, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  card: {
    width: Math.min(width - 44, 390),
    borderRadius: 24,
    backgroundColor: BrandColors.white,
    borderWidth: 1,
    borderColor: BrandColors.border,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    shadowColor: BrandColors.navy,
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: BrandColors.skySoft,
    borderWidth: 1,
    borderColor: BrandColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  icon: {
    color: BrandColors.indigo,
    fontSize: 25,
    fontWeight: '900',
  },
  title: {
    color: BrandColors.navy,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
  },
  message: {
    color: BrandColors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  primaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: BrandColors.indigo,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destructiveButton: {
    backgroundColor: BrandColors.danger,
  },
  primaryText: {
    color: BrandColors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  arrow: {
    color: BrandColors.white,
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: BrandColors.skySoft,
    borderWidth: 1,
    borderColor: BrandColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  secondaryText: {
    color: BrandColors.navy,
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
