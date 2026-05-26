import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { CHESS_PUZZLES } from './puzzles';
import * as Haptics from 'expo-haptics';
import { useGameTimer } from '../../hooks/useGameTimer';
import { usePersistentGameState } from '../../hooks/usePersistentGameState';
import { ResumeGameModal } from '../../components/ResumeGameModal';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  paused?: boolean;
}

const { width: SCREEN_W } = Dimensions.get('window');
const CELL = Math.min(Math.floor((SCREEN_W - 32) / 8), 44);

const PIECE_SYMBOLS: Record<string, string> = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
};

interface SaveState {
  puzzleIdx: number;
}

export function ChessPuzzlesGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('chess-puzzles');

  const [puzzleIdx, setPuzzleIdx] = useState<number>(0);
  const puzzle = CHESS_PUZZLES[puzzleIdx];
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState('');

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
      save({ puzzleIdx }, timer.elapsedSeconds);
    }
  }, [puzzleIdx, timer.elapsedSeconds, done, showResumeModal, save]);

  const handleResume = useCallback(() => {
    if (pendingSavedState) {
      setPuzzleIdx(pendingSavedState.puzzleIdx);
    }
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    clear();
    setPuzzleIdx(0);
    setSelected(null);
    setMessage('');
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

  const handleTap = useCallback((r: number, c: number) => {
    if (!selected) {
      const piece = puzzle.board[r][c];
      if (piece && piece === piece.toUpperCase()) {
        setSelected([r, c]);
      }
      return;
    }
    const [sr, sc] = selected;
    const { from, to } = puzzle.solution;
    if (sr === from[0] && sc === from[1] && r === to[0] && c === to[1]) {
      setMessage('Checkmate! Brilliant move!');
      setSelected(null);
      setTimeout(() => finish(true), 800);
    } else {
      setMessage('Not the right move. Try again!');
      setSelected(null);
    }
  }, [selected, puzzle, finish]);

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="♟️"
        gameName="Chess Puzzles"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `Puzzle ${pendingSavedState.puzzleIdx + 1}` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.title}>{puzzle.name}</Text>
      <Text style={s.subtitle}>White to move · Find the checkmate in 1</Text>
      {message ? <Text style={s.message}>{message}</Text> : null}

      <View style={s.board}>
        {puzzle.board.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((piece, ci) => {
              const isLight = (ri + ci) % 2 === 0;
              const isSel = selected?.[0] === ri && selected?.[1] === ci;
              return (
                <TouchableOpacity
                  key={ci}
                  style={[
                    s.cell,
                    { width: CELL, height: CELL },
                    { backgroundColor: isSel ? '#F6F669' : isLight ? '#F0D9B5' : '#B58863' },
                  ]}
                  onPress={() => handleTap(ri, ci)}
                  activeOpacity={0.8}
                >
                  {piece && (
                    <Text style={[s.piece, { color: piece === piece.toUpperCase() ? '#FFFFFF' : '#000000' }]}>
                      {PIECE_SYMBOLS[piece] ?? piece}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <TouchableOpacity style={s.hintBtn} onPress={() => setMessage(puzzle.hint)} activeOpacity={0.8}>
        <Text style={s.hintBtnText}>Hint</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '♔' : '♟'}</Text>
            <Text style={s.modalTitle}>{won ? 'Checkmate!' : 'Keep Trying'}</Text>
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
              const next = (puzzleIdx + 1) % CHESS_PUZZLES.length;
              setPuzzleIdx(next); setSelected(null); setMessage('');
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontFamily: fonts.black, fontSize: 20, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 8 },
  message: { fontFamily: fonts.bold, fontSize: 14, color: colors.word.ink, marginBottom: 8 },
  board: { borderWidth: 2, borderColor: colors.ink, marginBottom: 16 },
  cell: { alignItems: 'center', justifyContent: 'center' },
  piece: { fontSize: CELL * 0.65, lineHeight: CELL, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  hintBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999 },
  hintBtnText: { fontFamily: fonts.bold, fontSize: 13, color: colors.inkSoft },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
