import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { PIPE_PUZZLES, getConnections } from './puzzles';
import { useProgressStore } from '../../store/useProgressStore';
import * as Haptics from 'expo-haptics';
import { useSaveGame } from '../../utils/gameSave';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  savedStateJSON?: string;
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

export function PipeConnectGame({ onComplete, onBack, savedStateJSON }: Props) {
  const colors = useTheme();
  const { levels, setGameLevel } = useProgressStore();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => { try { return savedStateJSON ? JSON.parse(savedStateJSON) : null; } catch { return null; } }, []);
  const [level, setLevel] = useState(() => levels['pipe-connect'] ?? 1);
  const [puzzleIdx, setPuzzleIdx] = useState(() => (levels['pipe-connect'] ?? 1) - 1);
  const puzzle = PIPE_PUZZLES[puzzleIdx % PIPE_PUZZLES.length];
  const [rotations, setRotations] = useState<number[][]>(
    () => saved?.rotations ?? puzzle.map(row => row.map(() => Math.floor(Math.random() * 4)))
  );
  const [done, setDone] = useState(false);

  useSaveGame('pipe-connect', () => ({ puzzleIdx, rotations }), !done, [rotations], elapsedRef);
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
              const nextPuzzle = PIPE_PUZZLES[nextIdx % PIPE_PUZZLES.length];
              setDone(false);
              completedRef.current = false;
              setLevel(nextLevel);
              setGameLevel('pipe-connect', nextLevel);
              setPuzzleIdx(nextIdx);
              setRotations(nextPuzzle.map(row => row.map(() => Math.floor(Math.random() * 4))));
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
