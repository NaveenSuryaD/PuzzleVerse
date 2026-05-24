import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { solvedGrid, shuffle, isSolved, findEmpty } from './generator';
import type { TileGrid } from './types';
import { useProgressStore } from '../../store/useProgressStore';
import * as Haptics from 'expo-haptics';
import { useSaveGame } from '../../utils/gameSave';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  savedStateJSON?: string;
}

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_SIZE = Math.min(SCREEN_W - 48, 320);
const CELL = GRID_SIZE / 4;

export function SlidingPuzzleGame({ onComplete, onBack, savedStateJSON }: Props) {
  const colors = useTheme();
  const { levels, setGameLevel } = useProgressStore();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => { try { return savedStateJSON ? JSON.parse(savedStateJSON) : null; } catch { return null; } }, []);
  const [level, setLevel] = useState(() => levels['sliding-puzzle'] ?? 1);
  const shuffleMoves = Math.min(50 + (level - 1) * 75, 300);
  const [grid, setGrid] = useState<TileGrid>(() => saved?.grid ?? shuffle(solvedGrid(), shuffleMoves));
  const [moves, setMoves] = useState<number>(() => saved?.moves ?? 0);
  const [done, setDone] = useState(false);

  useSaveGame('sliding-puzzle', () => ({ grid, moves }), !done, [grid], elapsedRef);

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

  const handleTap = useCallback((r: number, c: number) => {
    if (grid[r][c] === null) return;
    const [er, ec] = findEmpty(grid);
    if ((Math.abs(r - er) === 1 && c === ec) || (Math.abs(c - ec) === 1 && r === er)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setGrid(prev => {
        const next = prev.map(row => [...row]);
        next[er][ec] = next[r][c];
        next[r][c] = null;
        if (isSolved(next)) finish(true);
        return next;
      });
      setMoves(m => m + 1);
    }
  }, [grid, finish]);

  return (
    <View style={s.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Text style={s.title}>Sliding Puzzle</Text>
        <View style={[s.levelBadge, { backgroundColor: colors.visual.bg }]}>
          <Text style={[s.levelText, { color: colors.visual.ink }]}>Level {level}</Text>
        </View>
      </View>
      <Text style={s.subtitle}>Arrange 1–15 in order · Moves: {moves}</Text>

      <View style={[s.grid, { width: GRID_SIZE, height: GRID_SIZE }]}>
        {grid.map((row, ri) =>
          row.map((val, ci) => (
            <TouchableOpacity
              key={`${ri}-${ci}`}
              style={[
                s.tile,
                { width: CELL - 4, height: CELL - 4, left: ci * CELL + 2, top: ri * CELL + 2 },
                val === null ? s.emptyTile : s.filledTile,
              ]}
              onPress={() => handleTap(ri, ci)}
              activeOpacity={val ? 0.8 : 1}
              disabled={!val}
            >
              {val !== null && (
                <Text style={s.tileText}>{val}</Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      <TouchableOpacity style={s.resetBtn} onPress={() => {
        setGrid(shuffle(solvedGrid(), shuffleMoves));
        setMoves(0);
      }} activeOpacity={0.8}>
        <Text style={s.resetBtnText}>Shuffle</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>🎉</Text>
            <Text style={s.modalTitle}>Solved!</Text>
            <Text style={s.modalSub}>Level {level} · {moves} moves</Text>
            {onBack && (
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 8 }]}
                onPress={onBack}
              >
                <Text style={[s.modalBtnText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.modalBtn} onPress={() => {
              const nextLevel = level + 1;
              const nextShuffleMoves = Math.min(50 + (nextLevel - 1) * 75, 300);
              setDone(false);
              completedRef.current = false;
              setLevel(nextLevel);
              setGameLevel('sliding-puzzle', nextLevel);
              setGrid(shuffle(solvedGrid(), nextShuffleMoves));
              setMoves(0);
              elapsedRef.current = 0;
              timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
            }}>
              <Text style={s.modalBtnText}>Next Level</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink },
  levelBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  levelText: { fontFamily: fonts.extraBold, fontSize: 13 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 24 },
  grid: { position: 'relative', backgroundColor: colors.surface2, borderRadius: 12, marginBottom: 24 },
  tile: { position: 'absolute', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  filledTile: { backgroundColor: colors.visual.bg, shadowColor: colors.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  emptyTile: { backgroundColor: 'transparent' },
  tileText: { fontFamily: fonts.black, fontSize: 22, color: colors.visual.ink },
  resetBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999 },
  resetBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
