import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';
import { useSaveGame } from '../../utils/gameSave';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  savedStateJSON?: string;
}

// Number Maze: move through a grid, must visit cells in ascending order
// Numbers on cells must be visited 1, 2, 3, ... in order
const PUZZLES = [
  {
    rows: 4, cols: 4,
    grid: [
      [ 1, 0, 0, 9],
      [ 0, 3, 0,10],
      [ 0, 4, 0,11],
      [ 2, 5, 6,12],
    ],
    // 0 = free cell, numbers must be visited in order
    maxNum: 12,
  },
  {
    rows: 4, cols: 4,
    grid: [
      [ 1, 0, 8, 9],
      [ 2, 0, 7, 0],
      [ 3, 0, 6, 0],
      [ 4, 5, 0,10],
    ],
    maxNum: 10,
  },
];

const CELL_SIZE = 68;

export function NumberMazeGame({ onComplete, onBack, savedStateJSON }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => { try { return savedStateJSON ? JSON.parse(savedStateJSON) : null; } catch { return null; } }, []);
  const [puzIdx, setPuzIdx] = useState<number>(() => saved?.puzIdx ?? 0);
  const puz = PUZZLES[puzIdx];

  // Find starting position (cell with value 1)
  const startPos = useMemo((): [number, number] => {
    for (let r = 0; r < puz.rows; r++)
      for (let c = 0; c < puz.cols; c++)
        if (puz.grid[r][c] === 1) return [r, c];
    return [0, 0];
  }, [puz]);

  const [pos, setPos] = useState<[number,number]>(() => (saved?.pos as [number,number]) ?? startPos);
  const [nextNum, setNextNum] = useState<number>(() => saved?.nextNum ?? 2);
  const [visited, setVisited] = useState<Set<string>>(() => new Set(saved?.visited ?? ['0,0']));
  const [path, setPath] = useState<[number,number][]>([[startPos[0], startPos[1]]]);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  useSaveGame('number-maze', () => ({ puzIdx, pos, nextNum, visited: [...visited] }), !done, [puzIdx, pos, nextNum], elapsedRef);
  const s = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    // Reset when puzzle changes
    setPos(startPos);
    setNextNum(2);
    const startKey = `${startPos[0]},${startPos[1]}`;
    setVisited(new Set([startKey]));
    setPath([[startPos[0], startPos[1]]]);
  }, [puzIdx, startPos]);

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

  const move = useCallback((dr: number, dc: number) => {
    const [r, c] = pos;
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= puz.rows || nc < 0 || nc >= puz.cols) return;
    const cellVal = puz.grid[nr][nc];
    const key = `${nr},${nc}`;
    // If cell has a required number, must be the next one
    if (cellVal !== 0 && cellVal !== nextNum) return;
    if (visited.has(key)) return;

    const newVisited = new Set(visited);
    newVisited.add(key);
    const newPath = [...path, [nr, nc] as [number, number]];
    setPos([nr, nc]);
    setVisited(newVisited);
    setPath(newPath);

    let newNextNum = nextNum;
    if (cellVal === nextNum) {
      newNextNum = nextNum + 1;
      setNextNum(newNextNum);
      if (nextNum === puz.maxNum) {
        finish(true);
      }
    }
  }, [pos, puz, nextNum, visited, path, finish]);

  const isOnPath = (r: number, c: number) => path.some(([pr, pc]) => pr === r && pc === c);
  const isCurrent = (r: number, c: number) => pos[0] === r && pos[1] === c;

  return (
    <View style={s.container}>
      <Text style={s.title}>Number Maze</Text>
      <Text style={s.subtitle}>Visit numbered cells in order 1→{puz.maxNum}</Text>
      <Text style={s.progress}>Next: {nextNum}</Text>

      <View style={s.grid}>
        {puz.grid.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((val, ci) => {
              const onPath = isOnPath(ri, ci);
              const current = isCurrent(ri, ci);
              return (
                <View
                  key={ci}
                  style={[
                    s.cell,
                    onPath && s.cellPath,
                    current && s.cellCurrent,
                    val !== 0 && val < nextNum && s.cellVisitedNum,
                  ]}
                >
                  {val !== 0 && <Text style={[s.cellNum, val < nextNum && s.cellNumDone]}>{val}</Text>}
                  {current && val === 0 && <View style={s.playerDot} />}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View style={s.dpad}>
        <TouchableOpacity style={s.dpadBtn} onPress={() => move(-1, 0)} activeOpacity={0.7}>
          <Text style={s.dpadText}>▲</Text>
        </TouchableOpacity>
        <View style={s.dpadRow}>
          <TouchableOpacity style={s.dpadBtn} onPress={() => move(0, -1)} activeOpacity={0.7}>
            <Text style={s.dpadText}>◀</Text>
          </TouchableOpacity>
          <View style={s.dpadCenter} />
          <TouchableOpacity style={s.dpadBtn} onPress={() => move(0, 1)} activeOpacity={0.7}>
            <Text style={s.dpadText}>▶</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.dpadBtn} onPress={() => move(1, 0)} activeOpacity={0.7}>
          <Text style={s.dpadText}>▼</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.resetBtn} onPress={() => {
        setPos(startPos); setNextNum(2);
        const startKey = `${startPos[0]},${startPos[1]}`;
        setVisited(new Set([startKey]));
        setPath([[startPos[0], startPos[1]]]);
      }} activeOpacity={0.8}>
        <Text style={s.resetBtnText}>Reset</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🔢' : '❌'}</Text>
            <Text style={s.modalTitle}>{won ? 'Solved!' : 'Try Again'}</Text>
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
              const next = (puzIdx + 1) % PUZZLES.length;
              setPuzIdx(next);
              elapsedRef.current = 0;
              timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
            }}>
              <Text style={s.modalBtnText}>Next Puzzle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginBottom: 8, textAlign: 'center' },
  progress: { fontFamily: fonts.bold, fontSize: 16, color: colors.number.ink, marginBottom: 16 },
  grid: { borderWidth: 2, borderColor: colors.ink, marginBottom: 20 },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  cellPath: { backgroundColor: colors.number.bg + '80' },
  cellCurrent: { backgroundColor: colors.number.bg, borderColor: colors.number.ink, borderWidth: 2 },
  cellVisitedNum: { backgroundColor: colors.number.bg + '40' },
  cellNum: { fontFamily: fonts.black, fontSize: 20, color: colors.ink },
  cellNumDone: { color: colors.number.ink },
  playerDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.number.ink },
  dpad: { alignItems: 'center', marginBottom: 12 },
  dpadRow: { flexDirection: 'row', alignItems: 'center' },
  dpadBtn: { width: 52, height: 52, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, borderRadius: 12, alignItems: 'center', justifyContent: 'center', margin: 4 },
  dpadText: { fontFamily: fonts.black, fontSize: 20, color: colors.ink },
  dpadCenter: { width: 52, height: 52, margin: 4 },
  resetBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999 },
  resetBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
