import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

// Fillomino: fill grid so each region of N cells contains exactly N
// Clue cells already have their numbers; fill in the rest
const PUZZLE = {
  size: 5,
  // 0 = blank cell to fill in
  given: [
    [3, 0, 2, 0, 1],
    [0, 3, 0, 2, 0],
    [2, 0, 3, 0, 2],
    [0, 2, 0, 3, 0],
    [1, 0, 2, 0, 3],
  ],
  solution: [
    [3, 3, 2, 2, 1],
    [3, 3, 2, 2, 3],
    [2, 2, 3, 3, 2],
    [2, 2, 3, 3, 2],
    [1, 2, 2, 3, 3],
  ],
};

const CELL_SIZE = 56;

export function FillominoGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const SIZE = PUZZLE.size;
  const [grid, setGrid] = useState<number[][]>(PUZZLE.given.map(row => [...row]));
  const [selected, setSelected] = useState<[number,number] | null>(null);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  const s = useMemo(() => makeStyles(colors), [colors]);

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
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        if (g[r][c] !== PUZZLE.solution[r][c]) return false;
    return true;
  }, [SIZE]);

  const handleCellPress = useCallback((r: number, c: number) => {
    if (PUZZLE.given[r][c] !== 0) return; // given cell, can't change
    setSelected([r, c]);
  }, []);

  const handleNumber = useCallback((num: number) => {
    if (!selected) return;
    const [r, c] = selected;
    const newGrid = grid.map(row => [...row]);
    newGrid[r][c] = num;
    setGrid(newGrid);
    if (checkSolution(newGrid)) finish(true);
  }, [selected, grid, checkSolution, finish]);

  return (
    <View style={s.container}>
      <Text style={s.title}>Fillomino</Text>
      <Text style={s.subtitle}>Fill so each region of N cells contains N</Text>

      <View style={s.grid}>
        {grid.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((val, ci) => {
              const isGiven = PUZZLE.given[ri][ci] !== 0;
              const isSel = selected?.[0]===ri && selected?.[1]===ci;
              const isCorrect = val !== 0 && val === PUZZLE.solution[ri][ci];
              const isWrong = val !== 0 && val !== PUZZLE.solution[ri][ci];
              return (
                <TouchableOpacity
                  key={ci}
                  style={[
                    s.cell,
                    isGiven && s.cellGiven,
                    isSel && s.cellSelected,
                    isCorrect && !isGiven && s.cellCorrect,
                    isWrong && s.cellWrong,
                  ]}
                  onPress={() => handleCellPress(ri, ci)}
                  activeOpacity={0.7}
                >
                  {val !== 0 && <Text style={[s.cellNum, isGiven && s.cellNumGiven]}>{val}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={s.numPad}>
        {[1,2,3,4,5].map(n => (
          <TouchableOpacity key={n} style={s.numBtn} onPress={() => handleNumber(n)} activeOpacity={0.8}>
            <Text style={s.numBtnText}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.resetBtn} onPress={() => {
        setGrid(PUZZLE.given.map(row => [...row])); setSelected(null);
      }} activeOpacity={0.8}>
        <Text style={s.resetBtnText}>Reset</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🔢' : '❌'}</Text>
            <Text style={s.modalTitle}>{won ? 'Filled!' : 'Try Again'}</Text>
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
              setGrid(PUZZLE.given.map(row => [...row])); setSelected(null);
              elapsedRef.current = 0;
              timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
            }}>
              <Text style={s.modalBtnText}>Play Again</Text>
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
  grid: { borderWidth: 2, borderColor: colors.ink, marginBottom: 20 },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  cellGiven: { backgroundColor: colors.surface2 },
  cellSelected: { backgroundColor: colors.logic.bg, borderColor: colors.logic.ink, borderWidth: 2 },
  cellCorrect: { backgroundColor: colors.number.bg + '60' },
  cellWrong: { backgroundColor: colors.danger + '20' },
  cellNum: { fontFamily: fonts.bold, fontSize: 20, color: colors.ink },
  cellNumGiven: { fontFamily: fonts.black, color: colors.ink },
  numPad: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  numBtn: { width: 48, height: 48, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  numBtnText: { fontFamily: fonts.black, fontSize: 20, color: colors.ink },
  resetBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999 },
  resetBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
