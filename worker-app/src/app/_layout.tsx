import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Platform } from 'react-native';
import EmployerNavigation from '@/components/employer-navigation';
import { BrandColors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

if (Platform.OS === 'web') {
  const nativeAlert = Alert.alert;
  Alert.alert = ((title, message, buttons) => {
    if (!buttons?.length) { window.alert([title, message].filter(Boolean).join('\n')); return; }
    const confirmed = window.confirm([title, message].filter(Boolean).join('\n'));
    const cancelButton = buttons.find((button) => button.style === 'cancel');
    const confirmButton = buttons.find((button) => button.style !== 'cancel') ?? buttons[buttons.length - 1];
    if (confirmed) confirmButton?.onPress?.(); else cancelButton?.onPress?.();
  }) as typeof nativeAlert;
}

export default function RootLayout() {
  const activeRole = useAuthStore((state) => state.activeRole);
  return <><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: BrandColors.background } }}>
    <Stack.Screen name="index" /><Stack.Screen name="login" /><Stack.Screen name="register" /><Stack.Screen name="register-otp" /><Stack.Screen name="role-select" />
    <Stack.Screen name="employer-home" /><Stack.Screen name="employer-find-manpower" /><Stack.Screen name="employer-worker-details" /><Stack.Screen name="employer-jobs" /><Stack.Screen name="employer-job-create" /><Stack.Screen name="employer-job-details" />
    <Stack.Screen name="employer-credits" /><Stack.Screen name="employer-subscription" /><Stack.Screen name="employer-payment-method" /><Stack.Screen name="employer-applications" /><Stack.Screen name="employer-application-details" /><Stack.Screen name="employer-profile" /><Stack.Screen name="employer-settings" />
    <Stack.Screen name="privacy-policy" /><Stack.Screen name="disclaimer" /><Stack.Screen name="profile" /><Stack.Screen name="address" /><Stack.Screen name="work-preferences" /><Stack.Screen name="home" /><Stack.Screen name="skills" /><Stack.Screen name="profession" /><Stack.Screen name="experience" /><Stack.Screen name="verification" /><Stack.Screen name="documents" /><Stack.Screen name="explore" /><Stack.Screen name="job-details" />
  </Stack>{activeRole === 'EMPLOYER' && <EmployerNavigation />}</>;
}
