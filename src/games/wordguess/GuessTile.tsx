import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useTheme, type ThemeColors } from '../../theme/useTheme';
import { useSettingsStore } from '../../store/useSettingsStore';
import { easings } from '../../theme/animations';
import { fonts } from '../../theme/typography';
import type { LetterState } from './types';

const TILE_SIZE = 58;

// Dark mode: bg === '#16110A'
const isThemeDark = (colors: ThemeColors) => colors.bg === '#16110A';

const getTileBackground = (state: LetterState, colors: ThemeColors): string => {
  const dark = isThemeDark(colors);
  switch (state) {
    case 'correct': return colors.success;
    case 'present': return dark ? colors.logic.ink   : colors.logic.bg;   // bright yellow dark / warm gold light
    case 'absent':  return dark ? '#4A4540'           : '#C8BFB0';
    default:        return colors.surface;
  }
};

const getTileBorderColor = (state: LetterState, hasLetter: boolean, colors: ThemeColors): string => {
  if (state === 'tbd' && hasLetter) return colors.divider;
  if (state === 'empty') return colors.rule;
  return 'transparent';
};

const getTileTextColor = (state: LetterState, colors: ThemeColors): string => {
  const dark = isThemeDark(colors);
  if (state === 'present') return dark ? colors.bg : colors.logic.ink;    // dark text on bright yellow
  if (state === 'correct') return dark ? colors.bg : '#FFFFFF';
  if (state === 'absent')  return dark ? '#9A9183' : '#5A5247';
  return colors.ink;
};

interface GuessTileProps {
  letter: string;
  state: LetterState;
  shouldFlip: boolean;
  flipDelay: number;
  shouldBounce: boolean;
  bounceDelay: number;
}

export const GuessTile: React.FC<GuessTileProps> = ({
  letter,
  state,
  shouldFlip,
  flipDelay,
  shouldBounce,
  bounceDelay,
}) => {
  const colors = useTheme();
  const reducedMotion = useSettingsStore(s => s.reducedMotion);
  const [colorRevealed, setColorRevealed] = useState(false);
  const flipProgress = useSharedValue(0);
  const letterScale = useSharedValue(1);
  const bounceY = useSharedValue(0);
  const bounceScale = useSharedValue(1);

  // Letter entry pop
  useEffect(() => {
    if (reducedMotion) return;
    if (letter && state === 'tbd') {
      letterScale.value = withSequence(
        withTiming(1.12, { duration: 80 }),
        withSpring(1, easings.spring),
      );
    } else if (!letter) {
      letterScale.value = 1;
    }
  }, [letter, reducedMotion]);

  // Flip animation
  useEffect(() => {
    if (!shouldFlip) return;
    if (reducedMotion) {
      setColorRevealed(true);
      return;
    }
    setColorRevealed(false);
    flipProgress.value = 0;
    flipProgress.value = withDelay(
      flipDelay,
      withTiming(1, { duration: 300, easing: Easing.linear }),
    );
  }, [shouldFlip, flipDelay, reducedMotion]);

  // Reveal color at midpoint
  useAnimatedReaction(
    () => flipProgress.value,
    (current, prev) => {
      if (prev !== null && prev < 0.5 && current >= 0.5) {
        runOnJS(setColorRevealed)(true);
      }
    },
  );

  // Bounce on winning row
  useEffect(() => {
    if (!shouldBounce || reducedMotion) return;
    bounceY.value = withDelay(
      bounceDelay,
      withSequence(
        withSpring(-12, easings.bouncySpring),
        withSpring(0, easings.spring),
      ),
    );
    bounceScale.value = withDelay(
      bounceDelay,
      withSequence(
        withSpring(1.15, easings.bouncySpring),
        withSpring(1, easings.spring),
      ),
    );
  }, [shouldBounce, bounceDelay, reducedMotion]);

  const animStyle = useAnimatedStyle(() => {
    const angle = interpolate(flipProgress.value, [0, 0.5, 1], [0, 90, 0]);
    return {
      transform: [
        { perspective: 1000 },
        { rotateX: `${angle}deg` },
        { scale: letterScale.value * bounceScale.value },
        { translateY: bounceY.value },
      ],
    };
  });

  const displayState: LetterState = colorRevealed ? state : (letter ? 'tbd' : 'empty');
  const bg = getTileBackground(displayState, colors);
  const border = getTileBorderColor(displayState, !!letter, colors);
  const textColor = getTileTextColor(displayState, colors);

  return (
    <Animated.View style={[styles.tile, { backgroundColor: bg, borderColor: border }, animStyle]}>
      <Text style={[styles.letter, { color: textColor }]}>
        {letter.toUpperCase()}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 6,
    margin: 3,
    overflow: 'hidden',
  },
  letter: {
    fontSize: 22,
    fontFamily: fonts.black,
    width: TILE_SIZE,
    textAlign: 'center',
    lineHeight: 30,
  },
});
