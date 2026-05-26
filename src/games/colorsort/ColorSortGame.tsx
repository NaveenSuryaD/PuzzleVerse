import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { generateColorSort, isSolved, canMove, applyMove } from './generator';
import type { Tube } from './types';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useProgressStore } from '../../store/useProgressStore';
import { useGameTimer } from '../../hooks/useGameTimer';
import { usePersistentGameState } from '../../hooks/usePersistentGameState';
import { ResumeGameModal } from '../../components/ResumeGameModal';

interface ColorSortSaveState {
  tubes: Tube[];
  moves: number;
}

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  paused?: boolean;
}

const COLOR_MAP: Record<string, string> = {
  red: '#E74C3C',
  blue: '#3498DB',
  green: '#2ECC71',
  yellow: '#F1C40F',
  purple: '#9B59B6',
  orange: '#E67E22',
  cyan: '#1ABC9C',
};

export function ColorSortGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const hapticsEnabled = useSettingsStore(st => st.hapticsEnabled);
  const { levels, setGameLevel } = useProgressStore();

  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<ColorSortSaveState>('color-sort');
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<ColorSortSaveState | null>(null);

  const [level, setLevel] = useState(() => levels['color-sort'] ?? 1);
  const [tubes, setTubes] = useState<Tube[]>(() => generateColorSort(levels['color-sort'] ?? 1).tubes);
  const [history, setHistory] = useState<Tube[][]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [moves, setMoves] = useState<number>(0);

  const s = useMemo(() => makeStyles(colors), [colors]);

  const initNewGame = useCallback((lv: number) => {
    const newTubes = generateColorSort(lv).tubes;
    setTubes(newTubes);
    setHistory([]);
    setSelected(null);
    setMoves(0);
    setDone(false);
  }, []);

  useEffect(() => {
    const checkSaved = async () => {
      const result = await load();
      if (result.found && result.gameState) {
        setPendingSavedState(result.gameState);
        setResumeElapsed(result.elapsedSeconds);
        setShowResumeModal(true);
      } else {
        initNewGame(levels['color-sort'] ?? 1);
        timer.start();
      }
    };
    checkSaved();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (done) { clear(); return; }
    save({ tubes, moves }, timer.elapsedSeconds);
  }, [tubes]);

  const handleResume = useCallback(() => {
    setShowResumeModal(false);
    if (pendingSavedState) {
      setTubes(pendingSavedState.tubes);
      setMoves(pendingSavedState.moves);
    }
    timer.restoreAndResume(resumeElapsed);
    setPendingSavedState(null);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    setShowResumeModal(false);
    clear();
    initNewGame(levels['color-sort'] ?? 1);
    timer.start();
    setPendingSavedState(null);
  }, [clear, timer, initNewGame, levels]);

  const finish = useCallback((w: boolean) => {
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, timer]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setTubes(prev);
    setMoves(m => Math.max(0, m - 1));
    setSelected(null);
  }, [history, hapticsEnabled]);

  const handleTubeTap = useCallback((idx: number) => {
    if (selected === null) {
      if (tubes[idx].length > 0) {
        if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelected(idx);
      }
      return;
    }
    if (selected === idx) {
      setSelected(null);
      return;
    }
    if (canMove(tubes, selected, idx)) {
      if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setHistory(h => [...h, tubes]);
      const next = applyMove(tubes, selected, idx);
      setTubes(next);
      setMoves(m => m + 1);
      setSelected(null);
      if (isSolved(next)) finish(true);
    } else {
      setSelected(idx);
    }
  }, [selected, tubes, history, finish, hapticsEnabled]);

  const TUBE_H = 180;
  const BALL_H = TUBE_H / 4 - 4;

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="🎨"
        gameName="Color Sort"
        elapsedSeconds={resumeElapsed}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      {/* Header */}
      <View style={s.header}>
        <View style={[s.levelBadge, { backgroundColor: colors.visual.bg }]}>
          <Text style={[s.levelText, { color: colors.visual.ink }]}>Level {level}</Text>
        </View>
        <Text style={s.moveCount}>Moves: {moves}</Text>
      </View>

      <View style={s.tubesRow}>
        {tubes.map((tube, ti) => (
          <TouchableOpacity
            key={ti}
            style={[
              s.tube,
              selected === ti && s.tubeSelected,
              { height: TUBE_H },
            ]}
            onPress={() => handleTubeTap(ti)}
            activeOpacity={0.85}
          >
            <View style={s.tubeInner}>
              {[...Array(4)].map((_, bi) => {
                const ballColor = tube[bi];
                return (
                  <View
                    key={bi}
                    style={[
                      s.ball,
                      { height: BALL_H, backgroundColor: ballColor ? COLOR_MAP[ballColor] : 'transparent' },
                    ]}
                  />
                );
              })}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Action buttons */}
      <View style={s.actionRow}>
        <TouchableOpacity
          style={[s.actionBtn, history.length === 0 && { opacity: 0.35 }]}
          onPress={handleUndo}
          disabled={history.length === 0}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-undo" size={16} color={colors.ink} />
          <Text style={s.actionBtnText}>Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={() => {
          setTubes(generateColorSort(level).tubes);
          setHistory([]);
          setSelected(null);
          setMoves(0);
        }} activeOpacity={0.8}>
          <Ionicons name="refresh" size={16} color={colors.ink} />
          <Text style={s.actionBtnText}>Restart</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>🎨</Text>
            <Text style={s.modalTitle}>Sorted!</Text>
            <Text style={s.modalSub}>Completed in {moves} moves</Text>
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
              setDone(false);
              setLevel(nextLevel);
              setGameLevel('color-sort', nextLevel);
              initNewGame(nextLevel);
              timer.start();
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  levelBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  levelText: { fontFamily: fonts.extraBold, fontSize: 14 },
  moveCount: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.inkMuted },
  tubesRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-end', marginBottom: 28 },
  tube: {
    width: 44, borderRadius: 22, borderWidth: 2.5,
    borderColor: colors.divider, backgroundColor: colors.surface,
    justifyContent: 'flex-end', overflow: 'hidden',
  },
  tubeSelected: { borderColor: colors.logic.ink, shadowColor: colors.logic.ink, shadowRadius: 8, shadowOpacity: 0.4, elevation: 6 },
  tubeInner: { flex: 1, justifyContent: 'flex-end' },
  ball: { width: '100%', borderRadius: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999,
  },
  actionBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
