import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { TAKUZU_PUZZLES } from './puzzles';
import * as Haptics from 'expo-haptics';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

const CELL = 50;

export function TakuzuGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const puzzle = TAKUZU_PUZZLES[0];
  const N = puzzle.given.length;

  const [grid, setGrid] = useState<(0 | 1 | null)[][]>(() =>
    puzzle.given.map(row => [...row])
  );
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

  const checkSolved = useCallback((g: (0 | 1 | null)[][]) => {
    if (g.some(row => row.some(v => v === null))) return;
    const correct = (g as (0|1)[][]).every((row, ri) =>
      row.every((v, ci) => v === puzzle.solution[ri][ci])
    );
    if (correct) finish(true);
  }, [puzzle, finish]);

  const handleTap = useCallback((r: number, c: number) => {
    if (puzzle.given[r][c] !== null) return; // given cell
    setGrid(prev => {
      const next = prev.map(row => [...row] as (0 | 1 | null)[]);
      const curr = next[r][c];
      next[r][c] = curr === null ? 0 : curr === 0 ? 1 : null;
      checkSolved(next);
      return next;
    });
  }, [puzzle, checkSolved]);

  return (
    <View style={s.container}>
      <Text style={s.title}>Takuzu / Binairo</Text>
      <Text style={s.subtitle}>Fill with 0s and 1s · No 3 consecutive · Equal count per row/col</Text>

      <View style={s.grid}>
        {grid.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((val, ci) => {
              const isGiven = puzzle.given[ri][ci] !== null;
              return (
                <TouchableOpacity
                  key={ci}
                  style={[
                    s.cell,
                    val === 0 && { backgroundColor: colors.classic.bg },
                    val === 1 && { backgroundColor: colors.word.bg },
                    isGiven && s.cellGiven,
                  ]}
                  onPress={() => handleTap(ri, ci)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.cellVal, val === 1 && { color: colors.word.ink }, val === 0 && { color: colors.classic.ink }]}>
                    {val !== null ? String(val) : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>⚡</Text>
            <Text style={s.modalTitle}>Binary Complete!</Text>
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
              setGrid(puzzle.given.map(row => [...row]));
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
  grid: { borderWidth: 2, borderColor: colors.ink },
  cell: { width: CELL, height: CELL, borderWidth: 0.5, borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  cellGiven: { backgroundColor: colors.surface2 },
  cellVal: { fontFamily: fonts.black, fontSize: 24, color: colors.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
