import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import AppProviders from '../App';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function NavigationGuard() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // If the app restores into a game route with no tab history, send it home.
    if (segments[0] === 'game') {
      router.replace('/(tabs)');
    }
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <NavigationGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="game/[gameId]" options={{ presentation: 'card' }} />
        <Stack.Screen name="search" options={{ presentation: 'modal', animation: 'fade_from_bottom' }} />
        <Stack.Screen name="privacy" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </AppProviders>
  );
}
