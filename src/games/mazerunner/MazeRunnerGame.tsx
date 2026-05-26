import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { generateMaze, getMazeSize, type MazeData } from './generator';
import { useProgressStore } from '../../store/useProgressStore';
import * as Haptics from 'expo-haptics';
import { useGameTimer } from '../../hooks/useGameTimer';
import { usePersistentGameState } from '../../hooks/usePersistentGameState';
import { ResumeGameModal } from '../../components/ResumeGameModal';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  paused?: boolean;
}

interface SaveState {
  maze: MazeData;
  pos: [number, number];
}

const { width: SCREEN_W } = Dimensions.get('window');

export function MazeRunnerGame({ onComplete, onBack,
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

  const { save, load, clear } = usePersistentGameState<SaveState>('maze-runner');

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SaveState | null>(null);

  const [level, setLevel] = useState(() => levels['maze-runner'] ?? 1);
  const [maze, setMaze] = useState<MazeData>(() => generateMaze(levels['maze-runner'] ?? 1));
  const [pos, setPos] = useState<[number, number]>([1, 1]);
  const [done, setDone] = useState(false);

  const cellSize = Math.min(Math.floor((SCREEN_W - 48) / getMazeSize(level)), 28);

  const s = useMemo(() => makeStyles(colors), [colors]);

  // Mount effect: load saved state
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

  // Save effect: save on state changes
  useEffect(() => {
    if (!done) {
      save({ maze, pos }, timer.elapsedSeconds);
    }
  }, [pos, done, maze, timer.elapsedSeconds, save]);

  const handleResume = useCallback(() => {
    if (pendingSavedState) {
      setMaze(pendingSavedState.maze);
      setPos(pendingSavedState.pos);
    }
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    clear();
    setShowResumeModal(false);
    timer.start();
  }, [clear, timer]);

  const finish = useCallback((w: boolean) => {
    timer.pause();
    clear();
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, timer, clear]);

  const move = useCallback((dr: number, dc: number) => {
    setPos(prev => {
      const [r, c] = prev;
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= maze.size || nc < 0 || nc >= maze.size) return prev;
      if (maze.cells[nr][nc]) return prev; // wall
      if (nr === maze.size - 1 && nc === maze.size - 2) {
        finish(true);
      }
      return [nr, nc];
    });
  }, [maze, finish]);

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="🌀"
        gameName="Maze Runner"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `Level ${level}` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Text style={s.title}>Maze Runner</Text>
        <View style={[s.levelBadge, { backgroundColor: colors.visual.bg }]}>
          <Text style={[s.levelText, { color: colors.visual.ink }]}>Level {level}</Text>
        </View>
      </View>
      <Text style={s.subtitle}>Navigate from entry (top) to exit (bottom)</Text>

      <View style={s.mazeWrap}>
        {maze.cells.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((isWall, ci) => {
              const isPlayer = pos[0] === ri && pos[1] === ci;
              const isEnd = ri === maze.size - 1 && ci === maze.size - 2;
              return (
                <View
                  key={ci}
                  style={[
                    { width: cellSize, height: cellSize },
                    isWall ? s.wall : s.passage,
                    isEnd && s.exit,
                  ]}
                >
                  {isPlayer && (
                    <View style={[s.player, { width: cellSize * 0.6, height: cellSize * 0.6, borderRadius: cellSize * 0.3, margin: cellSize * 0.2 }]} />
                  )}
                  {isEnd && !isPlayer && (
                    <Text style={{ fontSize: cellSize * 0.5, textAlign: 'center', lineHeight: cellSize }}>★</Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* D-pad */}
      <View style={s.dpad}>
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <TouchableOpacity style={s.dBtn} onPress={() => move(-1, 0)} activeOpacity={0.7}>
            <Ionicons name="chevron-up" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
          <TouchableOpacity style={s.dBtn} onPress={() => move(0, -1)} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <View style={[s.dBtn, { backgroundColor: 'transparent' }]} />
          <TouchableOpacity style={s.dBtn} onPress={() => move(0, 1)} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <TouchableOpacity style={s.dBtn} onPress={() => move(1, 0)} activeOpacity={0.7}>
            <Ionicons name="chevron-down" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>🏃</Text>
            <Text style={s.modalTitle}>Escaped!</Text>
            <Text style={s.modalSub}>Level {level} · Time: {timer.elapsedSeconds}s</Text>
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
              setGameLevel('maze-runner', nextLevel);
              const nextMaze = generateMaze(nextLevel);
              setMaze(nextMaze);
              setPos([1, 1]);
              timer.start();
            }}>
              <Text style={s.modalBtnText}>Next Level →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.modalBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 8 }]} onPress={() => {
              setDone(false);
              const newMaze = generateMaze(level);
              setMaze(newMaze);
              setPos([1, 1]);
              timer.start();
            }}>
              <Text style={[s.modalBtnText, { color: colors.inkSoft }]}>Replay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink },
  levelBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  levelText: { fontFamily: fonts.extraBold, fontSize: 13 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginBottom: 16 },
  mazeWrap: { borderWidth: 1, borderColor: colors.ink, marginBottom: 20 },
  wall: { backgroundColor: colors.ink },
  passage: { backgroundColor: colors.surface },
  exit: { backgroundColor: colors.success + '40' },
  player: { backgroundColor: colors.danger },
  dpad: { gap: 4 },
  dBtn: { width: 52, height: 52, backgroundColor: colors.surface, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: colors.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
