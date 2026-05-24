import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, PanResponder,
  Modal, Dimensions, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { initGame, move } from './generator';
import type { GameState, Grid } from './types';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../../store/useSettingsStore';

const BEST_SCORE_KEY = '2048-best-score';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_SIZE = Math.min(SCREEN_W - 48, 340);
const CELL_SIZE = (GRID_SIZE - 16) / 4;

const TILE_COLORS: Record<number, { bg: string; ink: string }> = {
  2:    { bg: '#EEE4DA', ink: '#776E65' },
  4:    { bg: '#EDE0C8', ink: '#776E65' },
  8:    { bg: '#F2B179', ink: '#FFFFFF' },
  16:   { bg: '#F59563', ink: '#FFFFFF' },
  32:   { bg: '#F67C5F', ink: '#FFFFFF' },
  64:   { bg: '#F65E3B', ink: '#FFFFFF' },
  128:  { bg: '#EDCF72', ink: '#FFFFFF' },
  256:  { bg: '#EDCC61', ink: '#FFFFFF' },
  512:  { bg: '#EDC850', ink: '#FFFFFF' },
  1024: { bg: '#EDC53F', ink: '#FFFFFF' },
  2048: { bg: '#EDC22E', ink: '#FFFFFF' },
};

export function Game2048Game({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const hapticsEnabled = useSettingsStore(st => st.hapticsEnabled);
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const [gameState, setGameState] = useState<GameState>(initGame);
  const [done, setDone] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  const prevGridRef = useRef<Grid>(gameState.grid);

  // 16 scale animations — one per cell (row-major)
  const cellScales = useRef(
    Array.from({ length: 16 }, () => new Animated.Value(1)),
  );

  const s = useMemo(() => makeStyles(colors), [colors]);

  // Load best score
  useEffect(() => {
    AsyncStorage.getItem(BEST_SCORE_KEY).then(val => {
      if (val) setBestScore(parseInt(val, 10));
    });
  }, []);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Persist best score
  useEffect(() => {
    if (gameState.score > bestScore) {
      setBestScore(gameState.score);
      AsyncStorage.setItem(BEST_SCORE_KEY, String(gameState.score));
    }
  }, [gameState.score, bestScore]);

  // Animate new tile pop-in and merged tile scale
  useEffect(() => {
    const prev = prevGridRef.current;
    const curr = gameState.grid;

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const idx = r * 4 + c;
        const prevVal = prev[r][c];
        const currVal = curr[r][c];

        if (!prevVal && currVal) {
          // New tile pop-in
          const anim = cellScales.current[idx];
          anim.setValue(0);
          Animated.spring(anim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 200,
            friction: 8,
          }).start();
        } else if (prevVal && currVal && currVal > prevVal) {
          // Merged tile scale pulse
          const anim = cellScales.current[idx];
          Animated.sequence([
            Animated.timing(anim, { toValue: 1.18, duration: 80, useNativeDriver: true }),
            Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 180, friction: 7 }),
          ]).start();
        }
      }
    }

    prevGridRef.current = curr;
  }, [gameState.grid]);

  const finish = useCallback((w: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setDone(true);
    onComplete(w, elapsedRef.current);
  }, [onComplete]);

  useEffect(() => {
    if (gameState.won) finish(true);
    else if (gameState.over) finish(false);
  }, [gameState.won, gameState.over, finish]);

  const handleMove = useCallback((dir: 'left' | 'right' | 'up' | 'down') => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGameState(prev => move(prev, dir));
  }, [hapticsEnabled]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderRelease: (_, gs) => {
      const { dx, dy } = gs;
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        handleMove(dx > 0 ? 'right' : 'left');
      } else {
        handleMove(dy > 0 ? 'down' : 'up');
      }
    },
  }), [handleMove]);

  return (
    <View style={s.container}>
      {/* Score bar */}
      <View style={s.scoreBar}>
        <View style={s.scoreBox}>
          <Text style={s.scoreLabel}>SCORE</Text>
          <Text style={s.scoreVal}>{gameState.score}</Text>
        </View>
        <View style={s.scoreBox}>
          <Text style={s.scoreLabel}>BEST</Text>
          <Text style={s.scoreVal}>{Math.max(bestScore, gameState.score)}</Text>
        </View>
      </View>

      <View {...panResponder.panHandlers} style={s.gridWrapper}>
        <View style={s.grid}>
          {gameState.grid.map((row, ri) =>
            row.map((val, ci) => {
              const idx = ri * 4 + ci;
              const tc = val ? TILE_COLORS[val] ?? { bg: '#3C3A32', ink: '#FFFFFF' } : null;
              return (
                <Animated.View
                  key={`${ri}-${ci}`}
                  style={[
                    s.cell,
                    val ? { backgroundColor: tc!.bg } : s.emptyCell,
                    { transform: [{ scale: cellScales.current[idx] }] },
                  ]}
                >
                  {val ? (
                    <Text style={[
                      s.cellVal,
                      { color: tc!.ink, fontSize: val >= 1024 ? 18 : val >= 128 ? 22 : 26 },
                    ]}>
                      {val}
                    </Text>
                  ) : null}
                </Animated.View>
              );
            })
          )}
        </View>
      </View>

      <Text style={s.hint}>Swipe to move tiles · Merge to reach 2048</Text>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{gameState.won ? '🎊' : '😔'}</Text>
            <Text style={s.modalTitle}>{gameState.won ? 'You reached 2048!' : 'Game Over'}</Text>
            <Text style={s.modalSub}>Score: {gameState.score}</Text>
            {gameState.score >= bestScore && gameState.score > 0 && (
              <Text style={[s.bestLabel, { color: colors.logic.ink }]}>New best score! 🏆</Text>
            )}
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
              const newState = initGame();
              prevGridRef.current = newState.grid;
              // Reset cell scales
              cellScales.current.forEach(a => a.setValue(1));
              setGameState(newState);
              elapsedRef.current = 0;
              if (timerRef.current) clearInterval(timerRef.current);
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
  scoreBar: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  scoreBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    minWidth: 80,
  },
  scoreLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.inkMuted, letterSpacing: 1 },
  scoreVal: { fontFamily: fonts.black, fontSize: 26, color: colors.ink },
  gridWrapper: { borderRadius: 12, overflow: 'hidden' },
  grid: {
    width: GRID_SIZE, height: GRID_SIZE,
    backgroundColor: '#BBADA0',
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 4, padding: 4,
  },
  cell: {
    width: CELL_SIZE, height: CELL_SIZE,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  emptyCell: { backgroundColor: 'rgba(238,228,218,0.35)' },
  cellVal: { fontFamily: fonts.black },
  hint: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginTop: 16, textAlign: 'center' },
  bestLabel: { fontFamily: fonts.bold, fontSize: 13, marginBottom: 8 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300, gap: 4 },
  modalEmoji: { fontSize: 52, marginBottom: 8 },
  modalTitle: { fontFamily: fonts.black, fontSize: 24, color: colors.ink, marginBottom: 4, textAlign: 'center' },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 16 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999, width: '100%', alignItems: 'center' },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
