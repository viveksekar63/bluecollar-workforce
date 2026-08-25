import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="role-select" />
        <Stack.Screen name="employer-home" />
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
    </>
  );
}
