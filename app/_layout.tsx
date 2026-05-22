import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AppProviders from '../App';

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="game/[gameId]" options={{ presentation: 'card' }} />
      </Stack>
    </AppProviders>
  );
}
