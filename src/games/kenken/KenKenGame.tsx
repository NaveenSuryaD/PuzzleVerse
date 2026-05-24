import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { KENKEN_PUZZLES } from './puzzles';
import * as Haptics from 'expo-haptics';
import { useSaveGame } from '../../utils/gameSave';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  savedStateJSON?: string;
}

const CAGE_COLORS = ['#FFE0CC', '#D8ECD4', '#FFEDB8', '#E3D8FF', '#CFE3F5', '#FFD5E5', '#D4F0FF', '#FFEFCC'];

export function KenKenGame({ onComplete, onBack, savedStateJSON }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => { try { return savedStateJSON ? JSON.parse(savedStateJSON) : null; } catch { return null; } }, []);
  const puzzle = KENKEN_PUZZLES[0];
  const N = puzzle.size;
  const CELL = 72;

  const [grid, setGrid] = useState<(number | null)[][]>(() =>
    saved?.grid ?? Array.from({ length: N }, () => Array(N).fill(null))
  );
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [done, setDone] = useState(false);

  useSaveGame('kenken', () => ({ grid }), !done, [grid], elapsedRef);
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

  // Build cage lookup
  const cellCage = useMemo(() => {
    const map: Record<string, number> = {};
    puzzle.cages.forEach((cage, i) => {
      cage.cells.forEach(([r, c]) => { map[`${r},${c}`] = i; });
    });
    return map;
  }, [puzzle]);

  const checkSolved = useCallback((g: (number | null)[][]) => {
    if (g.some(row => row.some(v => v === null))) return;
    const nums = g as number[][];
    // Check rows & cols
    for (let i = 0; i < N; i++) {
      const rowSet = new Set(nums[i]);
      const colSet = new Set(nums.map(r => r[i]));
      if (rowSet.size !== N || colSet.size !== N) return;
    }
    // Check cages
    for (const cage of puzzle.cages) {
      const vals = cage.cells.map(([r, c]) => nums[r][c]);
      let result: number;
      if (cage.op === '+') result = vals.reduce((a, b) => a + b, 0);
      else if (cage.op === '*') result = vals.reduce((a, b) => a * b, 1);
      else if (cage.op === '-') result = Math.abs(vals[0] - vals[1]);
      else result = Math.max(...vals) / Math.min(...vals);
      if (result !== cage.target) return;
    }
    finish(true);
  }, [puzzle, finish, N]);

  const handleNumpad = useCallback((n: number) => {
    if (!selected) return;
    const [r, c] = selected;
    setGrid(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = n;
      checkSolved(next);
      return next;
    });
  }, [selected, checkSolved]);

  return (
    <View style={s.container}>
      <Text style={s.title}>KenKen</Text>
      <Text style={s.subtitle}>Fill 1-{N} · No repeats in row/col · Meet cage targets</Text>

      <View style={s.grid}>
        {Array.from({ length: N }, (_, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {Array.from({ length: N }, (_, ci) => {
              const cageIdx = cellCage[`${ri},${ci}`] ?? 0;
              const cage = puzzle.cages[cageIdx];
              const isFirstInCage = cage?.cells[0][0] === ri && cage?.cells[0][1] === ci;
              const isSel = selected?.[0] === ri && selected?.[1] === ci;
              return (
                <TouchableOpacity
                  key={ci}
                  style={[
                    s.cell, { width: CELL, height: CELL },
                    { backgroundColor: CAGE_COLORS[cageIdx % CAGE_COLORS.length] },
                    isSel && s.cellSelected,
                  ]}
                  onPress={() => setSelected([ri, ci])}
                  activeOpacity={0.7}
                >
                  {isFirstInCage && cage && (
                    <Text style={s.cageLabel}>{cage.target}{cage.op}</Text>
                  )}
                  <Text style={s.cellVal}>{grid[ri][ci] ?? ''}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={s.numpad}>
        {[1, 2, 3, 4].map(n => (
          <TouchableOpacity key={n} style={s.numBtn} onPress={() => handleNumpad(n)} activeOpacity={0.7}>
            <Text style={s.numBtnText}>{n}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[s.numBtn, { backgroundColor: colors.danger + '20' }]} onPress={() => {
          if (!selected) return;
          const [r, c] = selected;
          setGrid(prev => { const next = prev.map(row => [...row]); next[r][c] = null; return next; });
        }}>
          <Text style={[s.numBtnText, { color: colors.danger }]}>✕</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>🧮</Text>
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
              setGrid(Array.from({ length: N }, () => Array(N).fill(null)));
              setSelected(null);
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginBottom: 20, textAlign: 'center' },
  grid: { borderWidth: 2, borderColor: colors.ink, marginBottom: 24 },
  cell: { borderWidth: 0.5, borderColor: colors.ink, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  cellSelected: { borderWidth: 2.5, borderColor: colors.danger },
  cageLabel: { position: 'absolute', top: 2, left: 3, fontFamily: fonts.bold, fontSize: 10, color: colors.inkSoft },
  cellVal: { fontFamily: fonts.black, fontSize: 28, color: colors.ink },
  numpad: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  numBtn: { width: 60, height: 52, backgroundColor: colors.surface, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.divider },
  numBtnText: { fontFamily: fonts.extraBold, fontSize: 22, color: colors.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
