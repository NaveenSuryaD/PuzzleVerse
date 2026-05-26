import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { PIPE_PUZZLES, getConnections } from './puzzles';
import { useProgressStore } from '../../store/useProgressStore';
import * as Haptics from 'expo-haptics';
import { useGameTimer } from '../../hooks/useGameTimer';
import { usePersistentGameState } from '../../hooks/usePersistentGameState';
import { ResumeGameModal } from '../../components/ResumeGameModal';

interface PipeConnectSaveState {
  puzzleIdx: number;
  rotations: number[][];
}

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  paused?: boolean;
}

const { width: SCREEN_W } = Dimensions.get('window');
const CELL = Math.min(Math.floor((SCREEN_W - 48) / 5), 64);

function PipeCellView({ type, rotation, isConnected, colors }: {
  type: string; rotation: number; isConnected: boolean;
  colors: ReturnType<typeof useTheme>;
}) {
  const conns = getConnections(type, rotation);
  const hasN = conns.includes('N');
  const hasE = conns.includes('E');
  const hasS = conns.includes('S');
  const hasW = conns.includes('W');
  const pipeColor = isConnected ? colors.visual.ink : colors.inkMuted;
  const thick = 5;
  const half = CELL / 2;

  return (
    <View style={{ width: CELL, height: CELL, position: 'relative' }}>
      {/* Center dot */}
      <View style={{
        position: 'absolute', left: half - thick / 2, top: half - thick / 2,
        width: thick, height: thick, borderRadius: thick, backgroundColor: pipeColor,
      }} />
      {hasN && <View style={{ position: 'absolute', left: half - thick / 2, top: 0, width: thick, height: half, backgroundColor: pipeColor }} />}
      {hasS && <View style={{ position: 'absolute', left: half - thick / 2, top: half, width: thick, height: half, backgroundColor: pipeColor }} />}
      {hasW && <View style={{ position: 'absolute', top: half - thick / 2, left: 0, width: half, height: thick, backgroundColor: pipeColor }} />}
      {hasE && <View style={{ position: 'absolute', top: half - thick / 2, left: half, width: half, height: thick, backgroundColor: pipeColor }} />}
    </View>
  );
}

export function PipeConnectGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const { levels, setGameLevel } = useProgressStore();

  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<PipeConnectSaveState>('pipe-connect');
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<PipeConnectSaveState | null>(null);

  const [level, setLevel] = useState(() => levels['pipe-connect'] ?? 1);
  const [puzzleIdx, setPuzzleIdx] = useState(() => (levels['pipe-connect'] ?? 1) - 1);
  const puzzle = PIPE_PUZZLES[puzzleIdx % PIPE_PUZZLES.length];
  const [rotations, setRotations] = useState<number[][]>(
    () => puzzle.map(row => row.map(() => Math.floor(Math.random() * 4)))
  );
  const [done, setDone] = useState(false);

  const s = useMemo(() => makeStyles(colors), [colors]);

  const initNewGame = useCallback((pIdx: number) => {
    const p = PIPE_PUZZLES[pIdx % PIPE_PUZZLES.length];
    setRotations(p.map(row => row.map(() => Math.floor(Math.random() * 4))));
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
        initNewGame((levels['pipe-connect'] ?? 1) - 1);
        timer.start();
      }
    };
    checkSaved();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (done) { clear(); return; }
    save({ puzzleIdx, rotations }, timer.elapsedSeconds);
  }, [rotations]);

  const handleResume = useCallback(() => {
    setShowResumeModal(false);
    if (pendingSavedState) {
      setPuzzleIdx(pendingSavedState.puzzleIdx);
      setRotations(pendingSavedState.rotations);
    }
    timer.restoreAndResume(resumeElapsed);
    setPendingSavedState(null);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    setShowResumeModal(false);
    clear();
    initNewGame((levels['pipe-connect'] ?? 1) - 1);
    timer.start();
    setPendingSavedState(null);
  }, [clear, timer, initNewGame, levels]);

  const finish = useCallback((w: boolean) => {
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, timer]);

  const checkSolved = useCallback((rots: number[][]) => {
    const solved = rots.every((row, ri) => row.every((rot, ci) => rot === puzzle[ri][ci].solvedRotation));
    if (solved) finish(true);
  }, [puzzle, finish]);

  const handleTap = useCallback((ri: number, ci: number) => {
    setRotations(prev => {
      const next = prev.map(r => [...r]);
      next[ri][ci] = (next[ri][ci] + 1) % 4;
      checkSolved(next);
      return next;
    });
  }, [checkSolved]);

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="🔧"
        gameName="Pipe Connect"
        elapsedSeconds={resumeElapsed}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Text style={s.title}>Pipe Connect</Text>
        <View style={[s.levelBadge, { backgroundColor: colors.visual.bg }]}>
          <Text style={[s.levelText, { color: colors.visual.ink }]}>Level {level}</Text>
        </View>
      </View>
      <Text style={s.subtitle}>Tap cells to rotate · Connect all pipes</Text>

      <View style={s.grid}>
        {puzzle.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((cell, ci) => (
              <TouchableOpacity
                key={ci}
                style={[s.cell, { width: CELL, height: CELL }]}
                onPress={() => handleTap(ri, ci)}
                activeOpacity={0.8}
              >
                <PipeCellView
                  type={cell.type}
                  rotation={rotations[ri][ci]}
                  isConnected={rotations[ri][ci] === cell.solvedRotation}
                  colors={colors}
                />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>🔧</Text>
            <Text style={s.modalTitle}>Connected!</Text>
            <Text style={[s.modalSub, { color: colors.inkMuted }]}>Level {level} complete!</Text>
            {onBack && (
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 8 }]}
                onPress={onBack}
              >
                <Text style={[s.modalBtnText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.modalBtn} onPress={() => {
              const nextIdx = puzzleIdx + 1;
              const nextLevel = level + 1;
              setDone(false);
              setLevel(nextLevel);
              setGameLevel('pipe-connect', nextLevel);
              setPuzzleIdx(nextIdx);
              initNewGame(nextIdx);
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink },
  levelBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  levelText: { fontFamily: fonts.extraBold, fontSize: 13 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 24 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 14, marginBottom: 16 },
  grid: { borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface },
  cell: { borderWidth: 0.5, borderColor: colors.rule, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
