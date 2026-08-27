import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import EmployerNavigation from '@/components/employer-navigation';
import { useAuthStore } from '@/store/auth';

export default function RootLayout() {
  const activeRole = useAuthStore((state) => state.activeRole);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: '#0D141A' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="register-otp" />
        <Stack.Screen name="role-select" />
        <Stack.Screen name="employer-home" />
        <Stack.Screen name="employer-jobs" />
        <Stack.Screen name="employer-job-create" />
        <Stack.Screen name="employer-job-details" />
        <Stack.Screen name="employer-subscription" />
        <Stack.Screen name="employer-payment-method" />
        <Stack.Screen name="employer-applications" />
        <Stack.Screen name="employer-application-details" />
        <Stack.Screen name="employer-profile" />
        <Stack.Screen name="employer-settings" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="address" />
        <Stack.Screen name="home" />
        <Stack.Screen name="skills" />
        <Stack.Screen name="profession" />
        <Stack.Screen name="experience" />
        <Stack.Screen name="verification" />
        <Stack.Screen name="documents" />
        <Stack.Screen name="explore" />
        <Stack.Screen name="job-details" />
      </Stack>
      {activeRole === 'EMPLOYER' && <EmployerNavigation />}
    </>
  );
}
