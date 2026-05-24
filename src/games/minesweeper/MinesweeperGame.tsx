import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { initGrid, reveal, isWon, DIFFICULTY_CONFIG, type MsDifficulty } from './generator';
import type { MineGrid } from './types';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useSaveGame } from '../../utils/gameSave';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  savedStateJSON?: string;
}

const { width: SCREEN_W } = Dimensions.get('window');

const NUM_COLORS = ['', '#3498DB', '#27AE60', '#E74C3C', '#2C3E50', '#8E44AD', '#1ABC9C', '#E67E22', '#95A5A6'];

export function MinesweeperGame({ onComplete, onBack, savedStateJSON }: Props) {
  const colors = useTheme();
  const hapticsEnabled = useSettingsStore(st => st.hapticsEnabled);
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);
  const timerStartedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => { try { return savedStateJSON ? JSON.parse(savedStateJSON) : null; } catch { return null; } }, []);
  const [difficulty, setDifficulty] = useState<MsDifficulty>(() => (saved?.difficulty ?? 'easy') as MsDifficulty);
  const [grid, setGrid] = useState<MineGrid | null>(() => saved?.grid ?? null);
  const [flagMode, setFlagMode] = useState(false);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  useSaveGame('minesweeper', () => ({ difficulty, grid }), !done, [grid], elapsedRef);
  const [exploded, setExploded] = useState<[number, number] | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const s = useMemo(() => makeStyles(colors), [colors]);

  const cfg = DIFFICULTY_CONFIG[difficulty];
  const CELL = Math.min(Math.floor((SCREEN_W - 32) / cfg.cols), 38);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startTimer = useCallback(() => {
    if (timerStartedRef.current) return;
    timerStartedRef.current = true;
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
  }, []);

  const finish = useCallback((w: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setWon(w);
    setDone(true);
    onComplete(w, elapsedRef.current);
  }, [onComplete]);

  const toggleFlag = useCallback((r: number, c: number) => {
    if (!grid) return;
    const cell = grid[r][c];
    if (cell.isRevealed) return;
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGrid(prev => {
      if (!prev) return prev;
      const next = prev.map(row => row.map(cl => ({ ...cl })));
      next[r][c].isFlagged = !next[r][c].isFlagged;
      return next;
    });
  }, [grid, hapticsEnabled]);

  const handleTap = useCallback((r: number, c: number) => {
    if (!grid) {
      startTimer();
      const newGrid = initGrid(r, c, difficulty);
      const revealed = reveal(newGrid, r, c, difficulty);
      setGrid(revealed);
      if (isWon(revealed)) finish(true);
      return;
    }
    const cell = grid[r][c];
    if (cell.isRevealed) return;
    if (flagMode) { toggleFlag(r, c); return; }
    if (cell.isFlagged) return;
    if (cell.isMine) {
      if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setGrid(prev => {
        if (!prev) return prev;
        return prev.map(row => row.map(cl => cl.isMine ? { ...cl, isRevealed: true } : cl));
      });
      setExploded([r, c]);
      finish(false);
      return;
    }
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGrid(prev => {
      if (!prev) return prev;
      const next = reveal(prev, r, c, difficulty);
      if (isWon(next)) finish(true);
      return next;
    });
  }, [grid, flagMode, difficulty, finish, startTimer, toggleFlag, hapticsEnabled]);

  const resetGame = useCallback((diff?: MsDifficulty) => {
    const d = diff ?? difficulty;
    setDone(false);
    completedRef.current = false;
    timerStartedRef.current = false;
    setGrid(null);
    setExploded(null);
    setElapsed(0);
    elapsedRef.current = 0;
    setFlagMode(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (diff) setDifficulty(diff);
  }, [difficulty]);

  const flagCount = grid ? grid.reduce((sum, row) => sum + row.filter(c => c.isFlagged).length, 0) : 0;
  const minesLeft = cfg.mines - flagCount;
  const timeStr = `${Math.floor(elapsed / 60).toString().padStart(2, '0')}:${(elapsed % 60).toString().padStart(2, '0')}`;

  return (
    <View style={s.container}>
      {/* Difficulty selector */}
      <View style={s.diffRow}>
        {(['easy', 'medium', 'hard'] as MsDifficulty[]).map(d => (
          <TouchableOpacity
            key={d}
            style={[s.diffPill, difficulty === d && { backgroundColor: colors.ink, borderColor: colors.ink }]}
            onPress={() => resetGame(d)}
            activeOpacity={0.8}
          >
            <Text style={[s.diffText, difficulty === d && { color: colors.bg }]}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status bar */}
      <View style={s.topRow}>
        <Text style={s.mineCount}>💣 {minesLeft}</Text>
        <Text style={s.timer}>{timeStr}</Text>
        <TouchableOpacity
          style={[s.flagToggle, flagMode && { backgroundColor: colors.danger, borderColor: colors.danger }]}
          onPress={() => setFlagMode(f => !f)}
          activeOpacity={0.8}
        >
          <Text style={[s.flagToggleText, flagMode && { color: '#FFFFFF' }]}>{flagMode ? '🚩 Flag' : '👆 Reveal'}</Text>
        </TouchableOpacity>
      </View>

      <View style={[s.grid, { borderColor: colors.divider }]}>
        {(grid ?? Array.from({ length: cfg.rows }, () => Array(cfg.cols).fill(null))).map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {(row as (MineGrid[0][0] | null)[]).map((cell, ci) => {
              const c = cell ?? { isRevealed: false, isMine: false, isFlagged: false, adjacentMines: 0 };
              const isExp = exploded && exploded[0] === ri && exploded[1] === ci;
              return (
                <TouchableOpacity
                  key={ci}
                  style={[
                    s.cell,
                    { width: CELL, height: CELL },
                    c.isRevealed ? s.cellRevealed : s.cellHidden,
                    isExp && { backgroundColor: '#E74C3C' },
                  ]}
                  onPress={() => handleTap(ri, ci)}
                  onLongPress={() => toggleFlag(ri, ci)}
                  delayLongPress={350}
                  activeOpacity={0.7}
                >
                  <Text style={[s.cellText, c.adjacentMines > 0 && { color: NUM_COLORS[c.adjacentMines] ?? colors.ink }]}>
                    {c.isFlagged && !c.isRevealed ? '🚩' :
                     c.isRevealed && c.isMine ? '💣' :
                     c.isRevealed && c.adjacentMines > 0 ? String(c.adjacentMines) :
                     ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <Text style={s.hint}>Tap to reveal · Long-press to flag</Text>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🎉' : '💥'}</Text>
            <Text style={s.modalTitle}>{won ? 'Cleared!' : 'Boom!'}</Text>
            <Text style={s.modalSub}>{won ? `Time: ${timeStr}` : 'Better luck next time!'}</Text>
            {onBack && (
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 8 }]}
                onPress={onBack}
              >
                <Text style={[s.modalBtnText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.modalBtn} onPress={() => resetGame()}>
              <Text style={s.modalBtnText}>New Game</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  diffRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  diffPill: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, backgroundColor: colors.surface },
  diffText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkSoft },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  mineCount: { fontFamily: fonts.extraBold, fontSize: 20, color: colors.ink, minWidth: 60 },
  timer: { fontFamily: fonts.extraBold, fontSize: 18, color: colors.inkSoft, letterSpacing: 1 },
  flagToggle: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider },
  flagToggleText: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  grid: { borderWidth: 1 },
  cell: { borderWidth: 0.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  cellHidden: { backgroundColor: colors.surface2 },
  cellRevealed: { backgroundColor: colors.rule },
  cellText: { fontFamily: fonts.extraBold, fontSize: 12, color: colors.ink },
  hint: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginTop: 12, textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300, gap: 4 },
  modalEmoji: { fontSize: 52, marginBottom: 8 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 4 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.inkMuted, marginBottom: 20 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999, width: '100%', alignItems: 'center' },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
