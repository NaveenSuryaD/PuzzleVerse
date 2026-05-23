import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';
import { preloadSounds } from './src/audio/sounds';

// Keep splash visible until fonts are ready
SplashScreen.preventAutoHideAsync();

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * AppProviders is the single root wrapper for all global providers:
 *   - Font loading (Nunito family)
 *   - Splash screen lifecycle
 *   - GestureHandlerRootView (required by react-native-gesture-handler)
 *
 * Imported and used by app/_layout.tsx as the outermost shell.
 */
export default function AppProviders({ children }: AppProvidersProps) {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      preloadSounds().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Hold render until fonts are loaded (splash screen stays visible)
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {children}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
