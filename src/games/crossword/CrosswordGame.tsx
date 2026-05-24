import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { getRandomCrossword } from './puzzles';
import type { CrosswordPuzzle, Direction, ClueEntry } from './types';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../../store/useSettingsStore';
import { playSound } from '../../audio/sounds';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_PAD = 24;
const CELL_SIZE = Math.floor((SCREEN_W - GRID_PAD * 2) / 5);

const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['⌫','Z','X','C','V','B','N','M','✓'],
];

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

function computeNumbers(solution: string[][]): (number | undefined)[][] {
  const nums: (number | undefined)[][] = Array.from({ length: 5 }, () => Array(5).fill(undefined));
  let n = 1;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (solution[r][c] === '#') continue;
      const startA = (c === 0 || solution[r][c - 1] === '#') && c + 1 < 5 && solution[r][c + 1] !== '#';
      const startD = (r === 0 || solution[r - 1][c] === '#') && r + 1 < 5 && solution[r + 1][c] !== '#';
      if (startA || startD) nums[r][c] = n++;
    }
  }
  return nums;
}

function getCellsForClue(clue: ClueEntry): [number, number][] {
  const cells: [number, number][] = [];
  if (clue.direction === 'across') {
    for (let c = clue.col; c < clue.col + clue.length; c++) cells.push([clue.row, c]);
  } else {
    for (let r = clue.row; r < clue.row + clue.length; r++) cells.push([r, clue.col]);
  }
  return cells;
}

export function CrosswordGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const hapticsEnabled = useSettingsStore(st => st.hapticsEnabled);

  const [puzzle, setPuzzle] = useState<CrosswordPuzzle>(() => getRandomCrossword());
  const [userGrid, setUserGrid] = useState<string[][]>(() =>
    puzzle.solution.map(row => row.map(c => (c === '#' ? '#' : ''))),
  );
  const [selectedClue, setSelectedClue] = useState<ClueEntry | null>(null);
  const [direction, setDirection] = useState<Direction>('across');
  const [cursorIdx, setCursorIdx] = useState(0);
  const [errorCells, setErrorCells] = useState<Set<string>>(new Set());
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);

  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);
  const lastTappedRef = useRef<string | null>(null);

  // Clue list scroll
  const clueScrollRef = useRef<ScrollView>(null);
  const clueYPositions = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const cellNumbers = useMemo(() => computeNumbers(puzzle.solution), [puzzle]);

  const selectedCells = useMemo((): Set<string> => {
    if (!selectedClue) return new Set();
    return new Set(getCellsForClue(selectedClue).map(([r, c]) => `${r}-${c}`));
  }, [selectedClue]);

  const cursorCellKey = useMemo(() => {
    if (!selectedClue) return null;
    const cells = getCellsForClue(selectedClue);
    if (cursorIdx >= cells.length) return null;
    const [r, c] = cells[cursorIdx];
    return `${r}-${c}`;
  }, [selectedClue, cursorIdx]);

  // Scroll clue list to active clue when selection changes
  useEffect(() => {
    if (!selectedClue) return;
    const key = `${selectedClue.direction[0]}${selectedClue.number}`;
    const y = clueYPositions.current.get(key);
    if (y !== undefined) {
      clueScrollRef.current?.scrollTo({ y: Math.max(0, y - 20), animated: true });
    }
  }, [selectedClue]);

  const checkComplete = useCallback((grid: string[][]) => {
    const correct = puzzle.solution.every((row, r) =>
      row.every((ch, c) => ch === '#' || grid[r][c].toUpperCase() === ch),
    );
    if (correct && !completedRef.current) {
      completedRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      playSound('win');
      if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
      onComplete(true, elapsedRef.current);
    }
  }, [puzzle, onComplete, hapticsEnabled]);

  const tapCell = useCallback((r: number, c: number) => {
    if (puzzle.solution[r][c] === '#') return;
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const cellKey = `${r}-${c}`;

    if (lastTappedRef.current === cellKey && selectedClue) {
      // Double-tap: switch direction
      const newDir: Direction = direction === 'across' ? 'down' : 'across';
      const newClue = puzzle.clues.find(cl =>
        getCellsForClue(cl).some(([cr, cc]) => cr === r && cc === c) &&
        cl.direction === newDir,
      );
      if (newClue) {
        setDirection(newDir);
        setSelectedClue(newClue);
        const newCells = getCellsForClue(newClue);
        const tappedI = newCells.findIndex(([cr, cc]) => cr === r && cc === c);
        setCursorIdx(tappedI >= 0 ? tappedI : 0);
      }
      return;
    }

    lastTappedRef.current = cellKey;

    // Find clue in current direction that contains this cell
    let clue = puzzle.clues.find(cl =>
      getCellsForClue(cl).some(([cr, cc]) => cr === r && cc === c) &&
      cl.direction === direction,
    );

    if (!clue) {
      const other: Direction = direction === 'across' ? 'down' : 'across';
      clue = puzzle.clues.find(cl =>
        getCellsForClue(cl).some(([cr, cc]) => cr === r && cc === c) &&
        cl.direction === other,
      );
      if (clue) setDirection(other);
    }

    if (clue) {
      setSelectedClue(clue);
      const cells = getCellsForClue(clue);
      const tappedI = cells.findIndex(([cr, cc]) => cr === r && cc === c);
      setCursorIdx(tappedI >= 0 ? tappedI : 0);
    }
  }, [puzzle, direction, selectedClue, hapticsEnabled]);

  const switchDirection = useCallback(() => {
    if (!selectedClue) return;
    const cells = getCellsForClue(selectedClue);
    const [r, c] = cells[cursorIdx] ?? cells[0];
    const newDir: Direction = direction === 'across' ? 'down' : 'across';
    const newClue = puzzle.clues.find(cl =>
      getCellsForClue(cl).some(([cr, cc]) => cr === r && cc === c) &&
      cl.direction === newDir,
    );
    if (newClue) {
      setDirection(newDir);
      setSelectedClue(newClue);
      const newCells = getCellsForClue(newClue);
      const tappedI = newCells.findIndex(([cr, cc]) => cr === r && cc === c);
      setCursorIdx(tappedI >= 0 ? tappedI : 0);
    }
  }, [selectedClue, cursorIdx, direction, puzzle]);

  const pressKey = useCallback((key: string) => {
    if (!selectedClue) return;
    const cells = getCellsForClue(selectedClue);
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (key === '⌫') {
      const [r, c] = cells[cursorIdx] ?? cells[0];
      const cellKey = `${r}-${c}`;

      if (userGrid[r][c] && !revealedCells.has(cellKey)) {
        // Clear current cell
        const next = userGrid.map(row => [...row]);
        next[r][c] = '';
        setUserGrid(next);
        const newErr = new Set(errorCells);
        newErr.delete(cellKey);
        setErrorCells(newErr);
      } else if (cursorIdx > 0) {
        // Move back and clear
        const newIdx = cursorIdx - 1;
        const [pr, pc] = cells[newIdx];
        const prevKey = `${pr}-${pc}`;
        if (!revealedCells.has(prevKey)) {
          const next = userGrid.map(row => [...row]);
          next[pr][pc] = '';
          setUserGrid(next);
          const newErr = new Set(errorCells);
          newErr.delete(prevKey);
          setErrorCells(newErr);
        }
        setCursorIdx(newIdx);
      }
      return;
    }

    if (key === '✓') return;

    // Fill letter at cursor
    const [r, c] = cells[cursorIdx] ?? cells[0];
    const cellKey = `${r}-${c}`;

    if (!revealedCells.has(cellKey)) {
      const next = userGrid.map(row => [...row]);
      next[r][c] = key.toUpperCase();
      const newErr = new Set(errorCells);
      newErr.delete(cellKey);
      setErrorCells(newErr);
      setUserGrid(next);
      checkComplete(next);
    }

    // Auto-advance cursor to next non-revealed empty cell
    let nextIdx = cursorIdx + 1;
    // First pass: find next empty
    while (nextIdx < cells.length) {
      const [nr, nc] = cells[nextIdx];
      if (!userGrid[nr][nc] && !revealedCells.has(`${nr}-${nc}`)) break;
      nextIdx++;
    }
    // Second pass: if all filled ahead, just advance one step
    if (nextIdx >= cells.length) {
      nextIdx = Math.min(cursorIdx + 1, cells.length - 1);
    }
    setCursorIdx(nextIdx);
  }, [selectedClue, cursorIdx, userGrid, errorCells, revealedCells, hapticsEnabled, checkComplete]);

  const checkSelected = useCallback(() => {
    if (!selectedClue) return;
    const cells = getCellsForClue(selectedClue);
    const newErrors = new Set(errorCells);
    cells.forEach(([r, c]) => {
      const letter = userGrid[r][c];
      if (letter && letter.toUpperCase() !== puzzle.solution[r][c]) {
        newErrors.add(`${r}-${c}`);
      }
    });
    setErrorCells(newErrors);
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [selectedClue, userGrid, puzzle, errorCells, hapticsEnabled]);

  const revealSelected = useCallback(() => {
    if (!selectedClue) return;
    const cells = getCellsForClue(selectedClue);
    const next = userGrid.map(row => [...row]);
    const newRevealed = new Set(revealedCells);
    const newErrors = new Set(errorCells);
    cells.forEach(([r, c]) => {
      next[r][c] = puzzle.solution[r][c];
      newRevealed.add(`${r}-${c}`);
      newErrors.delete(`${r}-${c}`);
    });
    setUserGrid(next);
    setRevealedCells(newRevealed);
    setErrorCells(newErrors);
    checkComplete(next);
  }, [selectedClue, userGrid, puzzle, revealedCells, errorCells, checkComplete]);

  const restart = () => {
    const next = getRandomCrossword(puzzle.id);
    setPuzzle(next);
    setUserGrid(next.solution.map(row => row.map(c => (c === '#' ? '#' : ''))));
    setSelectedClue(null);
    setCursorIdx(0);
    setErrorCells(new Set());
    setRevealedCells(new Set());
    setDone(false);
    elapsedRef.current = 0;
    completedRef.current = false;
    lastTappedRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
  };

  const acrossClues = puzzle.clues.filter(c => c.direction === 'across').sort((a, b) => a.number - b.number);
  const downClues = puzzle.clues.filter(c => c.direction === 'down').sort((a, b) => a.number - b.number);

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {puzzle.title && (
        <Text style={s.puzzleTitle}>{puzzle.title}</Text>
      )}

      {/* Grid */}
      <View style={s.gridWrap}>
        {puzzle.solution.map((row, r) => (
          <View key={r} style={s.gridRow}>
            {row.map((ch, c) => {
              if (ch === '#') return <View key={c} style={s.blackCell} />;
              const cellKey = `${r}-${c}`;
              const isSelected = selectedCells.has(cellKey);
              const isCursor = cursorCellKey === cellKey;
              const isError = errorCells.has(cellKey);
              const isRevealed = revealedCells.has(cellKey);
              const num = cellNumbers[r][c];
              const letter = userGrid[r][c];

              const cellBg = isError
                ? (colors.bg === '#16110A' ? '#6B1A1A' : '#FFE0E0')
                : isCursor
                ? colors.logic.bg
                : isSelected
                ? colors.classic.bg
                : isRevealed
                ? colors.number.bg
                : colors.surface;

              const letterColor = isError
                ? '#D03030'
                : isCursor
                ? colors.logic.ink
                : isSelected
                ? colors.classic.ink
                : isRevealed
                ? colors.number.ink
                : colors.ink;

              return (
                <TouchableOpacity key={c} onPress={() => tapCell(r, c)} activeOpacity={0.8}>
                  <View style={[s.cell, { backgroundColor: cellBg }]}>
                    {num !== undefined && (
                      <Text style={s.cellNum}>{num}</Text>
                    )}
                    <Text style={[s.cellLetter, { color: letterColor }]}>{letter}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Prominent active clue bar */}
      {selectedClue ? (
        <View style={[s.activeClue, { backgroundColor: colors.classic.bg }]}>
          <Text style={[s.activeClueNum, { color: colors.classic.ink }]}>
            {selectedClue.number}{selectedClue.direction === 'across' ? 'A' : 'D'}
          </Text>
          <Text style={[s.activeClueText, { color: colors.classic.ink }]} numberOfLines={2}>
            {selectedClue.clue}
          </Text>
          <View style={s.activeClueActions}>
            <TouchableOpacity onPress={switchDirection} style={s.clueActionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="swap-horizontal" size={18} color={colors.classic.ink} />
            </TouchableOpacity>
            <TouchableOpacity onPress={checkSelected} style={s.clueActionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.classic.ink} />
            </TouchableOpacity>
            <TouchableOpacity onPress={revealSelected} style={s.clueActionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="eye-outline" size={18} color={colors.classic.ink} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[s.activeClue, { backgroundColor: colors.surface }]}>
          <Text style={[s.activeClueText, { color: colors.inkMuted, textAlign: 'center', flex: 1 }]}>
            Tap a cell to begin
          </Text>
        </View>
      )}

      {/* Keyboard */}
      <View style={s.keyboard}>
        {KEYBOARD_ROWS.map((row, ri) => (
          <View key={ri} style={s.keyRow}>
            {row.map(key => (
              <TouchableOpacity key={key} onPress={() => pressKey(key)} activeOpacity={0.7}>
                <View style={[
                  s.key,
                  (key === '⌫' || key === '✓') && s.keyWide,
                ]}>
                  <Text style={s.keyText}>{key}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Clue lists — scrollable, auto-scrolls to active */}
      <View style={s.clueSection}>
        <ScrollView
          ref={clueScrollRef}
          style={s.clueScroll}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <Text style={s.clueHeader}>ACROSS</Text>
          {acrossClues.map(cl => {
            const isActive = selectedClue?.number === cl.number && selectedClue.direction === 'across';
            const key = `a${cl.number}`;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => { setSelectedClue(cl); setDirection('across'); setCursorIdx(0); }}
                onLayout={e => { clueYPositions.current.set(`a${cl.number}`, e.nativeEvent.layout.y); }}
              >
                <Text style={[s.clueItem, isActive && s.clueItemActive]}>
                  {cl.number}. {cl.clue}
                </Text>
              </TouchableOpacity>
            );
          })}
          <Text style={[s.clueHeader, { marginTop: 12 }]}>DOWN</Text>
          {downClues.map(cl => {
            const isActive = selectedClue?.number === cl.number && selectedClue.direction === 'down';
            return (
              <TouchableOpacity
                key={`d${cl.number}`}
                onPress={() => { setSelectedClue(cl); setDirection('down'); setCursorIdx(0); }}
                onLayout={e => { clueYPositions.current.set(`d${cl.number}`, e.nativeEvent.layout.y); }}
              >
                <Text style={[s.clueItem, isActive && s.clueItemActive]}>
                  {cl.number}. {cl.clue}
                </Text>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 8 }} />
        </ScrollView>
      </View>

      <View style={{ height: 32 }} />

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={[s.trophy, { backgroundColor: colors.classic.bg }]}>
              <Text style={{ fontSize: 36 }}>✏️</Text>
            </View>
            <Text style={s.modalTitle}>Puzzle Solved!</Text>
            {puzzle.title && <Text style={s.modalSub}>{puzzle.title}</Text>}
            <TouchableOpacity style={[s.btn, { backgroundColor: colors.ink }]} onPress={restart} activeOpacity={0.8}>
              <Text style={[s.btnText, { color: colors.bg }]}>Next Puzzle</Text>
            </TouchableOpacity>
            {onBack && (
              <TouchableOpacity
                style={[s.btn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 8 }]}
                onPress={onBack}
                activeOpacity={0.8}
              >
                <Text style={[s.btnText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) => {
  const KEY_W = Math.floor((SCREEN_W - 32 - 9 * 3) / 10);
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    puzzleTitle: {
      fontFamily: fonts.extraBold, fontSize: 14, color: colors.inkMuted,
      textAlign: 'center', paddingTop: 8, letterSpacing: 0.5,
    },
    gridWrap: {
      alignSelf: 'center', marginTop: 12, gap: 2,
      padding: 8, backgroundColor: colors.ink, borderRadius: 12,
    },
    gridRow: { flexDirection: 'row', gap: 2 },
    cell: {
      width: CELL_SIZE, height: CELL_SIZE,
      alignItems: 'center', justifyContent: 'center',
    },
    blackCell: { width: CELL_SIZE, height: CELL_SIZE, backgroundColor: colors.ink },
    cellNum: {
      position: 'absolute', top: 1, left: 2,
      fontFamily: fonts.bold, fontSize: 8, color: colors.inkMuted,
    },
    cellLetter: {
      fontFamily: fonts.black, fontSize: CELL_SIZE * 0.42,
    },

    activeClue: {
      marginHorizontal: 16, marginTop: 8, borderRadius: 14,
      paddingHorizontal: 14, paddingVertical: 10,
      flexDirection: 'row', alignItems: 'center', gap: 8,
      minHeight: 52,
    },
    activeClueNum: { fontFamily: fonts.extraBold, fontSize: 13 },
    activeClueText: { flex: 1, fontFamily: fonts.semiBold, fontSize: 13 },
    activeClueActions: { flexDirection: 'row', gap: 4 },
    clueActionBtn: {
      width: 30, height: 30, alignItems: 'center', justifyContent: 'center',
    },

    keyboard: { alignItems: 'center', marginTop: 10, gap: 4 },
    keyRow: { flexDirection: 'row', gap: 3 },
    key: {
      width: KEY_W, height: KEY_W * 1.3, borderRadius: 6,
      backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
      shadowColor: colors.ink, shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08, shadowRadius: 2, elevation: 2,
    },
    keyWide: { width: KEY_W * 1.5 },
    keyText: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.ink },

    clueSection: { marginHorizontal: 16, marginTop: 12 },
    clueScroll: { maxHeight: 200 },
    clueHeader: {
      fontFamily: fonts.extraBold, fontSize: 12, color: colors.inkMuted,
      letterSpacing: 0.8, marginBottom: 6,
    },
    clueItem: {
      fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkSoft,
      paddingVertical: 4,
    },
    clueItemActive: {
      color: colors.ink, fontFamily: fonts.extraBold,
    },

    overlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    },
    modal: {
      width: '100%', backgroundColor: colors.surface,
      borderRadius: 28, padding: 28, alignItems: 'center', gap: 14,
    },
    trophy: {
      width: 72, height: 72, borderRadius: 36,
      alignItems: 'center', justifyContent: 'center',
    },
    modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, letterSpacing: -0.5 },
    modalSub: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.inkMuted },
    btn: { width: '100%', height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontFamily: fonts.extraBold, fontSize: 16 },
  });
};
