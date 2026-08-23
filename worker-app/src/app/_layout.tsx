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
        <Stack.Screen name="profile" />
        <Stack.Screen name="address" />
        <Stack.Screen name="home" />
        <Stack.Screen name="skills" />
        <Stack.Screen name="profession" />
        <Stack.Screen name="experience" />
      </Stack>
    </>
  );
}
