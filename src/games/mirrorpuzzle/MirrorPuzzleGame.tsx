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

// Mirror Puzzle: tap cells to toggle; left half auto-mirrors to right half
// Goal: make the grid match the target pattern
const PUZZLES = [
  {
    size: 4,
    target: [
      [1,0,0,1],
      [0,1,1,0],
      [0,1,1,0],
      [1,0,0,1],
    ],
  },
  {
    size: 4,
    target: [
      [1,1,1,1],
      [1,0,0,1],
      [1,0,0,1],
      [1,1,1,1],
    ],
  },
  {
    size: 4,
    target: [
      [0,1,1,0],
      [1,0,0,1],
      [1,0,0,1],
      [0,1,1,0],
    ],
  },
];

const CELL_SIZE = 60;

interface SavedState {
  puzIdx: number;
  left: number[][];
}

export function MirrorPuzzleGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SavedState>('mirror-puzzle');

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SavedState | null>(null);

  const [puzIdx, setPuzIdx] = useState<number>(0);
  const puz = PUZZLES[puzIdx];
  const SIZE = puz.size;
  const HALF = Math.floor(SIZE / 2);

  // User controls only left half; right half mirrors it
  const [left, setLeft] = useState<number[][]>(() =>
    Array.from({ length: SIZE }, () => Array(HALF).fill(0))
  );

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
      save({ puzIdx, left }, timer.elapsedSeconds);
    }
  }, [puzIdx, left, done, save, timer.elapsedSeconds]);

  const handleResume = useCallback(() => {
    setShowResumeModal(false);
    if (pendingSavedState) {
      setPuzIdx(pendingSavedState.puzIdx);
      setLeft(pendingSavedState.left);
    }
    timer.restoreAndResume(resumeElapsed);
    setPendingSavedState(null);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    setShowResumeModal(false);
    setPendingSavedState(null);
    clear();
    setPuzIdx(0);
    setLeft(Array.from({ length: SIZE }, () => Array(HALF).fill(0)));
    timer.start();
  }, [clear, SIZE, HALF, timer]);

  // Reset when puzzle changes
  useEffect(() => {
    setLeft(Array.from({ length: SIZE }, () => Array(HALF).fill(0)));
  }, [puzIdx, SIZE, HALF]);

  const finish = useCallback((w: boolean) => {
    clear();
    setDone(true);
    setWon(w);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, timer.elapsedSeconds, clear]);

  // Build full grid with mirror
  const fullGrid = useMemo(() => {
    return Array.from({ length: SIZE }, (_, r) =>
      Array.from({ length: SIZE }, (_, c) => {
        if (c < HALF) return left[r][c];
        else return left[r][SIZE - 1 - c]; // mirror
      })
    );
  }, [left, SIZE, HALF]);

  const checkSolution = useCallback((grid: number[][]) => {
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        if (grid[r][c] !== puz.target[r][c]) return false;
    return true;
  }, [SIZE, puz]);

  const handleTap = useCallback((r: number, c: number) => {
    if (c >= HALF) return; // only toggle left half
    const newLeft = left.map(row => [...row]);
    newLeft[r][c] = newLeft[r][c] === 0 ? 1 : 0;
    setLeft(newLeft);

    // Build full grid to check
    const grid = Array.from({ length: SIZE }, (_, gr) =>
      Array.from({ length: SIZE }, (_, gc) =>
        gc < HALF ? newLeft[gr][gc] : newLeft[gr][SIZE - 1 - gc]
      )
    );
    if (checkSolution(grid)) finish(true);
  }, [left, HALF, SIZE, checkSolution, finish]);

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="🪞"
        gameName="Mirror Puzzle"
        elapsedSeconds={resumeElapsed}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.title}>Mirror Puzzle</Text>
      <Text style={s.subtitle}>Tap left side · Right side mirrors · Match the target</Text>

      <View style={s.side}>
        <Text style={s.sideLabel}>Target</Text>
        <View style={s.grid}>
          {puz.target.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row' }}>
              {row.map((val, ci) => (
                <View
                  key={ci}
                  style={[s.cell, val === 1 && s.cellFilled, ci === HALF - 1 && s.cellMirrorBorder]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      <View style={s.side}>
        <Text style={s.sideLabel}>Your Grid (tap left half)</Text>
        <View style={s.grid}>
          {fullGrid.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row' }}>
              {row.map((val, ci) => (
                <TouchableOpacity
                  key={ci}
                  style={[
                    s.cell,
                    val === 1 && s.cellFilled,
                    ci === HALF - 1 && s.cellMirrorBorder,
                    ci >= HALF && s.cellMirrored,
                  ]}
                  onPress={() => handleTap(ri, ci)}
                  activeOpacity={0.7}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={s.resetBtn} onPress={() => {
        setLeft(Array.from({ length: SIZE }, () => Array(HALF).fill(0)));
      }} activeOpacity={0.8}>
        <Text style={s.resetBtnText}>Reset</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🪞' : '❌'}</Text>
            <Text style={s.modalTitle}>{won ? 'Reflected!' : 'Try Again'}</Text>
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
              const next = (puzIdx + 1) % PUZZLES.length;
              setPuzIdx(next);
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginBottom: 16, textAlign: 'center' },
  side: { alignItems: 'center', marginBottom: 16 },
  sideLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.inkMuted, marginBottom: 6 },
  grid: { borderWidth: 2, borderColor: colors.ink },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface },
  cellFilled: { backgroundColor: colors.visual.ink },
  cellMirrorBorder: { borderRightWidth: 2, borderRightColor: colors.danger },
  cellMirrored: { opacity: 0.85 },
  resetBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999 },
  resetBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
