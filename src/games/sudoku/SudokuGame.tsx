import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { dark as colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { text as typography, fonts } from '../../theme/typography';
import { easings } from '../../theme/animations';
import { generateSudoku, Difficulty } from './generator';
import type { SudokuState } from './types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_SIZE = Math.min(SCREEN_WIDTH - spacing.lg * 2, 360);
const CELL_SIZE = GRID_SIZE / 9;

interface SudokuGameProps {
  difficulty?: Difficulty;
  onComplete?: (timeSeconds: number) => void;
}

export const SudokuGame: React.FC<SudokuGameProps> = ({
  difficulty = 'easy',
  onComplete,
}) => {
  const initState = (): SudokuState => {
    const puzzle = generateSudoku(difficulty);
    return {
      puzzle,
      board: puzzle.board.map(row => [...row]),
      notes: Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => new Set<number>())
      ),
      selectedCell: null,
      pencilMode: false,
      errors: Array.from({ length: 9 }, () => Array(9).fill(false)),
      isComplete: false,
    };
  };

  const [state, setState] = useState<SudokuState>(initState);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Shake animation for wrong input
  const shakeX = useSharedValue(0);
  const gridScale = useSharedValue(1);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(-4, { duration: 50 }),
      withTiming(4, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [shakeX]);

  const triggerCelebration = useCallback(() => {
    gridScale.value = withSequence(
      withSpring(1.04, easings.bouncySpring),
      withSpring(1.0, easings.spring),
    );
  }, [gridScale]);

  const checkComplete = useCallback((board: number[][], solution: number[][]): boolean => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] !== solution[r][c]) return false;
      }
    }
    return true;
  }, []);

  const handleCellPress = useCallback((row: number, col: number) => {
    setState(prev => ({ ...prev, selectedCell: [row, col] }));
  }, []);

  const handleNumberPress = useCallback((num: number) => {
    setState(prev => {
      if (!prev.selectedCell) return prev;
      const [r, c] = prev.selectedCell;
      if (prev.puzzle.givens[r][c]) return prev;

      if (prev.pencilMode) {
        const newNotes = prev.notes.map(row => row.map(cell => new Set(cell)));
        if (newNotes[r][c].has(num)) {
          newNotes[r][c].delete(num);
        } else {
          newNotes[r][c].add(num);
        }
        return { ...prev, notes: newNotes };
      }

      const newBoard = prev.board.map(row => [...row]);
      newBoard[r][c] = num;

      // Clear notes for this cell
      const newNotes = prev.notes.map(row => row.map(cell => new Set(cell)));
      newNotes[r][c] = new Set();

      const newErrors = prev.errors.map(row => [...row]);
      const isWrong = num !== 0 && num !== prev.puzzle.solution[r][c];
      newErrors[r][c] = isWrong;

      const isComplete = !isWrong && checkComplete(newBoard, prev.puzzle.solution);

      // Schedule side effects after state update
      if (isWrong) {
        setTimeout(() => triggerShake(), 0);
      } else if (isComplete) {
        setTimeout(() => {
          triggerCelebration();
          if (timerRef.current) clearInterval(timerRef.current);
          if (onComplete) onComplete(elapsedSeconds);
        }, 0);
      }

      return { ...prev, board: newBoard, notes: newNotes, errors: newErrors, isComplete };
    });
  }, [triggerShake, triggerCelebration, checkComplete, onComplete, elapsedSeconds]);

  const handleErase = useCallback(() => {
    setState(prev => {
      if (!prev.selectedCell) return prev;
      const [r, c] = prev.selectedCell;
      if (prev.puzzle.givens[r][c]) return prev;
      const newBoard = prev.board.map(row => [...row]);
      newBoard[r][c] = 0;
      const newErrors = prev.errors.map(row => [...row]);
      newErrors[r][c] = false;
      const newNotes = prev.notes.map(row => row.map(cell => new Set(cell)));
      newNotes[r][c] = new Set();
      return { ...prev, board: newBoard, errors: newErrors, notes: newNotes };
    });
  }, []);

  const togglePencil = useCallback(() => {
    setState(prev => ({ ...prev, pencilMode: !prev.pencilMode }));
  }, []);

  const handleNewGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsedSeconds(0);
    const puzzle = generateSudoku(difficulty);
    setState({
      puzzle,
      board: puzzle.board.map(row => [...row]),
      notes: Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => new Set<number>())
      ),
      selectedCell: null,
      pencilMode: false,
      errors: Array.from({ length: 9 }, () => Array(9).fill(false)),
      isComplete: false,
    });
    timerRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
  }, [difficulty]);

  const gridAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeX.value },
      { scale: gridScale.value },
    ],
  }));

  const renderCell = (row: number, col: number) => {
    const value = state.board[row][col];
    const isSelected = state.selectedCell?.[0] === row && state.selectedCell?.[1] === col;
    const isGiven = state.puzzle.givens[row][col];
    const isError = state.errors[row][col];
    const cellNotes = state.notes[row][col];

    const sameNumber = value !== 0 && state.selectedCell != null &&
      state.board[state.selectedCell[0]][state.selectedCell[1]] === value;
    const inSameGroup = state.selectedCell != null && (
      state.selectedCell[0] === row ||
      state.selectedCell[1] === col ||
      (Math.floor(state.selectedCell[0] / 3) === Math.floor(row / 3) &&
       Math.floor(state.selectedCell[1] / 3) === Math.floor(col / 3))
    );

    const borderRight = (col + 1) % 3 === 0 && col !== 8;
    const borderBottom = (row + 1) % 3 === 0 && row !== 8;

    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        onPress={() => handleCellPress(row, col)}
        style={[
          styles.cell,
          isSelected && styles.cellSelected,
          !isSelected && inSameGroup && styles.cellHighlighted,
          !isSelected && !inSameGroup && sameNumber && styles.cellSameNumber,
          isGiven && styles.cellGiven,
          isError && styles.cellError,
          borderRight && styles.borderRight,
          borderBottom && styles.borderBottom,
        ]}
        activeOpacity={0.7}
      >
        {value !== 0 ? (
          <Text style={[
            styles.cellText,
            isGiven && styles.cellTextGiven,
            isError && styles.cellTextError,
            isSelected && styles.cellTextSelected,
          ]}>
            {value}
          </Text>
        ) : cellNotes.size > 0 ? (
          <View style={styles.notesGrid}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <Text key={n} style={styles.noteText}>
                {cellNotes.has(n) ? n : ''}
              </Text>
            ))}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Timer */}
      <View style={styles.timerRow}>
        <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
        <View style={styles.difficultyBadge}>
          <Text style={styles.difficultyText}>{state.puzzle.difficulty.toUpperCase()}</Text>
        </View>
      </View>

      {/* Grid */}
      <Animated.View style={[styles.gridWrapper, gridAnimStyle]}>
        <View style={styles.grid}>
          {Array.from({ length: 9 }, (_, row) => (
            <View key={row} style={styles.row}>
              {Array.from({ length: 9 }, (_, col) => renderCell(row, col))}
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Complete Banner */}
      {state.isComplete && (
        <View style={styles.completeBanner}>
          <Text style={styles.completeBannerText}>Puzzle Solved!</Text>
          <Text style={styles.completeTime}>Time: {formatTime(elapsedSeconds)}</Text>
        </View>
      )}

      {/* Number Pad */}
      <View style={styles.numberPad}>
        <View style={styles.numberRow}>
          {[1,2,3,4,5,6,7,8,9].map(num => (
            <TouchableOpacity
              key={num}
              style={styles.numberButton}
              onPress={() => handleNumberPress(num)}
              activeOpacity={0.7}
            >
              <Text style={styles.numberText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, state.pencilMode && styles.actionButtonActive]}
            onPress={togglePencil}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>Notes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleErase}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>Erase</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleNewGame}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>New Game</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Difficulty selector */}
      <View style={styles.difficultyRow}>
        {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
          <TouchableOpacity
            key={d}
            style={[styles.diffPill, state.puzzle.difficulty === d && styles.diffPillActive]}
            onPress={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              setElapsedSeconds(0);
              const puzzle = generateSudoku(d);
              setState({
                puzzle,
                board: puzzle.board.map(row => [...row]),
                notes: Array.from({ length: 9 }, () =>
                  Array.from({ length: 9 }, () => new Set<number>())
                ),
                selectedCell: null,
                pencilMode: false,
                errors: Array.from({ length: 9 }, () => Array(9).fill(false)),
                isComplete: false,
              });
              timerRef.current = setInterval(() => {
                setElapsedSeconds(s => s + 1);
              }, 1000);
            }}
          >
            <Text style={[styles.diffText, state.puzzle.difficulty === d && styles.diffTextActive]}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: GRID_SIZE,
    marginBottom: spacing.md,
  },
  timerText: {
    ...typography.mono,
    color: colors.text.primary,
  },
  difficultyBadge: {
    backgroundColor: colors.brand.primary + '33',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  difficultyText: {
    ...typography.label,
    color: colors.brand.primary,
  },
  gridWrapper: {
    marginBottom: spacing.lg,
  },
  grid: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    borderWidth: 2,
    borderColor: colors.border.strong,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 0.5,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.secondary,
  },
  cellSelected: {
    backgroundColor: colors.brand.primary + '40',
    borderColor: colors.brand.primary,
    borderWidth: 1.5,
  },
  cellHighlighted: {
    backgroundColor: colors.bg.tertiary,
  },
  cellSameNumber: {
    backgroundColor: colors.brand.primary + '20',
  },
  cellGiven: {
    backgroundColor: colors.bg.primary,
  },
  cellError: {
    backgroundColor: colors.error + '30',
  },
  borderRight: {
    borderRightWidth: 2,
    borderRightColor: colors.border.strong,
  },
  borderBottom: {
    borderBottomWidth: 2,
    borderBottomColor: colors.border.strong,
  },
  cellText: {
    fontSize: CELL_SIZE * 0.5,
    fontFamily: fonts.bold,
    color: colors.brand.primary,
    lineHeight: CELL_SIZE * 0.6,
  },
  cellTextGiven: {
    color: colors.text.primary,
  },
  cellTextError: {
    color: colors.error,
  },
  cellTextSelected: {
    color: colors.brand.primary,
  },
  notesGrid: {
    width: CELL_SIZE - 2,
    height: CELL_SIZE - 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 1,
  },
  noteText: {
    width: (CELL_SIZE - 4) / 3,
    height: (CELL_SIZE - 4) / 3,
    fontSize: 7,
    color: colors.text.secondary,
    textAlign: 'center',
    fontFamily: fonts.semiBold,
  },
  completeBanner: {
    backgroundColor: colors.success + '22',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  completeBannerText: {
    ...typography.h2,
    color: colors.success,
  },
  completeTime: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  numberPad: {
    width: GRID_SIZE,
    marginBottom: spacing.md,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  numberButton: {
    width: (GRID_SIZE - spacing.sm * 8) / 9,
    height: 48,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  numberText: {
    ...typography.h2,
    color: colors.text.primary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    height: 44,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  actionButtonActive: {
    backgroundColor: colors.brand.primary + '33',
    borderColor: colors.brand.primary,
  },
  actionButtonText: {
    ...typography.h3,
    color: colors.text.secondary,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  diffPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  diffPillActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  diffText: {
    ...typography.h3,
    color: colors.text.secondary,
  },
  diffTextActive: {
    color: '#FFFFFF',
  },
});
