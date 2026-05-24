import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';
import { useSaveGame } from '../../utils/gameSave';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  savedStateJSON?: string;
}

// Emoji Sudoku: 4x4 sudoku using emojis instead of numbers
const EMOJIS = ['🐶','🐱','🐭','🐹'];

// 4x4 sudoku puzzle (0 = blank)
const PUZZLES = [
  {
    given: [
      [1,0,0,4],
      [0,0,1,0],
      [0,3,0,0],
      [4,0,0,2],
    ],
    solution: [
      [1,2,3,4],
      [3,4,1,2],
      [2,3,4,1],
      [4,1,2,3], // doesn't need to be [4,1,3,2] but must be valid
    ],
  },
  {
    given: [
      [0,1,0,0],
      [0,0,0,3],
      [2,0,0,0],
      [0,0,4,0],
    ],
    solution: [
      [3,1,2,4],
      [4,2,1,3],
      [2,4,3,1],
      [1,3,4,2],
    ],
  },
];

const CELL_SIZE = 64;

export function EmojiSudokuGame({ onComplete, onBack, savedStateJSON }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => { try { return savedStateJSON ? JSON.parse(savedStateJSON) : null; } catch { return null; } }, []);
  const [puzIdx, setPuzIdx] = useState<number>(() => saved?.puzIdx ?? 0);
  const puz = PUZZLES[puzIdx];

  const [grid, setGrid] = useState<number[][]>(() => saved?.grid ?? puz.given.map(row => [...row]));
  const [selected, setSelected] = useState<[number,number] | null>(null);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  useSaveGame('emoji-sudoku', () => ({ puzIdx, grid }), !done, [puzIdx, grid], elapsedRef);
  const s = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    setGrid(puz.given.map(row => [...row]));
    setSelected(null);
  }, [puzIdx]);

  useEffect(() => {
    timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const finish = useCallback((w: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setWon(w);
    setDone(true);
    onComplete(w, elapsedRef.current);
  }, [onComplete]);

  const checkSolution = useCallback((g: number[][]) => {
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        if (g[r][c] !== puz.solution[r][c]) return false;
    return true;
  }, [puz]);

  const isValid = useCallback((g: number[][], r: number, c: number, val: number) => {
    // Check row
    for (let cc = 0; cc < 4; cc++) if (cc !== c && g[r][cc] === val) return false;
    // Check col
    for (let rr = 0; rr < 4; rr++) if (rr !== r && g[rr][c] === val) return false;
    // Check 2x2 box
    const boxR = Math.floor(r/2)*2, boxC = Math.floor(c/2)*2;
    for (let rr = boxR; rr < boxR+2; rr++)
      for (let cc = boxC; cc < boxC+2; cc++)
        if ((rr !== r || cc !== c) && g[rr][cc] === val) return false;
    return true;
  }, []);

  const handleEmojiSelect = useCallback((val: number) => {
    if (!selected) return;
    const [r, c] = selected;
    if (puz.given[r][c] !== 0) return;
    if (!isValid(grid, r, c, val)) return;

    const newGrid = grid.map(row => [...row]);
    newGrid[r][c] = newGrid[r][c] === val ? 0 : val;
    setGrid(newGrid);

    if (newGrid.every(row => row.every(v => v !== 0)) && checkSolution(newGrid)) {
      finish(true);
    }
  }, [selected, grid, puz, isValid, checkSolution, finish]);

  const getConflicts = (g: number[][], r: number, c: number) => {
    const val = g[r][c];
    if (val === 0) return false;
    return !isValid(g, r, c, val);
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Emoji Sudoku</Text>
      <Text style={s.subtitle}>Fill the 4×4 grid · No repeats in row, col, or box</Text>

      <View style={s.grid}>
        {grid.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((val, ci) => {
              const isGiven = puz.given[ri][ci] !== 0;
              const isSel = selected?.[0]===ri && selected?.[1]===ci;
              const hasConflict = val !== 0 && getConflicts(grid, ri, ci);
              const boxBorderR = (ri+1)%2===0 && ri < 3;
              const boxBorderC = (ci+1)%2===0 && ci < 3;
              return (
                <TouchableOpacity
                  key={ci}
                  style={[
                    s.cell,
                    isGiven && s.cellGiven,
                    isSel && s.cellSelected,
                    hasConflict && s.cellConflict,
                    boxBorderR && s.cellBorderR,
                    boxBorderC && s.cellBorderC,
                  ]}
                  onPress={() => !isGiven && setSelected([ri, ci])}
                  activeOpacity={0.7}
                >
                  {val !== 0 && <Text style={s.cellEmoji}>{EMOJIS[val-1]}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={s.emojiPad}>
        {EMOJIS.map((emoji, i) => (
          <TouchableOpacity
            key={emoji}
            style={s.emojiBtn}
            onPress={() => handleEmojiSelect(i+1)}
            activeOpacity={0.8}
          >
            <Text style={s.emojiBtnText}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.resetBtn} onPress={() => {
        setGrid(puz.given.map(row => [...row])); setSelected(null);
      }} activeOpacity={0.8}>
        <Text style={s.resetBtnText}>Reset</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🎉' : '❌'}</Text>
            <Text style={s.modalTitle}>{won ? 'Emoji Master!' : 'Try Again'}</Text>
            {onBack && (
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 8 }]}
                onPress={onBack}
              >
                <Text style={[s.modalBtnText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.modalBtn} onPress={() => {
              setDone(false); completedRef.current = false;
              const next = (puzIdx + 1) % PUZZLES.length;
              setPuzIdx(next);
              elapsedRef.current = 0;
              timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
            }}>
              <Text style={s.modalBtnText}>Next Puzzle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginBottom: 20, textAlign: 'center' },
  grid: { borderWidth: 2.5, borderColor: colors.ink, marginBottom: 20 },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  cellGiven: { backgroundColor: colors.surface2 },
  cellSelected: { backgroundColor: colors.logic.bg, borderColor: colors.logic.ink, borderWidth: 2 },
  cellConflict: { backgroundColor: colors.danger + '25' },
  cellBorderR: { borderBottomWidth: 2.5, borderBottomColor: colors.ink },
  cellBorderC: { borderRightWidth: 2.5, borderRightColor: colors.ink },
  cellEmoji: { fontSize: 30 },
  emojiPad: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  emojiBtn: { width: 60, height: 60, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.divider, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emojiBtnText: { fontSize: 30 },
  resetBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999 },
  resetBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
