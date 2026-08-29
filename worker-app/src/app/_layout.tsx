import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert } from 'react-native';
import EmployerNavigation from '@/components/employer-navigation';
import { WorkTrustAlertHost, showWorkTrustAlert } from '@/components/worktrust-alert';
import { BrandColors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

const nativeAlert = Alert.alert;
Alert.alert = ((title, message, buttons) => {
  showWorkTrustAlert(title, message, buttons);
}) as typeof nativeAlert;

export default function RootLayout() {
  const activeRole = useAuthStore((state) => state.activeRole);
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: BrandColors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="register-otp" />
        <Stack.Screen name="role-select" />
        <Stack.Screen name="employer-home" />
        <Stack.Screen name="employer-find-manpower" />
        <Stack.Screen name="employer-worker-details" />
        <Stack.Screen name="employer-credits" />
        <Stack.Screen name="employer-subscription" />
        <Stack.Screen name="employer-payment-method" />
        <Stack.Screen name="employer-profile" />
        <Stack.Screen name="employer-settings" />
        <Stack.Screen name="privacy-policy" />
        <Stack.Screen name="disclaimer" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="address" />
        <Stack.Screen name="work-preferences" />
        <Stack.Screen name="home" />
        <Stack.Screen name="skills" />
        <Stack.Screen name="profession" />
        <Stack.Screen name="experience" />
        <Stack.Screen name="verification" />
        <Stack.Screen name="documents" />
        <Stack.Screen name="explore" />
      </Stack>
      {activeRole === 'EMPLOYER' && <EmployerNavigation />}
      <WorkTrustAlertHost />
    </>
  );
}
