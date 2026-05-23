import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, Dimensions, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { getRandomCrossword } from './puzzles';
import type { CrosswordPuzzle, Direction, ClueEntry } from './types';

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

export function CrosswordGame({ onComplete }: Props) {
  const colors = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [puzzle, setPuzzle] = useState<CrosswordPuzzle>(() => getRandomCrossword());
  const [userGrid, setUserGrid] = useState<string[][]>(() =>
    puzzle.solution.map(row => row.map(c => (c === '#' ? '#' : ''))),
  );
  const [selectedClue, setSelectedClue] = useState<ClueEntry | null>(null);
  const [direction, setDirection] = useState<Direction>('across');
  const [done, setDone] = useState(false);

  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const cellNumbers = useMemo(() => computeNumbers(puzzle.solution), [puzzle]);

  const selectedCells = useMemo((): Set<string> => {
    if (!selectedClue) return new Set();
    return new Set(getCellsForClue(selectedClue).map(([r, c]) => `${r}-${c}`));
  }, [selectedClue]);

  const checkComplete = useCallback((grid: string[][]) => {
    const correct = puzzle.solution.every((row, r) =>
      row.every((ch, c) => ch === '#' || grid[r][c].toUpperCase() === ch),
    );
    if (correct && !completedRef.current) {
      completedRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      setDone(true);
      onComplete(true, elapsedRef.current);
    }
  }, [puzzle, onComplete]);

  const pressKey = useCallback((key: string) => {
    if (!selectedClue) return;
    const cells = getCellsForClue(selectedClue);

    if (key === '⌫') {
      // Find last non-empty cell and clear it
      for (let i = cells.length - 1; i >= 0; i--) {
        const [r, c] = cells[i];
        if (userGrid[r][c]) {
          const next = userGrid.map(row => [...row]);
          next[r][c] = '';
          setUserGrid(next);
          return;
        }
      }
      return;
    }

    if (key === '✓') return;

    // Find first empty cell in selected clue and fill it
    const next = userGrid.map(row => [...row]);
    let filled = false;
    for (const [r, c] of cells) {
      if (!next[r][c]) {
        next[r][c] = key.toUpperCase();
        filled = true;
        break;
      }
    }
    if (!filled) {
      // All filled — overwrite last
      const [r, c] = cells[cells.length - 1];
      next[r][c] = key.toUpperCase();
    }
    setUserGrid(next);
    checkComplete(next);
  }, [selectedClue, userGrid, checkComplete]);

  const tapCell = useCallback((r: number, c: number) => {
    if (puzzle.solution[r][c] === '#') return;
    const cellNum = cellNumbers[r][c];
    // Find clue starting at this cell in current direction, or toggle
    let clue = puzzle.clues.find(cl => cl.row === r && cl.col === c && cl.direction === direction);
    if (!clue) {
      const other: Direction = direction === 'across' ? 'down' : 'across';
      clue = puzzle.clues.find(cl => cl.row === r && cl.col === c && cl.direction === other);
      if (clue) setDirection(other);
    }
    if (!clue) {
      // Find which clue this cell belongs to
      clue = puzzle.clues.find(cl => {
        const cells = getCellsForClue(cl);
        return cells.some(([cr, cc]) => cr === r && cc === c) && cl.direction === direction;
      });
    }
    if (clue) setSelectedClue(clue);
  }, [puzzle, cellNumbers, direction]);

  const restart = () => {
    const next = getRandomCrossword(puzzle.id);
    setPuzzle(next);
    setUserGrid(next.solution.map(row => row.map(c => (c === '#' ? '#' : ''))));
    setSelectedClue(null);
    setDone(false);
    elapsedRef.current = 0;
    completedRef.current = false;
    startTimer();
  };

  const startTimer = () => {
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
              const isSelected = selectedCells.has(`${r}-${c}`);
              const num = cellNumbers[r][c];
              const letter = userGrid[r][c];
              const isSolved = done && letter.toUpperCase() === ch;
              return (
                <TouchableOpacity key={c} onPress={() => tapCell(r, c)} activeOpacity={0.8}>
                  <View style={[
                    s.cell,
                    isSelected && { backgroundColor: colors.classic.bg },
                    isSolved && { backgroundColor: colors.number.bg },
                  ]}>
                    {num !== undefined && (
                      <Text style={s.cellNum}>{num}</Text>
                    )}
                    <Text style={[
                      s.cellLetter,
                      isSelected && { color: colors.classic.ink },
                      isSolved && { color: colors.number.ink },
                    ]}>{letter}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Selected clue hint */}
      {selectedClue && (
        <View style={[s.activeClue, { backgroundColor: colors.classic.bg }]}>
          <Text style={[s.activeClueNum, { color: colors.classic.ink }]}>
            {selectedClue.number}{selectedClue.direction === 'across' ? 'A' : 'D'}
          </Text>
          <Text style={[s.activeClueText, { color: colors.classic.ink }]} numberOfLines={2}>
            {selectedClue.clue}
          </Text>
          <TouchableOpacity onPress={() => setDirection(d => d === 'across' ? 'down' : 'across')}>
            <Ionicons name="swap-horizontal" size={18} color={colors.classic.ink} />
          </TouchableOpacity>
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

      {/* Clue lists */}
      <View style={s.clueSection}>
        <Text style={s.clueHeader}>ACROSS</Text>
        {acrossClues.map(cl => (
          <TouchableOpacity key={`a${cl.number}`} onPress={() => { setSelectedClue(cl); setDirection('across'); }}>
            <Text style={[
              s.clueItem,
              selectedClue?.number === cl.number && selectedClue.direction === 'across' && { color: colors.ink, fontFamily: fonts.extraBold },
            ]}>
              {cl.number}. {cl.clue}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={[s.clueHeader, { marginTop: 12 }]}>DOWN</Text>
        {downClues.map(cl => (
          <TouchableOpacity key={`d${cl.number}`} onPress={() => { setSelectedClue(cl); setDirection('down'); }}>
            <Text style={[
              s.clueItem,
              selectedClue?.number === cl.number && selectedClue.direction === 'down' && { color: colors.ink, fontFamily: fonts.extraBold },
            ]}>
              {cl.number}. {cl.clue}
            </Text>
          </TouchableOpacity>
        ))}
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
      backgroundColor: colors.surface,
      alignItems: 'center', justifyContent: 'center',
    },
    blackCell: { width: CELL_SIZE, height: CELL_SIZE, backgroundColor: colors.ink },
    cellNum: {
      position: 'absolute', top: 1, left: 2,
      fontFamily: fonts.bold, fontSize: 8, color: colors.inkMuted,
    },
    cellLetter: {
      fontFamily: fonts.black, fontSize: CELL_SIZE * 0.42, color: colors.ink,
    },

    activeClue: {
      marginHorizontal: 16, marginTop: 8, borderRadius: 14,
      paddingHorizontal: 14, paddingVertical: 10,
      flexDirection: 'row', alignItems: 'center', gap: 8,
    },
    activeClueNum: { fontFamily: fonts.extraBold, fontSize: 13 },
    activeClueText: { flex: 1, fontFamily: fonts.semiBold, fontSize: 13 },

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

    clueSection: { paddingHorizontal: 22, paddingTop: 16 },
    clueHeader: {
      fontFamily: fonts.extraBold, fontSize: 12, color: colors.inkMuted,
      letterSpacing: 0.8, marginBottom: 6,
    },
    clueItem: {
      fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkSoft,
      paddingVertical: 3,
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
