import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { NONOGRAM_PUZZLES } from './puzzles';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useSaveGame } from '../../utils/gameSave';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  savedStateJSON?: string;
}

const CELL = 44;

type CellState = 'filled' | 'empty' | 'unknown';

function getRowBlocks(row: CellState[]): number[] {
  const blocks: number[] = [];
  let count = 0;
  for (const cell of row) {
    if (cell === 'filled') {
      count++;
    } else {
      if (count > 0) { blocks.push(count); count = 0; }
    }
  }
  if (count > 0) blocks.push(count);
  return blocks;
}

function isClueSatisfied(row: CellState[], clue: number[]): boolean {
  const blocks = getRowBlocks(row);
  return blocks.length === clue.length && blocks.every((b, i) => b === clue[i]);
}

export function NonogramGame({ onComplete, onBack, savedStateJSON }: Props) {
  const colors = useTheme();
  const hapticsEnabled = useSettingsStore(st => st.hapticsEnabled);
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => { try { return savedStateJSON ? JSON.parse(savedStateJSON) : null; } catch { return null; } }, []);
  const [puzzleIdx, setPuzzleIdx] = useState<number>(() => saved?.puzzleIdx ?? 0);
  const puzzle = NONOGRAM_PUZZLES[puzzleIdx];
  const N = puzzle.solution.length;

  const [grid, setGrid] = useState<CellState[][]>(() =>
    saved?.grid ?? Array.from({ length: N }, () => Array(N).fill('unknown'))
  );
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  useSaveGame('nonogram', () => ({ puzzleIdx, grid }), !done, [puzzleIdx, grid], elapsedRef);

  const s = useMemo(() => makeStyles(colors), [colors]);

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

  const checkSolved = useCallback((g: CellState[][]) => {
    const correct = g.every((row, ri) =>
      row.every((v, ci) => (v === 'filled') === puzzle.solution[ri][ci])
    );
    if (correct) finish(true);
  }, [puzzle, finish]);

  // Regular tap: unknown → filled → unknown (toggle fill)
  const handleTap = useCallback((r: number, c: number) => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGrid(prev => {
      const next = prev.map(row => [...row]) as CellState[][];
      const curr = next[r][c];
      next[r][c] = curr === 'unknown' ? 'filled' : 'unknown';
      checkSolved(next);
      return next;
    });
  }, [checkSolved, hapticsEnabled]);

  // Long press: mark as empty (X) — "definitely not filled"
  const handleLongPress = useCallback((r: number, c: number) => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGrid(prev => {
      const next = prev.map(row => [...row]) as CellState[][];
      next[r][c] = next[r][c] === 'empty' ? 'unknown' : 'empty';
      return next;
    });
  }, [hapticsEnabled]);

  // Precompute satisfied rows and columns
  const satisfiedRows = useMemo(
    () => grid.map((row, ri) => isClueSatisfied(row, puzzle.rowClues[ri])),
    [grid, puzzle.rowClues],
  );

  const satisfiedCols = useMemo(() => {
    return puzzle.colClues.map((clue, ci) => {
      const col = grid.map(row => row[ci]);
      return isClueSatisfied(col, clue);
    });
  }, [grid, puzzle.colClues]);

  const maxClueLen = Math.max(...puzzle.rowClues.map(c => c.length));
  const CLUE_W = maxClueLen * 16 + 8;

  return (
    <View style={s.container}>
      <Text style={s.title}>Nonogram: {puzzle.name}</Text>
      <Text style={s.subtitle}>Tap to fill · Long-press to mark ×</Text>

      <View>
        {/* Column clues */}
        <View style={{ flexDirection: 'row', paddingLeft: CLUE_W }}>
          {puzzle.colClues.map((clue, ci) => (
            <View key={ci} style={{ width: CELL, alignItems: 'center', paddingBottom: 4 }}>
              {clue.map((n, ni) => (
                <Text
                  key={ni}
                  style={[
                    s.clueText,
                    satisfiedCols[ci] && s.clueTextDone,
                  ]}
                >
                  {n}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {/* Grid rows with row clues */}
        {grid.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Row clue */}
            <View style={{ width: CLUE_W, flexDirection: 'row', justifyContent: 'flex-end', paddingRight: 4, gap: 2 }}>
              {puzzle.rowClues[ri].map((n, ni) => (
                <Text
                  key={ni}
                  style={[
                    s.clueText,
                    satisfiedRows[ri] && s.clueTextDone,
                  ]}
                >
                  {n}
                </Text>
              ))}
            </View>
            {/* Cells */}
            {row.map((cell, ci) => (
              <TouchableOpacity
                key={ci}
                style={[
                  s.cell,
                  cell === 'filled' && s.cellFilled,
                  cell === 'empty' && s.cellEmpty,
                ]}
                onPress={() => handleTap(ri, ci)}
                onLongPress={() => handleLongPress(ri, ci)}
                delayLongPress={350}
                activeOpacity={0.7}
              >
                {cell === 'empty' && <Text style={s.xMark}>×</Text>}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🖼️' : '❌'}</Text>
            <Text style={s.modalTitle}>{won ? `${puzzle.name} Revealed!` : 'Not quite'}</Text>
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
              const next = (puzzleIdx + 1) % NONOGRAM_PUZZLES.length;
              setPuzzleIdx(next);
              setGrid(Array.from({ length: N }, () => Array(N).fill('unknown')));
              elapsedRef.current = 0;
              if (timerRef.current) clearInterval(timerRef.current);
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
  title: { fontFamily: fonts.black, fontSize: 20, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.inkMuted, marginBottom: 20, textAlign: 'center' },
  clueText: { fontFamily: fonts.bold, fontSize: 12, color: colors.inkSoft },
  clueTextDone: {
    textDecorationLine: 'line-through',
    color: colors.inkMuted,
    opacity: 0.55,
  },
  cell: {
    width: CELL, height: CELL,
    borderWidth: 1, borderColor: colors.divider,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  cellFilled: { backgroundColor: colors.ink },
  cellEmpty: { backgroundColor: colors.rule },
  xMark: { fontFamily: fonts.bold, fontSize: 18, color: colors.inkMuted },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 24, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
