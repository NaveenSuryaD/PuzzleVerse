import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  showTimer: boolean;
  reducedMotion: boolean;
  onboardingComplete: boolean;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setHapticsEnabled: (v: boolean) => void;
  setSoundEnabled: (v: boolean) => void;
  setShowTimer: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      accentColor: '#6C63FF',
      soundEnabled: false,
      hapticsEnabled: true,
      showTimer: true,
      reducedMotion: false,
      onboardingComplete: false,
      setTheme: (theme) => set({ theme }),
      setHapticsEnabled: (v) => set({ hapticsEnabled: v }),
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setShowTimer: (v) => set({ showTimer: v }),
      setReducedMotion: (v) => set({ reducedMotion: v }),
    }),
    {
      name: 'puzzleverse-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
