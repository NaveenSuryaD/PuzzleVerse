import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { generateMaze, MAZE_SIZE } from './generator';
import * as Haptics from 'expo-haptics';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

const { width: SCREEN_W } = Dimensions.get('window');
const CELL_SIZE = Math.min(Math.floor((SCREEN_W - 48) / MAZE_SIZE), 28);

export function MazeRunnerGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const [maze] = useState(() => generateMaze());
  const [pos, setPos] = useState<[number, number]>([1, 1]);
  const [done, setDone] = useState(false);

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
      <Text style={s.title}>Maze Runner</Text>
      <Text style={s.subtitle}>Navigate from entry (top) to exit (bottom)</Text>

      <View style={s.mazeWrap}>
        {maze.cells.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((isWall, ci) => {
              const isPlayer = pos[0] === ri && pos[1] === ci;
              const isStart = ri === 0 && ci === 1;
              const isEnd = ri === maze.size - 1 && ci === maze.size - 2;
              return (
                <View
                  key={ci}
                  style={[
                    { width: CELL_SIZE, height: CELL_SIZE },
                    isWall ? s.wall : s.passage,
                    isEnd && s.exit,
                  ]}
                >
                  {isPlayer && (
                    <View style={s.player} />
                  )}
                  {isEnd && !isPlayer && (
                    <Text style={{ fontSize: CELL_SIZE * 0.5, textAlign: 'center', lineHeight: CELL_SIZE }}>★</Text>
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
            <Text style={s.modalSub}>Time: {elapsedRef.current}s</Text>
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
              setPos([1, 1]);
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginBottom: 16 },
  mazeWrap: { borderWidth: 1, borderColor: colors.ink, marginBottom: 20 },
  wall: { backgroundColor: colors.ink },
  passage: { backgroundColor: colors.surface },
  exit: { backgroundColor: colors.success + '40' },
  player: { width: CELL_SIZE * 0.6, height: CELL_SIZE * 0.6, borderRadius: CELL_SIZE * 0.3, backgroundColor: colors.danger, margin: CELL_SIZE * 0.2 },
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
