import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { KAKURO_PUZZLES } from './puzzles';
import type { KakuroGrid } from './types';
import * as Haptics from 'expo-haptics';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

export function KakuroGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [grid, setGrid] = useState<KakuroGrid>(() =>
    KAKURO_PUZZLES[0].map(row => row.map(c => ({ ...c })))
  );
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);
  const [errors, setErrors] = useState<Set<string>>(new Set());

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

  const checkSolved = useCallback((g: KakuroGrid) => {
    const allFilled = g.every(row => row.every(c => c.type !== 'white' || c.value !== null));
    if (!allFilled) return;
    const correct = g.every(row => row.every(c => c.type !== 'white' || c.value === c.solution));
    if (correct) finish(true);
  }, [finish]);

  const handleNumpad = useCallback((n: number) => {
    if (!selected) return;
    const [r, c] = selected;
    if (grid[r][c].type !== 'white') return;
    setGrid(prev => {
      const next = prev.map(row => row.map(cell => ({ ...cell })));
      next[r][c] = { ...next[r][c], value: n };
      checkSolved(next);
      return next;
    });
  }, [selected, grid, checkSolved]);

  const handleClear = useCallback(() => {
    if (!selected) return;
    const [r, c] = selected;
    setGrid(prev => {
      const next = prev.map(row => row.map(cell => ({ ...cell })));
      next[r][c] = { ...next[r][c], value: null };
      return next;
    });
  }, [selected]);

  const CELL_SIZE = 52;

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.title}>Kakuro Puzzle {puzzleIdx + 1}</Text>
      <Text style={s.subtitle}>Fill cells so each run sums to its clue · No repeats</Text>

      <View style={s.gridWrap}>
        {grid.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((cell, ci) => {
              if (cell.type === 'black') {
                return <View key={ci} style={[s.cell, { width: CELL_SIZE, height: CELL_SIZE, backgroundColor: colors.ink }]} />;
              }
              if (cell.type === 'clue') {
                return (
                  <View key={ci} style={[s.cell, { width: CELL_SIZE, height: CELL_SIZE, backgroundColor: colors.surface2 }]}>
                    {cell.downClue !== undefined && (
                      <Text style={s.clueDown}>{cell.downClue}</Text>
                    )}
                    {cell.acrossClue !== undefined && (
                      <Text style={s.clueAcross}>{cell.acrossClue}</Text>
                    )}
                    <View style={s.diagonal} />
                  </View>
                );
              }
              const isSelected = selected?.[0] === ri && selected?.[1] === ci;
              const isCorrect = cell.value !== null && cell.value === cell.solution;
              const isWrong = cell.value !== null && cell.value !== cell.solution;
              return (
                <TouchableOpacity
                  key={ci}
                  style={[
                    s.cell,
                    { width: CELL_SIZE, height: CELL_SIZE, backgroundColor: isSelected ? colors.logic.bg : colors.surface },
                    isWrong && { backgroundColor: '#FFE5E5' },
                    isCorrect && { backgroundColor: colors.number.bg },
                  ]}
                  onPress={() => setSelected([ri, ci])}
                  activeOpacity={0.7}
                >
                  <Text style={[s.cellVal, isSelected && { color: colors.logic.ink }]}>
                    {cell.value ?? ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Numpad */}
      <View style={s.numpad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <TouchableOpacity key={n} style={s.numBtn} onPress={() => handleNumpad(n)} activeOpacity={0.7}>
            <Text style={s.numBtnText}>{n}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[s.numBtn, { backgroundColor: colors.danger + '20' }]} onPress={handleClear} activeOpacity={0.7}>
          <Text style={[s.numBtnText, { color: colors.danger }]}>✕</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.checkBtn} onPress={() => checkSolved(grid)} activeOpacity={0.8}>
        <Text style={s.checkBtnText}>Check</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '✅' : '❌'}</Text>
            <Text style={s.modalTitle}>{won ? 'Solved!' : 'Try Again'}</Text>
            {onBack && (
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 8 }]}
                onPress={onBack}
              >
                <Text style={[s.modalBtnText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.modalBtn} onPress={() => {
              setDone(false);
              completedRef.current = false;
              const next = (puzzleIdx + 1) % KAKURO_PUZZLES.length;
              setPuzzleIdx(next);
              setGrid(KAKURO_PUZZLES[next].map(row => row.map(c => ({ ...c }))));
              setSelected(null);
              elapsedRef.current = 0;
              timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
            }}>
              <Text style={s.modalBtnText}>Next Puzzle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 20, textAlign: 'center' },
  gridWrap: { borderWidth: 1, borderColor: colors.divider, marginBottom: 24 },
  cell: { borderWidth: 0.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cellVal: { fontFamily: fonts.black, fontSize: 20, color: colors.ink },
  clueDown: { position: 'absolute', top: 2, left: 3, fontFamily: fonts.bold, fontSize: 10, color: colors.inkMuted },
  clueAcross: { position: 'absolute', bottom: 2, right: 3, fontFamily: fonts.bold, fontSize: 10, color: colors.inkMuted },
  diagonal: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderTopLeftRadius: 0,
  },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', width: 220, gap: 8, marginBottom: 20, justifyContent: 'center' },
  numBtn: { width: 56, height: 48, backgroundColor: colors.surface, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.divider },
  numBtnText: { fontFamily: fonts.extraBold, fontSize: 18, color: colors.ink },
  checkBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  checkBtnText: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.bg },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
