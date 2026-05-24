import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

// Simple domino-pairing puzzle: select two adjacent cells to pair as a domino
const PUZZLE = [
  [1,2,3,4,5,6,0],
  [2,3,4,5,6,0,1],
  [3,4,5,6,0,1,2],
  [4,5,6,0,1,2,3],
];

const SOLUTION_PAIRS: [number,number,number,number][] = [
  [0,0,0,1],[0,2,0,3],[0,4,1,4],[0,5,0,6],
  [1,0,1,1],[1,2,1,3],[1,5,1,6],
  [2,0,2,1],[2,2,2,3],[2,5,2,6],
  [3,0,3,1],[3,2,3,3],[3,4,2,4],[3,5,3,6],
];

const ROWS = PUZZLE.length, COLS = PUZZLE[0].length;
const CELL = 44;

export function DominoesGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [pairs, setPairs] = useState<Array<[[number,number],[number,number]]>>([]);
  const [done, setDone] = useState(false);

  const s = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const finish = useCallback((w: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setDone(true);
    onComplete(w, elapsedRef.current);
  }, [onComplete]);

  const isPaired = (r: number, c: number) =>
    pairs.some(([a, b]) => (a[0] === r && a[1] === c) || (b[0] === r && b[1] === c));

  const handleTap = useCallback((r: number, c: number) => {
    if (isPaired(r, c)) return;
    if (!selected) { setSelected([r, c]); return; }
    const [sr, sc] = selected;
    if (sr === r && sc === c) { setSelected(null); return; }
    const adj = (Math.abs(r - sr) === 1 && c === sc) || (Math.abs(c - sc) === 1 && r === sr);
    if (adj && !isPaired(r, c)) {
      const newPairs = [...pairs, [[sr, sc], [r, c]] as [[number,number],[number,number]]];
      setPairs(newPairs);
      setSelected(null);
      const totalCells = ROWS * COLS;
      if (newPairs.length * 2 === totalCells) finish(true);
    } else {
      setSelected([r, c]);
    }
  }, [selected, pairs, finish]);

  const getPairColor = (r: number, c: number) => {
    const PAIR_COLORS = ['#E74C3C','#3498DB','#2ECC71','#F1C40F','#9B59B6','#E67E22','#1ABC9C','#E91E63','#FF5722','#607D8B','#795548','#4CAF50','#2196F3','#FF9800'];
    const idx = pairs.findIndex(([a, b]) => (a[0] === r && a[1] === c) || (b[0] === r && b[1] === c));
    return idx >= 0 ? PAIR_COLORS[idx % PAIR_COLORS.length] : null;
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Dominoes</Text>
      <Text style={s.subtitle}>Tap two adjacent cells to pair them · Cover all cells</Text>
      <Text style={s.progress}>Pairs: {pairs.length} / {Math.floor(ROWS * COLS / 2)}</Text>

      <View style={s.grid}>
        {PUZZLE.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((num, ci) => {
              const isSel = selected?.[0] === ri && selected?.[1] === ci;
              const pairColor = getPairColor(ri, ci);
              return (
                <TouchableOpacity
                  key={ci}
                  style={[
                    s.cell,
                    isSel && s.cellSelected,
                    pairColor ? { backgroundColor: pairColor + '40', borderColor: pairColor } : {},
                  ]}
                  onPress={() => handleTap(ri, ci)}
                  activeOpacity={0.7}
                >
                  <Text style={s.cellNum}>{num}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <TouchableOpacity style={s.resetBtn} onPress={() => { setPairs([]); setSelected(null); }} activeOpacity={0.8}>
        <Text style={s.resetBtnText}>Reset</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>🁢</Text>
            <Text style={s.modalTitle}>Solved!</Text>
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
              setPairs([]); setSelected(null);
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
  subtitle: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginBottom: 4, textAlign: 'center' },
  progress: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted, marginBottom: 16 },
  grid: { borderWidth: 2, borderColor: colors.ink, marginBottom: 20 },
  cell: { width: CELL, height: CELL, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  cellSelected: { backgroundColor: colors.logic.bg, borderColor: colors.logic.ink, borderWidth: 2 },
  cellNum: { fontFamily: fonts.black, fontSize: 20, color: colors.ink },
  resetBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999 },
  resetBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
