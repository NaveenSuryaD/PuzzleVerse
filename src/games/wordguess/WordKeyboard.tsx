import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme, type ThemeColors } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { useSettingsStore } from '../../store/useSettingsStore';
import type { KeyState } from './types';

const ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const KEY_GAP = 5;
const KEY_HEIGHT = 54;
const ROW_PADDING = 8;
const REGULAR_KEY_WIDTH = (SCREEN_WIDTH - ROW_PADDING * 2 - KEY_GAP * 9) / 10;
const SPECIAL_KEY_WIDTH = REGULAR_KEY_WIDTH * 1.55;

const isThemeDark = (colors: ThemeColors) => colors.bg === '#16110A';

const getKeyBackground = (state: KeyState, colors: ThemeColors): string => {
  switch (state) {
    case 'correct': return colors.success;
    case 'present': return colors.logic.bg;
    case 'absent':  return isThemeDark(colors) ? '#3A2E22' : '#C8BFB0';
    default:        return colors.surface;
  }
};

const getKeyTextColor = (state: KeyState, colors: ThemeColors): string => {
  if (state === 'present') return colors.logic.ink;
  if (state === 'correct') return isThemeDark(colors) ? colors.bg : '#FFFFFF';
  return colors.ink;
};

interface WordKeyboardProps {
  letterStates: Record<string, KeyState>;
  onKey: (key: string) => void;
  disabled: boolean;
}

export const WordKeyboard: React.FC<WordKeyboardProps> = ({ letterStates, onKey, disabled }) => {
  const colors = useTheme();
  const hapticsEnabled = useSettingsStore(s => s.hapticsEnabled);

  const handleKey = (key: string) => {
    if (disabled) return;
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onKey(key);
  };

  return (
    <View style={styles.keyboard}>
      {ROWS.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map(key => {
            const isSpecial = key === 'ENTER' || key === '⌫';
            const keyState: KeyState = letterStates[key] ?? 'unused';
            const bg = isSpecial ? colors.surface2 : getKeyBackground(keyState, colors);
            const textColor = isSpecial ? colors.ink : getKeyTextColor(keyState, colors);
            const width = isSpecial ? SPECIAL_KEY_WIDTH : REGULAR_KEY_WIDTH;

            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.key,
                  {
                    width,
                    backgroundColor: bg,
                    borderColor: colors.rule,
                  },
                ]}
                onPress={() => handleKey(key)}
                activeOpacity={0.7}
                disabled={disabled}
              >
                {key === '⌫' ? (
                  <Ionicons name="backspace-outline" size={20} color={textColor} />
                ) : (
                  <Text style={[styles.keyText, { color: textColor }]}>
                    {key === 'ENTER' ? 'GO' : key}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  keyboard: {
    paddingHorizontal: ROW_PADDING,
    paddingBottom: 12,
    gap: KEY_GAP,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: KEY_GAP,
  },
  key: {
    height: KEY_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  keyText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    lineHeight: 18,
  },
});
