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
import { useGameTimer } from '../../hooks/useGameTimer';
import { usePersistentGameState } from '../../hooks/usePersistentGameState';
import { ResumeGameModal } from '../../components/ResumeGameModal';

const BEST_SCORE_KEY = '2048-best-score';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  paused?: boolean;
}

interface SaveState {
  gameState: GameState;
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

export function Game2048Game({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const hapticsEnabled = useSettingsStore(st => st.hapticsEnabled);
  const completedRef = useRef(false);

  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('game-2048');

  const [gameState, setGameState] = useState<GameState>(() => initGame());
  const [undoStack, setUndoStack] = useState<GameState[]>([]);
  const [done, setDone] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SaveState | null>(null);

  const prevGridRef = useRef<Grid>(gameState.grid);

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

  // Mount: check for saved game
  useEffect(() => {
    load().then(result => {
      if (result.found && result.gameState) {
        setPendingSavedState(result.gameState);
        setResumeElapsed(result.elapsedSeconds);
        setShowResumeModal(true);
      } else {
        timer.start();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResume = useCallback(() => {
    setShowResumeModal(false);
    if (pendingSavedState) {
      setGameState(pendingSavedState.gameState);
      prevGridRef.current = pendingSavedState.gameState.grid;
    }
    timer.restoreAndResume(resumeElapsed);
    setPendingSavedState(null);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    setShowResumeModal(false);
    setPendingSavedState(null);
    clear();
    timer.start();
  }, [clear, timer]);

  // Save effect
  useEffect(() => {
    if (done || gameState.over) {
      clear();
      return;
    }
    save({ gameState }, timer.elapsedSeconds);
  }, [gameState, done]); // eslint-disable-line react-hooks/exhaustive-deps

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
          const anim = cellScales.current[idx];
          anim.setValue(0);
          Animated.spring(anim, {
            toValue: 1, useNativeDriver: true, tension: 200, friction: 8,
          }).start();
        } else if (prevVal && currVal && currVal > prevVal) {
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
    timer.pause();
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, timer]);

  useEffect(() => {
    if (gameState.won) finish(true);
    else if (gameState.over) finish(false);
  }, [gameState.won, gameState.over, finish]);

  // Ref-based move handler to avoid stale closures in PanResponder
  const handleMoveRef = useRef<(dir: 'left' | 'right' | 'up' | 'down') => void>(() => {});
  handleMoveRef.current = (dir: 'left' | 'right' | 'up' | 'down') => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGameState(prev => {
      setUndoStack(stack => [...stack.slice(-4), prev]);
      return move(prev, dir);
    });
  };

  // PanResponder created once — uses ref to always have latest handler
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => {
        return Math.abs(gs.dx) > 8 || Math.abs(gs.dy) > 8;
      },
      onPanResponderRelease: (_, gs) => {
        const { dx, dy } = gs;
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          handleMoveRef.current(dx > 0 ? 'right' : 'left');
        } else {
          handleMoveRef.current(dy > 0 ? 'down' : 'up');
        }
      },
    })
  ).current;

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(stack => stack.slice(0, -1));
    setGameState(prev);
  }, [undoStack, hapticsEnabled]);

  const handleNewGame = useCallback(() => {
    const newState = initGame();
    prevGridRef.current = newState.grid;
    cellScales.current.forEach(a => a.setValue(1));
    setGameState(newState);
    setUndoStack([]);
    setDone(false);
    completedRef.current = false;
    timer.start();
  }, [timer]);


  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="🔢"
        gameName="2048"
        elapsedSeconds={resumeElapsed}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

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

      {/* Controls row */}
      <View style={s.controlsRow}>
        <TouchableOpacity
          style={[s.controlBtn, undoStack.length === 0 && s.controlBtnDisabled]}
          onPress={handleUndo}
          disabled={undoStack.length === 0}
          activeOpacity={0.8}
        >
          <Text style={[s.controlBtnText, undoStack.length === 0 && { color: colors.inkMuted }]}>Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.controlBtn} onPress={handleNewGame} activeOpacity={0.8}>
          <Text style={s.controlBtnText}>New Game</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{gameState.won ? '🎊' : '😔'}</Text>
            <Text style={s.modalTitle}>{gameState.won ? 'You reached 2048!' : 'Game Over'}</Text>
            <Text style={s.modalSub}>Score: {gameState.score}</Text>
            {gameState.score >= bestScore && gameState.score > 0 && (
              <Text style={[s.bestLabel, { color: colors.logic.ink }]}>New best score!</Text>
            )}
            {onBack && (
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 8 }]}
                onPress={onBack}
              >
                <Text style={[s.modalBtnText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.modalBtn} onPress={handleNewGame}>
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
  scoreBar: { flexDirection: 'row', gap: 12, marginBottom: 16 },
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
  cellVal: { fontFamily: fonts.black, color: colors.ink },
  hint: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginTop: 12, textAlign: 'center' },
  controlsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  controlBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.divider,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 999,
  },
  controlBtnDisabled: { opacity: 0.4 },
  controlBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft },
  bestLabel: { fontFamily: fonts.bold, fontSize: 13, marginBottom: 4, color: colors.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300, gap: 4 },
  modalEmoji: { fontSize: 52, marginBottom: 8 },
  modalTitle: { fontFamily: fonts.black, fontSize: 24, color: colors.ink, marginBottom: 4, textAlign: 'center' },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 16 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999, width: '100%', alignItems: 'center' },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
