import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../theme/useTheme';
import { useSettingsStore } from '../../store/useSettingsStore';
import { fonts } from '../../theme/typography';
import { easings } from '../../theme/animations';
import { generateSudoku, type Difficulty } from './generator';
import type { SudokuState } from './types';
import { useGameTimer } from '../../hooks/useGameTimer';
import { usePersistentGameState } from '../../hooks/usePersistentGameState';
import { ResumeGameModal } from '../../components/ResumeGameModal';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_SIZE = Math.min(SCREEN_WIDTH - 22 * 2, 360);
const CELL_SIZE = GRID_SIZE / 9;

interface SudokuSaveState {
  puzzle: ReturnType<typeof generateSudoku>;
  board: number[][];
  notes: number[][][];
  errors: boolean[][];
  difficulty: Difficulty;
}

interface SudokuGameProps {
  difficulty?: Difficulty;
  daily?: boolean;
  onComplete?: (won: boolean, timeSeconds: number) => void;
  paused?: boolean;
  onDifficultyChange?: (d: Difficulty) => void;
}

export const SudokuGame: React.FC<SudokuGameProps> = ({
  difficulty: initialDifficulty,
  daily = false,
  onComplete,
  paused = false,
  onDifficultyChange,
}) => {
  const resolvedInitialDifficulty: Difficulty = initialDifficulty ?? (daily ? 'medium' : 'easy');
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const hapticsEnabled = useSettingsStore(s => s.hapticsEnabled);
  const showTimer = useSettingsStore(s => s.showTimer);
  const reducedMotion = useSettingsStore(s => s.reducedMotion);

  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>(resolvedInitialDifficulty);
  const [generating, setGenerating] = useState(true);

  const timer = useGameTimer();

  // Keep a ref to the current paused value for use inside async callbacks
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // Set to true when a saved game is found but a shell modal is showing (e.g. tutorial),
  // so the ResumeGameModal is deferred until the shell modal is dismissed.
  const resumeWhenUnpausedRef = useRef(false);

  useEffect(() => {
    if (paused) {
      timer.pause();
    } else {
      if (resumeWhenUnpausedRef.current) {
        resumeWhenUnpausedRef.current = false;
        setShowResumeModal(true);
        // Don't resume the timer here — modal handlers (Resume / Start Fresh) start it
      } else {
        timer.resume();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const [displaySeconds, setDisplaySeconds] = useState(0);
  useEffect(() => {
    if (!showTimer) return;
    const id = setInterval(() => setDisplaySeconds(timer.elapsedSeconds), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTimer]);

  const { save, load, clear } = usePersistentGameState<SudokuSaveState>('sudoku');
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SudokuSaveState | null>(null);

  const buildEmptyState = (puzzle: ReturnType<typeof generateSudoku>): SudokuState => ({
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

  const [state, setState] = useState<SudokuState | null>(null);
  const [canUndo, setCanUndo] = useState(false);

  const genTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Undo stack — stored in a ref to avoid stale closures in handlers
  interface HistoryEntry {
    board: number[][];
    notes: Set<number>[][];
    errors: boolean[][];
  }
  const undoStackRef = useRef<HistoryEntry[]>([]);
  const stateRef = useRef<SudokuState | null>(null);
  useEffect(() => { stateRef.current = state; }, [state]);

  const pushUndo = useCallback((s: SudokuState) => {
    undoStackRef.current = [
      ...undoStackRef.current.slice(-49),
      {
        board: s.board.map(row => [...row]),
        notes: s.notes.map(row => row.map(cell => new Set(cell))),
        errors: s.errors.map(row => [...row]),
      },
    ];
    setCanUndo(true);
  }, []);

  const shakeX = useSharedValue(0);
  const gridScale = useSharedValue(1);

  // Mount effect: load saved game or start fresh
  useEffect(() => {
    const checkSaved = async () => {
      const result = await load();
      if (result.found && result.gameState) {
        setPendingSavedState(result.gameState);
        setResumeElapsed(result.elapsedSeconds);
        if (pausedRef.current) {
          // A shell modal (e.g. tutorial) is visible — defer the resume prompt until
          // paused becomes false, so we never show two full-screen modals at once.
          resumeWhenUnpausedRef.current = true;
        } else {
          setShowResumeModal(true);
        }
      } else {
        genTimeoutRef.current = setTimeout(() => {
          const puzzle = generateSudoku(resolvedInitialDifficulty);
          setState(buildEmptyState(puzzle));
          setGenerating(false);
          timer.start();
        }, 60);
      }
    };
    checkSaved();
    return () => { if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save effect — only saves once the user has entered at least one digit,
  // preventing a spurious resume prompt on the very next open.
  useEffect(() => {
    if (state?.isComplete) { clear(); return; }
    if (!state || generating) return;
    const hasUserEntry = state.board.some((row, r) =>
      row.some((val, c) => val !== 0 && !state.puzzle.givens[r][c])
    );
    if (!hasUserEntry) return;
    save({
      puzzle: state.puzzle,
      board: state.board,
      notes: state.notes.map(row => row.map(cell => Array.from(cell))),
      errors: state.errors,
      difficulty: currentDifficulty,
    }, timer.elapsedSeconds);
  }, [state?.board, state?.isComplete, currentDifficulty]);

  // Notify the shell whenever the active difficulty changes
  useEffect(() => {
    onDifficultyChange?.(currentDifficulty);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDifficulty]);

  const handleResume = useCallback(() => {
    setShowResumeModal(false);
    if (pendingSavedState) {
      const restored: SudokuState = {
        puzzle: pendingSavedState.puzzle,
        board: pendingSavedState.board,
        notes: (pendingSavedState.notes as number[][][]).map(row =>
          row.map(cell => new Set<number>(cell))
        ),
        selectedCell: null,
        pencilMode: false,
        errors: pendingSavedState.errors ?? Array.from({ length: 9 }, () => Array(9).fill(false)),
        isComplete: false,
      };
      setState(restored);
      setGenerating(false);
      if (pendingSavedState.difficulty) {
        setCurrentDifficulty(pendingSavedState.difficulty);
      }
    }
    timer.restoreAndResume(resumeElapsed);
    setPendingSavedState(null);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    setShowResumeModal(false);
    clear();
    genTimeoutRef.current = setTimeout(() => {
      const puzzle = generateSudoku(resolvedInitialDifficulty);
      setState(buildEmptyState(puzzle));
      setGenerating(false);
      timer.start();
    }, 60);
    setPendingSavedState(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clear, timer]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const triggerShake = useCallback(() => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (reducedMotion) return;
    shakeX.value = withSequence(
      withTiming(-8, { duration: 50 }), withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }), withTiming(6, { duration: 50 }),
      withTiming(-3, { duration: 50 }), withTiming(3, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [shakeX, hapticsEnabled, reducedMotion]);

  const triggerCelebration = useCallback(() => {
    if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (reducedMotion) return;
    gridScale.value = withSequence(
      withSpring(1.04, easings.bouncySpring),
      withSpring(1.0, easings.spring),
    );
  }, [gridScale, hapticsEnabled, reducedMotion]);

  const checkComplete = useCallback((board: number[][], solution: number[][]): boolean => {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (board[r][c] !== solution[r][c]) return false;
    return true;
  }, []);

  const hasConflict = useCallback((board: number[][], row: number, col: number, value: number): boolean => {
    if (!value) return false;
    for (let c = 0; c < 9; c++) {
      if (c !== col && board[row][c] === value) return true;
    }
    for (let r = 0; r < 9; r++) {
      if (r !== row && board[r][col] === value) return true;
    }
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if ((r !== row || c !== col) && board[r][c] === value) return true;
      }
    }
    return false;
  }, []);

  const handleCellPress = useCallback((row: number, col: number) => {
    if (hapticsEnabled) Haptics.selectionAsync();
    setState(prev => prev ? { ...prev, selectedCell: [row, col] } : prev);
  }, [hapticsEnabled]);

  const handleUndo = useCallback(() => {
    const stack = undoStackRef.current;
    if (stack.length === 0) return;
    const entry = stack[stack.length - 1];
    undoStackRef.current = stack.slice(0, -1);
    setCanUndo(stack.length > 1);
    setState(prev => prev ? {
      ...prev,
      board: entry.board,
      notes: entry.notes,
      errors: entry.errors,
      isComplete: false,
    } : prev);
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [hapticsEnabled]);

  const handleNumberPress = useCallback((num: number) => {
    const cur = stateRef.current;
    if (cur) pushUndo(cur);

    setState(prev => {
      if (!prev || !prev.selectedCell) return prev;
      const [r, c] = prev.selectedCell;
      if (prev.puzzle.givens[r][c]) return prev;

      if (prev.pencilMode) {
        const newNotes = prev.notes.map(row => row.map(cell => new Set(cell)));
        if (newNotes[r][c].has(num)) newNotes[r][c].delete(num);
        else newNotes[r][c].add(num);
        if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return { ...prev, notes: newNotes };
      }

      const newBoard = prev.board.map(row => [...row]);
      newBoard[r][c] = num;
      const newNotes = prev.notes.map(row => row.map(cell => new Set(cell)));
      newNotes[r][c] = new Set();

      // Auto-remove pencil marks in same row, col, and 3×3 box
      const boxR = Math.floor(r / 3) * 3;
      const boxC = Math.floor(c / 3) * 3;
      for (let i = 0; i < 9; i++) {
        newNotes[r][i].delete(num);
        newNotes[i][c].delete(num);
      }
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
          newNotes[boxR + i][boxC + j].delete(num);

      const newErrors = prev.errors.map(row => [...row]);
      // Only flag visible conflicts (same digit in row/col/box), not solution mismatch
      newErrors[r][c] = hasConflict(newBoard, r, c, num);
      // Recheck all peers — resolving a conflict elsewhere may clear their error
      for (let i = 0; i < 9; i++) {
        if (i !== r && newBoard[i][c]) newErrors[i][c] = hasConflict(newBoard, i, c, newBoard[i][c]);
        if (i !== c && newBoard[r][i]) newErrors[r][i] = hasConflict(newBoard, r, i, newBoard[r][i]);
      }
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        const br = boxR + i, bc = boxC + j;
        if ((br !== r || bc !== c) && newBoard[br][bc]) newErrors[br][bc] = hasConflict(newBoard, br, bc, newBoard[br][bc]);
      }
      const isConflict = newErrors[r][c];
      const isComplete = checkComplete(newBoard, prev.puzzle.solution);

      if (isConflict) {
        setTimeout(() => triggerShake(), 0);
      } else {
        if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (isComplete) {
        setTimeout(() => {
          triggerCelebration();
          clear();
          if (onComplete) onComplete(true, timer.elapsedSeconds);
        }, 0);
      }

      return { ...prev, board: newBoard, notes: newNotes, errors: newErrors, isComplete };
    });
  }, [hapticsEnabled, pushUndo, triggerShake, triggerCelebration, checkComplete, hasConflict, onComplete, timer, clear]);

  const handleErase = useCallback(() => {
    const cur = stateRef.current;
    if (cur) pushUndo(cur);
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState(prev => {
      if (!prev || !prev.selectedCell) return prev;
      const [r, c] = prev.selectedCell;
      if (prev.puzzle.givens[r][c]) return prev;
      const newBoard = prev.board.map(row => [...row]);
      newBoard[r][c] = 0;
      const newErrors = prev.errors.map(row => [...row]);
      newErrors[r][c] = false;
      // Recheck peers — erasing may resolve their conflicts
      const boxR = Math.floor(r / 3) * 3;
      const boxC = Math.floor(c / 3) * 3;
      for (let i = 0; i < 9; i++) {
        if (i !== r && newBoard[i][c]) newErrors[i][c] = hasConflict(newBoard, i, c, newBoard[i][c]);
        if (i !== c && newBoard[r][i]) newErrors[r][i] = hasConflict(newBoard, r, i, newBoard[r][i]);
      }
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        const br = boxR + i, bc = boxC + j;
        if ((br !== r || bc !== c) && newBoard[br][bc]) newErrors[br][bc] = hasConflict(newBoard, br, bc, newBoard[br][bc]);
      }
      const newNotes = prev.notes.map(row => row.map(cell => new Set(cell)));
      newNotes[r][c] = new Set();
      return { ...prev, board: newBoard, errors: newErrors, notes: newNotes };
    });
  }, [hapticsEnabled, pushUndo, hasConflict]);

  const togglePencil = useCallback(() => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState(prev => prev ? { ...prev, pencilMode: !prev.pencilMode } : prev);
  }, [hapticsEnabled]);

  const startNewGame = useCallback((d: Difficulty) => {
    if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current);
    setCurrentDifficulty(d);
    setGenerating(true);
    undoStackRef.current = [];
    setCanUndo(false);
    clear();
    genTimeoutRef.current = setTimeout(() => {
      const puzzle = generateSudoku(d);
      setState(buildEmptyState(puzzle));
      setGenerating(false);
      timer.start();
    }, 60);
   
  }, [clear, timer]);

  const gridAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }, { scale: gridScale.value }],
  }));

  const numberCounts = useMemo(() => {
    if (!state) return new Array(10).fill(0);
    const counts = new Array(10).fill(0);
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) {
        const v = state.board[r][c];
        if (v > 0) counts[v]++;
      }
    return counts;
  }, [state]);

  const selectedValue = state?.selectedCell
    ? state.board[state.selectedCell[0]][state.selectedCell[1]]
    : 0;

  // Count filled cells for progress summary
  const filledCount = useMemo(() => {
    if (!state) return 0;
    let count = 0;
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (state.board[r][c] !== 0) count++;
    return count;
  }, [state]);

  const renderCell = (row: number, col: number) => {
    const s = state!;
    const value = s.board[row][col];
    const isSelected = s.selectedCell?.[0] === row && s.selectedCell?.[1] === col;
    const isGiven = s.puzzle.givens[row][col];
    const isError = s.errors[row][col];
    const cellNotes = s.notes[row][col];

    const inSameGroup = s.selectedCell != null && (
      s.selectedCell[0] === row ||
      s.selectedCell[1] === col ||
      (Math.floor(s.selectedCell[0] / 3) === Math.floor(row / 3) &&
       Math.floor(s.selectedCell[1] / 3) === Math.floor(col / 3))
    );
    const isSameNumber = value !== 0 && selectedValue !== 0 && value === selectedValue && !isSelected;
    const hasBorderRight = (col + 1) % 3 === 0 && col !== 8;
    const hasBorderBottom = (row + 1) % 3 === 0 && row !== 8;

    let cellBg: string;
    if (isSelected)         cellBg = colors.logic.bg;
    else if (isError)       cellBg = colors.danger + '30';
    else if (isSameNumber)  cellBg = colors.logic.soft;
    else if (inSameGroup)   cellBg = colors.cellHi;
    else                    cellBg = colors.surface;

    const textColor = isError
      ? colors.danger
      : isGiven
        ? colors.ink
        : colors.logic.ink;

    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        onPress={() => handleCellPress(row, col)}
        style={[
          styles.cell,
          { backgroundColor: cellBg },
          hasBorderRight && styles.borderRight,
          hasBorderBottom && styles.borderBottom,
        ]}
        activeOpacity={0.75}
      >
        {value !== 0 ? (
          <Text style={[styles.cellText, { color: textColor, fontFamily: isGiven ? fonts.extraBold : fonts.bold }]}>
            {value}
          </Text>
        ) : cellNotes.size > 0 ? (
          <View style={styles.notesGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
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
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="🔢"
        gameName="Sudoku"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `${filledCount} of 81 cells filled` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      {/* Header row — difficulty badge only; timer is shown in game header */}
      <View style={styles.headerRow}>
        <View />
        <View style={styles.headerRight}>
          {showTimer && (
            <View style={styles.timerPill}>
              <Ionicons name="time-outline" size={13} color={colors.inkSoft} />
              <Text style={styles.timerText}>{formatTime(displaySeconds)}</Text>
            </View>
          )}
          {state?.pencilMode && (
            <View style={[styles.badge, { backgroundColor: colors.word.bg }]}>
              <Ionicons name="pencil" size={11} color={colors.word.ink} />
              <Text style={[styles.badgeText, { color: colors.word.ink }]}>Notes</Text>
            </View>
          )}
          <View style={[styles.badge, { backgroundColor: colors.logic.bg }]}>
            <Text style={[styles.badgeText, { color: colors.logic.ink }]}>
              {currentDifficulty.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Grid or loading */}
      {generating || !state ? (
        <View style={styles.generatingBox}>
          <ActivityIndicator size="large" color={colors.logic.ink} />
          <Text style={styles.generatingText}>Building puzzle…</Text>
        </View>
      ) : (
        <Animated.View style={[styles.gridWrapper, gridAnimStyle]}>
          <View style={[styles.grid, { borderColor: colors.ink }]}>
            {Array.from({ length: 9 }, (_, row) => (
              <View key={row} style={styles.row}>
                {Array.from({ length: 9 }, (_, col) => renderCell(row, col))}
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Complete banner */}
      {state?.isComplete && (
        <View style={styles.completeBanner}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={styles.completeBannerText}>Solved!</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.completeTime}>{formatTime(timer.elapsedSeconds)}</Text>
        </View>
      )}

      {/* Number pad */}
      <View style={styles.numberPad}>
        <View style={styles.numberRow}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
            const placed = numberCounts[num];
            const remaining = 9 - placed;
            const isDone = remaining === 0;
            const isHighlighted = selectedValue === num && !isDone;
            return (
              <TouchableOpacity
                key={num}
                style={[
                  styles.numberButton,
                  isHighlighted && { borderColor: colors.logic.ink, backgroundColor: colors.logic.bg },
                  isDone && styles.numberButtonDone,
                ]}
                onPress={() => !isDone && handleNumberPress(num)}
                activeOpacity={isDone ? 1 : 0.7}
                disabled={isDone || !!state?.isComplete}
              >
                <Text style={[
                  styles.numberText,
                  isHighlighted && { color: colors.logic.ink },
                  isDone && styles.numberTextDone,
                ]}>
                  {num}
                </Text>
                {isDone ? (
                  <Ionicons name="checkmark" size={9} color={colors.success} />
                ) : (
                  <Text style={[
                    styles.remainingCount,
                    isHighlighted && { color: colors.logic.ink },
                  ]}>
                    {remaining}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action row */}
        <View style={styles.actionRow}>
          <ActionBtn icon="pencil-outline" label="Notes" active={state?.pencilMode ?? false} colors={colors} styles={styles} onPress={togglePencil} />
          <ActionBtn icon="backspace-outline" label="Erase" active={false} colors={colors} styles={styles} onPress={handleErase} />
          <ActionBtn icon="arrow-undo-outline" label="Undo" active={false} disabled={!canUndo} colors={colors} styles={styles} onPress={handleUndo} />
          <ActionBtn icon="refresh-outline" label="New" active={false} colors={colors} styles={styles} onPress={() => startNewGame(currentDifficulty)} />
        </View>
      </View>

      {/* Difficulty selector — hidden in daily mode */}
      {!daily && (
        <View style={styles.diffRow}>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.diffPill, currentDifficulty === d && styles.diffPillActive]}
              onPress={() => startNewGame(d)}
              activeOpacity={0.75}
            >
              <Text style={[styles.diffText, currentDifficulty === d && styles.diffTextActive]}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

interface ActionBtnProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  active: boolean;
  disabled?: boolean;
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
  onPress: () => void;
}

const ActionBtn = ({ icon, label, active, disabled, colors, styles, onPress }: ActionBtnProps) => (
  <TouchableOpacity
    style={[
      styles.actionButton,
      active && { backgroundColor: colors.logic.bg, borderColor: colors.logic.ink },
      disabled && { opacity: 0.35 },
    ]}
    onPress={onPress}
    activeOpacity={0.75}
    disabled={disabled}
  >
    <Ionicons name={icon} size={17} color={active ? colors.logic.ink : colors.inkSoft} />
    <Text style={[styles.actionButtonText, active && { color: colors.logic.ink }]}>{label}</Text>
  </TouchableOpacity>
);

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: GRID_SIZE,
    marginBottom: 12,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderRadius: 999,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  timerText: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    letterSpacing: 1,
    color: colors.ink,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: fonts.extraBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  generatingBox: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  generatingText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.inkSoft,
  },
  gridWrapper: { marginBottom: 12 },
  grid: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    borderWidth: 2.5,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  row: { flexDirection: 'row' },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 0.5,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borderRight: {
    borderRightWidth: 2.5,
    borderRightColor: colors.ink,
  },
  borderBottom: {
    borderBottomWidth: 2.5,
    borderBottomColor: colors.ink,
  },
  cellText: {
    fontSize: CELL_SIZE * 0.52,
    lineHeight: CELL_SIZE * 0.66,
    color: colors.ink,
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
    color: colors.inkSoft,
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    lineHeight: (CELL_SIZE - 4) / 3 + 1,
  },
  completeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: GRID_SIZE,
    backgroundColor: colors.success + '15',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  completeBannerText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.success,
  },
  completeTime: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    letterSpacing: 1,
    color: colors.success,
  },
  numberPad: {
    width: GRID_SIZE,
    marginBottom: 8,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 4,
  },
  numberButton: {
    flex: 1,
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.divider,
    gap: 1,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  numberButtonDone: {
    opacity: 0.45,
  },
  numberText: {
    fontFamily: fonts.bold,
    fontSize: 19,
    color: colors.ink,
    lineHeight: 23,
  },
  numberTextDone: {
    color: colors.inkMuted,
  },
  remainingCount: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: colors.inkMuted,
    lineHeight: 11,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    height: 46,
    backgroundColor: colors.surface,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  actionButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.inkSoft,
  },
  diffRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  diffPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  diffPillActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  diffText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.inkSoft,
  },
  diffTextActive: {
    color: colors.bg,
    fontFamily: fonts.bold,
  },
});
