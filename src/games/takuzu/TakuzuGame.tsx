import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { TAKUZU_PUZZLES } from './puzzles';
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
  grid: (0 | 1 | null)[][];
}

const CELL = 50;

export function TakuzuGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('takuzu');

  const puzzle = TAKUZU_PUZZLES[0];
  const N = puzzle.given.length;

  const [grid, setGrid] = useState<(0 | 1 | null)[][]>(() =>
    puzzle.given.map(row => [...row])
  );
  const [conflicts, setConflicts] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);

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
      save({ grid }, timer.elapsedSeconds);
    }
  }, [grid]);

  const handleResume = useCallback(() => {
    if (!pendingSavedState) return;
    setGrid(pendingSavedState.grid);
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    clear();
    setGrid(puzzle.given.map(row => [...row]));
    setConflicts(new Set());
    setShowResumeModal(false);
    timer.start();
  }, [clear, puzzle, timer]);

  const finish = useCallback((w: boolean) => {
    clear();
    timer.pause();
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, clear, timer]);

  const computeTakuzuConflicts = useCallback((g: (0 | 1 | null)[][]): Set<string> => {
    const bad = new Set<string>();
    // Three consecutive same in rows
    for (let r = 0; r < N; r++) {
      for (let c = 0; c <= N - 3; c++) {
        const a = g[r][c], b = g[r][c+1], cc = g[r][c+2];
        if (a !== null && a === b && b === cc) {
          bad.add(`${r},${c}`); bad.add(`${r},${c+1}`); bad.add(`${r},${c+2}`);
        }
      }
    }
    // Three consecutive same in cols
    for (let c = 0; c < N; c++) {
      for (let r = 0; r <= N - 3; r++) {
        const a = g[r][c], b = g[r+1][c], cc = g[r+2][c];
        if (a !== null && a === b && b === cc) {
          bad.add(`${r},${c}`); bad.add(`${r+1},${c}`); bad.add(`${r+2},${c}`);
        }
      }
    }
    // Unequal 0/1 count in complete rows
    for (let r = 0; r < N; r++) {
      const row = g[r];
      if (row.some(v => v === null)) continue;
      const zeros = row.filter(v => v === 0).length;
      if (zeros !== N / 2) row.forEach((_, c) => bad.add(`${r},${c}`));
    }
    // Unequal 0/1 count in complete cols
    for (let c = 0; c < N; c++) {
      const col = g.map(row => row[c]);
      if (col.some(v => v === null)) continue;
      const zeros = col.filter(v => v === 0).length;
      if (zeros !== N / 2) col.forEach((_, r) => bad.add(`${r},${c}`));
    }
    return bad;
  }, [N]);

  const checkSolved = useCallback((g: (0 | 1 | null)[][]) => {
    if (g.some(row => row.some(v => v === null))) return;
    const bad = computeTakuzuConflicts(g);
    if (bad.size > 0) return;
    // Check no duplicate rows or cols
    const rowStrs = g.map(row => row.join(''));
    const colStrs = Array.from({ length: N }, (_, c) => g.map(r => r[c]).join(''));
    if (new Set(rowStrs).size === N && new Set(colStrs).size === N) finish(true);
  }, [computeTakuzuConflicts, finish, N]);

  const handleTap = useCallback((r: number, c: number) => {
    if (puzzle.given[r][c] !== null) return;
    setGrid(prev => {
      const next = prev.map(row => [...row] as (0 | 1 | null)[]);
      const curr = next[r][c];
      next[r][c] = curr === null ? 0 : curr === 0 ? 1 : null;
      setConflicts(computeTakuzuConflicts(next));
      checkSolved(next);
      return next;
    });
  }, [puzzle, checkSolved, computeTakuzuConflicts]);

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="☯️"
        gameName="Takuzu"
        elapsedSeconds={resumeElapsed}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.title}>Takuzu / Binairo</Text>
      <Text style={s.subtitle}>Fill with 0s and 1s · No 3 consecutive · Equal count per row/col</Text>

      <View style={s.grid}>
        {grid.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((val, ci) => {
              const isGiven = puzzle.given[ri][ci] !== null;
              const hasConflict = !isGiven && conflicts.has(`${ri},${ci}`);
              return (
                <TouchableOpacity
                  key={ci}
                  style={[
                    s.cell,
                    val === 0 && { backgroundColor: colors.classic.bg },
                    val === 1 && { backgroundColor: colors.word.bg },
                    isGiven && s.cellGiven,
                    hasConflict && { backgroundColor: '#FFE0E0' },
                  ]}
                  onPress={() => handleTap(ri, ci)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.cellVal, val === 1 && { color: colors.word.ink }, val === 0 && { color: colors.classic.ink }]}>
                    {val !== null ? String(val) : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>⚡</Text>
            <Text style={s.modalTitle}>Binary Complete!</Text>
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
              setGrid(puzzle.given.map(row => [...row]));
              setConflicts(new Set());
              timer.start();
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginBottom: 20, textAlign: 'center' },
  grid: { borderWidth: 2, borderColor: colors.ink },
  cell: { width: CELL, height: CELL, borderWidth: 0.5, borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  cellGiven: { backgroundColor: colors.surface2 },
  cellVal: { fontFamily: fonts.black, fontSize: 24, color: colors.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
