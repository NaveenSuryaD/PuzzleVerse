import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { MAGIC_SQUARE_PUZZLES } from './puzzles';
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
  puzzleIdx: number;
  grid: (number | null)[][];
}

export function MagicSquareGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('magic-square');

  const [puzzleIdx, setPuzzleIdx] = useState<number>(() => Math.floor(Math.random() * MAGIC_SQUARE_PUZZLES.length));
  const puzzle = MAGIC_SQUARE_PUZZLES[puzzleIdx];
  const [grid, setGrid] = useState<(number | null)[][]>(() => puzzle.given.map(r => [...r]));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SaveState | null>(null);

  const s = useMemo(() => makeStyles(colors), [colors]);

  // Mount: load saved state
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

  // Save on meaningful changes
  useEffect(() => {
    if (!done && timer.isRunning) {
      save({ puzzleIdx, grid }, timer.elapsedSeconds);
    }
  }, [grid]);

  const handleResume = useCallback(() => {
    if (!pendingSavedState) return;
    setPuzzleIdx(pendingSavedState.puzzleIdx);
    setGrid(pendingSavedState.grid);
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    clear();
    setGrid(puzzle.given.map(r => [...r]));
    setShowResumeModal(false);
    timer.start();
  }, [clear, puzzle, timer]);

  const finish = useCallback((w: boolean) => {
    clear();
    timer.pause();
    setWon(w);
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, clear, timer]);

  const checkSolved = useCallback((g: (number | null)[][]) => {
    if (g.some(row => row.some(v => v === null))) return;
    const nums = g as number[][];
    const magic = puzzle.magic;
    // Rows
    for (let r = 0; r < 3; r++) {
      if (nums[r].reduce((a, b) => a + b, 0) !== magic) return;
    }
    // Cols
    for (let c = 0; c < 3; c++) {
      if (nums.reduce((a, row) => a + row[c], 0) !== magic) return;
    }
    // Diagonals
    if (nums[0][0] + nums[1][1] + nums[2][2] !== magic) return;
    if (nums[0][2] + nums[1][1] + nums[2][0] !== magic) return;
    finish(true);
  }, [puzzle, finish]);

  const handleNumpad = useCallback((n: number) => {
    if (!selected) return;
    const [r, c] = selected;
    if (puzzle.given[r][c] !== null) return;
    setGrid(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = n;
      checkSolved(next);
      return next;
    });
  }, [selected, puzzle, checkSolved]);

  const handleClear = useCallback(() => {
    if (!selected) return;
    const [r, c] = selected;
    if (puzzle.given[r][c] !== null) return;
    setGrid(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = null;
      return next;
    });
  }, [selected, puzzle]);

  const CELL = 72;

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="✨"
        gameName="Magic Square"
        elapsedSeconds={resumeElapsed}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.title}>Magic Square</Text>
      <Text style={s.subtitle}>Every row, column & diagonal sums to {puzzle.magic}</Text>

      <View style={s.grid}>
        {grid.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((val, ci) => {
              const isGiven = puzzle.given[ri][ci] !== null;
              const isSel = selected?.[0] === ri && selected?.[1] === ci;
              return (
                <TouchableOpacity
                  key={ci}
                  style={[
                    s.cell, { width: CELL, height: CELL },
                    isGiven && s.cellGiven,
                    isSel && s.cellSelected,
                  ]}
                  onPress={() => !isGiven && setSelected([ri, ci])}
                  activeOpacity={isGiven ? 1 : 0.7}
                >
                  <Text style={[s.cellVal, isGiven && { color: colors.inkSoft }]}>
                    {val ?? ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={s.numpad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <TouchableOpacity key={n} style={s.numBtn} onPress={() => handleNumpad(n)} activeOpacity={0.7}>
            <Text style={s.numBtnText}>{n}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[s.numBtn, { backgroundColor: colors.danger + '20' }]} onPress={handleClear}>
          <Text style={[s.numBtnText, { color: colors.danger }]}>✕</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '✨' : '🔢'}</Text>
            <Text style={s.modalTitle}>{won ? 'Magic!' : 'Keep Trying'}</Text>
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
              const next = (puzzleIdx + 1) % MAGIC_SQUARE_PUZZLES.length;
              setPuzzleIdx(next);
              setGrid(MAGIC_SQUARE_PUZZLES[next].given.map(r => [...r]));
              setSelected(null);
              timer.start();
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 24, textAlign: 'center' },
  grid: { borderWidth: 2, borderColor: colors.ink, marginBottom: 24 },
  cell: { borderWidth: 1, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  cellGiven: { backgroundColor: colors.surface2 },
  cellSelected: { backgroundColor: colors.logic.bg, borderColor: colors.logic.ink },
  cellVal: { fontFamily: fonts.black, fontSize: 28, color: colors.ink },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', width: 240, gap: 8, justifyContent: 'center', marginBottom: 20 },
  numBtn: { width: 60, height: 52, backgroundColor: colors.surface, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.divider },
  numBtnText: { fontFamily: fonts.extraBold, fontSize: 20, color: colors.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
