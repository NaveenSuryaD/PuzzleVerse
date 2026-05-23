import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { dark, light } from './colors';

export type ThemeColors = typeof dark;

export const useTheme = (): ThemeColors => {
  const theme = useSettingsStore(s => s.theme);
  const deviceScheme = useColorScheme();
  const isDark = theme === 'system' ? deviceScheme !== 'light' : theme === 'dark';
  return isDark ? dark : light;
};
