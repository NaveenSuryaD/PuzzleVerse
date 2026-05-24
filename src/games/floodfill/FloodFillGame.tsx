import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';
import { useSaveGame } from '../../utils/gameSave';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  savedStateJSON?: string;
}

const GRID_SIZE = 6;
const MAX_MOVES = 15;
const COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#F1C40F', '#9B59B6'];
const { width: SCREEN_W } = Dimensions.get('window');
const CELL = Math.min(Math.floor((SCREEN_W - 48) / GRID_SIZE), 54);

function generateGrid(): number[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => Math.floor(Math.random() * COLORS.length))
  );
}

function flood(grid: number[][], color: number): number[][] {
  const next = grid.map(r => [...r]);
  const startColor = next[0][0];
  if (startColor === color) return next;
  const visited = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
  const queue: [number, number][] = [[0, 0]];
  visited[0][0] = true;
  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    next[r][c] = color;
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && !visited[nr][nc] && next[nr][nc] === startColor) {
        visited[nr][nc] = true;
        queue.push([nr, nc]);
      }
    }
  }
  return next;
}

function isSolved(grid: number[][]): boolean {
  const color = grid[0][0];
  return grid.every(row => row.every(c => c === color));
}

export function FloodFillGame({ onComplete, onBack, savedStateJSON }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => { try { return savedStateJSON ? JSON.parse(savedStateJSON) : null; } catch { return null; } }, []);
  const [grid, setGrid] = useState<number[][]>(() => saved?.grid ?? generateGrid());
  const [moves, setMoves] = useState<number>(() => saved?.moves ?? 0);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  useSaveGame('flood-fill', () => ({ grid, moves }), !done, [grid], elapsedRef);
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

  const handleColor = useCallback((colorIdx: number) => {
    if (moves >= MAX_MOVES) return;
    setGrid(prev => {
      const next = flood(prev, colorIdx);
      const newMoves = moves + 1;
      setMoves(newMoves);
      if (isSolved(next)) { finish(true); }
      else if (newMoves >= MAX_MOVES) { finish(false); }
      return next;
    });
  }, [moves, finish]);

  return (
    <View style={s.container}>
      <Text style={s.title}>Flood Fill</Text>
      <Text style={s.subtitle}>Fill the board in {MAX_MOVES} moves · {MAX_MOVES - moves} remaining</Text>

      <View style={s.grid}>
        {grid.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((ci, cj) => (
              <View
                key={cj}
                style={[s.cell, { width: CELL, height: CELL, backgroundColor: COLORS[ci] }]}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={s.palette}>
        {COLORS.map((color, i) => (
          <TouchableOpacity
            key={i}
            style={[s.colorBtn, { backgroundColor: color }]}
            onPress={() => handleColor(i)}
            activeOpacity={0.8}
          />
        ))}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🎨' : '⏱️'}</Text>
            <Text style={s.modalTitle}>{won ? 'Flooded!' : 'Out of Moves'}</Text>
            <Text style={s.modalSub}>Used {moves} / {MAX_MOVES} moves</Text>
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
              setGrid(generateGrid()); setMoves(0);
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
  subtitle: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 20 },
  grid: { borderWidth: 1, borderColor: colors.divider, marginBottom: 24, borderRadius: 4, overflow: 'hidden' },
  cell: { borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)' },
  palette: { flexDirection: 'row', gap: 16 },
  colorBtn: { width: 52, height: 52, borderRadius: 26, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
