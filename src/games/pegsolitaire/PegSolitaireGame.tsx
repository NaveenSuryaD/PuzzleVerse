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

// English cross board (7x7, some holes invalid)
const BOARD_MASK: boolean[][] = [
  [false,false,true,true,true,false,false],
  [false,false,true,true,true,false,false],
  [true,true,true,true,true,true,true],
  [true,true,true,false,true,true,true],
  [true,true,true,true,true,true,true],
  [false,false,true,true,true,false,false],
  [false,false,true,true,true,false,false],
];

function initialBoard(): (boolean | null)[][] {
  return BOARD_MASK.map((row, ri) =>
    row.map((valid, ci) => {
      if (!valid) return null;
      return !(ri === 3 && ci === 3); // center is empty
    })
  );
}

const CELL = 40;

interface SaveState {
  board: (boolean | null)[][];
}

export function PegSolitaireGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('peg-solitaire');

  const [board, setBoard] = useState<(boolean | null)[][]>(() => initialBoard());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SaveState | null>(null);

  const s = useMemo(() => makeStyles(colors), [colors]);

  // Mount effect: load saved state
  useEffect(() => {
    (async () => {
      const result = await load();
      if (result.found && result.gameState) {
        setPendingSavedState(result.gameState);
        setResumeElapsed(result.elapsedSeconds);
        setShowResumeModal(true);
      } else {
        timer.start();
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save effect
  useEffect(() => {
    if (!done && !showResumeModal) {
      save({ board }, timer.elapsedSeconds);
    }
  }, [board, timer.elapsedSeconds, done, showResumeModal, save]);

  const handleResume = useCallback(() => {
    if (pendingSavedState) {
      setBoard(pendingSavedState.board);
    }
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    clear();
    setBoard(initialBoard());
    setSelected(null);
    setMoves(0);
    setShowResumeModal(false);
    timer.start();
  }, [clear, timer]);

  const finish = useCallback((w: boolean) => {
    timer.pause();
    clear();
    setWon(w);
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, timer, clear]);

  const countPegs = (b: (boolean | null)[][]) => b.flat().filter(v => v === true).length;

  const handleTap = useCallback((r: number, c: number) => {
    const cell = board[r][c];
    if (cell === null) return; // invalid cell

    if (selected === null) {
      if (cell === true) setSelected([r, c]);
      return;
    }

    const [sr, sc] = selected;
    if (sr === r && sc === c) { setSelected(null); return; }

    // Check valid jump
    const dr = r - sr, dc = c - sc;
    const midR = sr + dr / 2, midC = sc + dc / 2;
    const validJump = (Math.abs(dr) === 2 && dc === 0) || (Math.abs(dc) === 2 && dr === 0);
    if (!validJump) { setSelected(cell === true ? [r, c] : null); return; }
    if (board[midR][midC] !== true) { setSelected(null); return; }
    if (cell !== false) { setSelected(null); return; }

    const newBoard = board.map(row => [...row]);
    newBoard[sr][sc] = false;
    newBoard[midR as number][midC as number] = false;
    newBoard[r][c] = true;
    setBoard(newBoard);
    setMoves(m => m + 1);
    setSelected(null);

    if (countPegs(newBoard) === 1) finish(true);
  }, [board, selected, finish]);

  const pegsLeft = countPegs(board);

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="⚫"
        gameName="Peg Solitaire"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `${pendingSavedState.board.flat().filter(v => v === true).length} pegs left` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.title}>Peg Solitaire</Text>
      <Text style={s.subtitle}>Jump pegs to remove · Goal: 1 peg remaining · {pegsLeft} pegs left</Text>

      <View style={s.board}>
        {board.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((cell, ci) => {
              if (cell === null) {
                return <View key={ci} style={{ width: CELL, height: CELL }} />;
              }
              const isSel = selected?.[0] === ri && selected?.[1] === ci;
              return (
                <TouchableOpacity
                  key={ci}
                  style={[s.hole, { width: CELL, height: CELL }]}
                  onPress={() => handleTap(ri, ci)}
                  activeOpacity={0.7}
                >
                  {cell && (
                    <View style={[s.peg, isSel && s.pegSelected]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <TouchableOpacity style={s.resetBtn} onPress={() => {
        setBoard(initialBoard()); setSelected(null); setMoves(0);
      }} activeOpacity={0.8}>
        <Text style={s.resetBtnText}>Reset</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🏆' : '😅'}</Text>
            <Text style={s.modalTitle}>{won ? 'Solved!' : `${pegsLeft} pegs left`}</Text>
            <Text style={s.modalSub}>Moves: {moves}</Text>
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
              setBoard(initialBoard()); setSelected(null); setMoves(0);
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
  board: { marginBottom: 20 },
  hole: { alignItems: 'center', justifyContent: 'center' },
  peg: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.classic.ink },
  pegSelected: { backgroundColor: colors.logic.ink, shadowColor: colors.logic.ink, shadowRadius: 6, shadowOpacity: 0.5, elevation: 4 },
  resetBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999 },
  resetBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
