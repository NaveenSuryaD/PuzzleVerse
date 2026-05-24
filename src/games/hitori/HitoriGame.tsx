import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { HITORI_PUZZLES } from './puzzles';
import * as Haptics from 'expo-haptics';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

const CELL = 60;

export function HitoriGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const puzzle = HITORI_PUZZLES[0];
  const N = puzzle.grid.length;

  const [shaded, setShaded] = useState<boolean[][]>(() =>
    Array.from({ length: N }, () => Array(N).fill(false))
  );
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

  const checkSolved = useCallback((s: boolean[][]) => {
    const correct = s.every((row, ri) => row.every((v, ci) => v === puzzle.solution[ri][ci]));
    if (correct) finish(true);
  }, [puzzle, finish]);

  const handleTap = useCallback((r: number, c: number) => {
    setShaded(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = !next[r][c];
      checkSolved(next);
      return next;
    });
  }, [checkSolved]);

  return (
    <View style={s.container}>
      <Text style={s.title}>Hitori</Text>
      <Text style={s.subtitle}>Shade cells so no number repeats in any row/col{'\n'}Shaded cells cannot be adjacent</Text>

      <View style={s.grid}>
        {puzzle.grid.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((num, ci) => {
              const isShaded = shaded[ri][ci];
              return (
                <TouchableOpacity
                  key={ci}
                  style={[s.cell, isShaded && s.cellShaded]}
                  onPress={() => handleTap(ri, ci)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.cellNum, isShaded && { color: colors.bg }]}>{num}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <TouchableOpacity style={s.checkBtn} onPress={() => checkSolved(shaded)} activeOpacity={0.8}>
        <Text style={s.checkBtnText}>Check</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '✅' : '❌'}</Text>
            <Text style={s.modalTitle}>{won ? 'Solved!' : 'Not quite'}</Text>
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
              setShaded(Array.from({ length: N }, () => Array(N).fill(false)));
              elapsedRef.current = 0;
              timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
            }}>
              <Text style={s.modalBtnText}>Try Again</Text>
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
  cell: { width: CELL, height: CELL, borderWidth: 0.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  cellShaded: { backgroundColor: colors.ink },
  cellNum: { fontFamily: fonts.black, fontSize: 24, color: colors.ink },
  checkBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  checkBtnText: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.bg },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
