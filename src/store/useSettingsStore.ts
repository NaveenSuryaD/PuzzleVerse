import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  theme: 'dark' | 'light' | 'system';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  showTimer: boolean;
  reducedMotion: boolean;
  onboardingComplete: boolean;
  colorBlindMode: boolean;
  hapticIntensity: 'light' | 'medium' | 'strong';
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setHapticsEnabled: (v: boolean) => void;
  setSoundEnabled: (v: boolean) => void;
  setShowTimer: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
  setOnboardingComplete: (v: boolean) => void;
  setColorBlindMode: (v: boolean) => void;
  setHapticIntensity: (v: 'light' | 'medium' | 'strong') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      soundEnabled: true,
      hapticsEnabled: true,
      showTimer: true,
      reducedMotion: false,
      onboardingComplete: false,
      colorBlindMode: false,
      hapticIntensity: 'medium',
      setTheme: (theme) => set({ theme }),
      setHapticsEnabled: (v) => set({ hapticsEnabled: v }),
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setShowTimer: (v) => set({ showTimer: v }),
      setReducedMotion: (v) => set({ reducedMotion: v }),
      setOnboardingComplete: (v) => set({ onboardingComplete: v }),
      setColorBlindMode: (v) => set({ colorBlindMode: v }),
      setHapticIntensity: (v) => set({ hapticIntensity: v }),
    }),
    {
      name: 'puzzleverse-settings-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
