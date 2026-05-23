import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
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
import { easings } from '../../theme/animations';
import { fonts } from '../../theme/typography';
import type { LetterState } from './types';

const TILE_SIZE = 58;

// Dark mode: bg === '#16110A'
const isThemeDark = (colors: ThemeColors) => colors.bg === '#16110A';

const getTileBackground = (state: LetterState, colors: ThemeColors): string => {
  switch (state) {
    case 'correct': return colors.success;
    // Present uses logic (yellow) category in both modes
    case 'present': return colors.logic.bg;
    // Absent: clearly distinct from empty surface
    case 'absent':  return isThemeDark(colors) ? '#3A2E22' : '#C8BFB0';
    default:        return colors.surface;
  }
};

const getTileBorderColor = (state: LetterState, hasLetter: boolean, colors: ThemeColors): string => {
  if (state === 'tbd' && hasLetter) return colors.divider;
  if (state === 'empty') return colors.rule;
  return 'transparent';
};

const getTileTextColor = (state: LetterState, colors: ThemeColors): string => {
  if (state === 'present') return colors.logic.ink;
  if (state === 'correct') return isThemeDark(colors) ? colors.bg : '#FFFFFF';
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
  const [colorRevealed, setColorRevealed] = useState(false);
  const flipProgress = useSharedValue(0);
  const letterScale = useSharedValue(1);
  const bounceY = useSharedValue(0);
  const bounceScale = useSharedValue(1);

  // Letter entry pop
  useEffect(() => {
    if (letter && state === 'tbd') {
      letterScale.value = withSequence(
        withTiming(1.12, { duration: 80 }),
        withSpring(1, easings.spring),
      );
    } else if (!letter) {
      letterScale.value = 1;
    }
  }, [letter]);

  // Flip animation
  useEffect(() => {
    if (!shouldFlip) return;
    setColorRevealed(false);
    flipProgress.value = 0;
    flipProgress.value = withDelay(
      flipDelay,
      withTiming(1, { duration: 300, easing: Easing.linear }),
    );
  }, [shouldFlip, flipDelay]);

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
    if (!shouldBounce) return;
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
  }, [shouldBounce, bounceDelay]);

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
      <Animated.Text style={[styles.letter, { color: textColor }]}>
        {letter.toUpperCase()}
      </Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 6,
    margin: 3,
  },
  letter: {
    fontSize: 22,
    fontFamily: fonts.black,
    lineHeight: 26,
  },
});
