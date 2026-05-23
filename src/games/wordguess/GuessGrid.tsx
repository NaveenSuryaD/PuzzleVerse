import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { GuessTile } from './GuessTile';
import { useSettingsStore } from '../../store/useSettingsStore';
import type { LetterState } from './types';

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

interface GuessGridProps {
  guesses: string[];
  evaluations: LetterState[][];
  currentGuess: string;
  flipRowIndex: number;   // row currently flipping (-1 = none)
  bounceRowIndex: number; // row doing win bounce (-1 = none)
  shakeRowIndex: number;  // row shaking on invalid input (-1 = none)
}

function GuessRow({
  rowIndex,
  guesses,
  evaluations,
  currentGuess,
  flipRowIndex,
  bounceRowIndex,
  shakeRowIndex,
}: {
  rowIndex: number;
  guesses: string[];
  evaluations: LetterState[][];
  currentGuess: string;
  flipRowIndex: number;
  bounceRowIndex: number;
  shakeRowIndex: number;
}) {
  const reducedMotion = useSettingsStore(s => s.reducedMotion);
  const shakeX = useSharedValue(0);

  React.useEffect(() => {
    if (shakeRowIndex !== rowIndex || reducedMotion) return;
    shakeX.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(-4, { duration: 50 }),
      withTiming(4, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [shakeRowIndex, reducedMotion]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  // Determine the letters and states for this row
  const isSubmitted = rowIndex < guesses.length;
  const isCurrentRow = rowIndex === guesses.length;

  const getLetterAt = (col: number): string => {
    if (isSubmitted) return guesses[rowIndex][col] ?? '';
    if (isCurrentRow) return currentGuess[col] ?? '';
    return '';
  };

  const getStateAt = (col: number): LetterState => {
    if (isSubmitted && evaluations[rowIndex]) return evaluations[rowIndex][col];
    if (isCurrentRow && currentGuess[col]) return 'tbd';
    return 'empty';
  };

  const shouldFlip = isSubmitted && flipRowIndex === rowIndex;
  const shouldBounce = bounceRowIndex === rowIndex;

  return (
    <Animated.View style={[styles.row, shakeStyle]}>
      {Array.from({ length: WORD_LENGTH }, (_, col) => (
        <GuessTile
          key={col}
          letter={getLetterAt(col)}
          state={getStateAt(col)}
          shouldFlip={shouldFlip}
          flipDelay={col * 100}
          shouldBounce={shouldBounce}
          bounceDelay={col * 60}
        />
      ))}
    </Animated.View>
  );
}

export const GuessGrid: React.FC<GuessGridProps> = ({
  guesses,
  evaluations,
  currentGuess,
  flipRowIndex,
  bounceRowIndex,
  shakeRowIndex,
}) => (
  <View style={styles.grid}>
    {Array.from({ length: MAX_GUESSES }, (_, row) => (
      <GuessRow
        key={row}
        rowIndex={row}
        guesses={guesses}
        evaluations={evaluations}
        currentGuess={currentGuess}
        flipRowIndex={flipRowIndex}
        bounceRowIndex={bounceRowIndex}
        shakeRowIndex={shakeRowIndex}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
});
