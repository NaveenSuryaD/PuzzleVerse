import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';
import { useGameTimer } from '../../hooks/useGameTimer';
import { usePersistentGameState } from '../../hooks/usePersistentGameState';
import { ResumeGameModal } from '../../components/ResumeGameModal';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  paused?: boolean;
}

// Tapa: shade cells to form one connected group
// Clue cells show how many consecutive shaded neighbors exist in each group
const PUZZLES = [
  {
    size: 5,
    // clues[r][c] = array of group lengths, [] = free cell, null = clue cell
    clues: [
      [null, [], [], null, []],
      [[], null, [], [], null],
      [null, [], null, [], []],
      [[], [], null, null, []],
      [null, [], [], null, null],
    ] as unknown as (null | number[])[],
    clueValues: {
      '0,0': [3], '0,3': [2],
      '1,1': [1,2], '1,4': [1],
      '2,0': [2], '2,2': [4],
      '3,2': [1], '3,3': [2],
      '4,0': [3], '4,3': [1], '4,4': [1],
    } as Record<string, number[]>,
    // Solution: set of "r,c" shaded
    solution: new Set([
      '0,1','0,2','0,4',
      '1,0','1,2','1,3',
      '2,1','2,3','2,4',
      '3,0','3,1','3,4',
      '4,1','4,2',
    ]),
  },
];

const CELL_SIZE = 58;

interface SavedState {
  shaded: string[];
}

export function TapaGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SavedState>('tapa');

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SavedState | null>(null);

  const puz = PUZZLES[0];
  const SIZE = puz.size;

  const [shaded, setShaded] = useState<Set<string>>(() => new Set([]));
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  const s = useMemo(() => makeStyles(colors), [colors]);

  // Mount effect: load saved state
  useEffect(() => {
    load().then(result => {
      if (result.found && result.gameState) {
        setResumeElapsed(result.elapsedSeconds);
        setPendingSavedState(result.gameState);
        setShowResumeModal(true);
        timer.pause();
      } else {
        timer.start();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save effect
  useEffect(() => {
    if (!done) {
      save({ shaded: [...shaded] }, timer.elapsedSeconds);
    }
  }, [shaded, done, save, timer.elapsedSeconds]);

  const handleResume = useCallback(() => {
    setShowResumeModal(false);
    if (pendingSavedState) {
      setShaded(new Set(pendingSavedState.shaded));
    }
    timer.restoreAndResume(resumeElapsed);
    setPendingSavedState(null);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    setShowResumeModal(false);
    setPendingSavedState(null);
    clear();
    setShaded(new Set());
    timer.start();
  }, [clear, timer]);

  const finish = useCallback((w: boolean) => {
    clear();
    setWon(w);
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, timer.elapsedSeconds, clear]);

  const isClueCell = (r: number, c: number) => puz.clueValues[`${r},${c}`] !== undefined;

  const handleTap = useCallback((r: number, c: number) => {
    if (isClueCell(r, c)) return;
    const key = `${r},${c}`;
    const newShaded = new Set(shaded);
    if (newShaded.has(key)) newShaded.delete(key);
    else newShaded.add(key);
    setShaded(newShaded);

    // Simple win check: match solution
    if (newShaded.size === puz.solution.size) {
      let match = true;
      for (const k of newShaded) if (!puz.solution.has(k)) { match = false; break; }
      if (match) finish(true);
    }
  }, [shaded, puz, finish]);

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="⬛"
        gameName="Tapa"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `${pendingSavedState.shaded.length} / ${puz.solution.size} cells shaded` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.title}>Tapa</Text>
      <Text style={s.subtitle}>Shade cells to form one connected wall · Follow clues</Text>

      <View style={s.grid}>
        {Array.from({ length: SIZE }, (_, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {Array.from({ length: SIZE }, (_, ci) => {
              const clue = puz.clueValues[`${ri},${ci}`];
              const isShaded = shaded.has(`${ri},${ci}`);

              return clue ? (
                <View key={ci} style={[s.cell, s.clueCell]}>
                  <Text style={s.clueText}>{clue.join(',')}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  key={ci}
                  style={[s.cell, isShaded && s.cellShaded]}
                  onPress={() => handleTap(ri, ci)}
                  activeOpacity={0.7}
                />
              );
            })}
          </View>
        ))}
      </View>

      <Text style={s.progress}>Shaded: {shaded.size} / {puz.solution.size}</Text>

      <TouchableOpacity style={s.resetBtn} onPress={() => setShaded(new Set())} activeOpacity={0.8}>
        <Text style={s.resetBtnText}>Reset</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '⬛' : '❌'}</Text>
            <Text style={s.modalTitle}>{won ? 'Wall Built!' : 'Not Quite'}</Text>
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
              setShaded(new Set());
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
  grid: { borderWidth: 2, borderColor: colors.ink, marginBottom: 16 },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface },
  clueCell: { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  clueText: { fontFamily: fonts.black, fontSize: 13, color: colors.ink },
  cellShaded: { backgroundColor: colors.ink },
  progress: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted, marginBottom: 12 },
  resetBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999 },
  resetBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
