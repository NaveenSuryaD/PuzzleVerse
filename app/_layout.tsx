import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AppProviders from '../App';

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="game/[gameId]" options={{ presentation: 'card' }} />
        <Stack.Screen name="search" options={{ presentation: 'modal', animation: 'fade_from_bottom' }} />
        <Stack.Screen name="privacy" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </AppProviders>
  );
}
