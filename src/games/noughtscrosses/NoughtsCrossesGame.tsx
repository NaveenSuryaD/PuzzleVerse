import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';
import { useGameTimer } from '../../hooks/useGameTimer';
import { usePersistentGameState } from '../../hooks/usePersistentGameState';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  paused?: boolean;
}

const SIZE = 10;
const WIN_LEN = 5;
const { width: SCREEN_W } = Dimensions.get('window');
const CELL = Math.min(Math.floor((SCREEN_W - 32) / SIZE), 34);

type Cell = 'X' | 'O' | null;

function checkWinner(board: Cell[][]): 'X' | 'O' | null {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const val = board[r][c];
      if (!val) continue;
      for (const [dr, dc] of dirs) {
        let count = 1;
        for (let k = 1; k < WIN_LEN; k++) {
          const nr = r + dr * k, nc = c + dc * k;
          if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === val) count++;
          else break;
        }
        if (count >= WIN_LEN) return val;
      }
    }
  }
  return null;
}

function aiMove(board: Cell[][]): [number, number] {
  // Check for winning move
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c]) continue;
      const test = board.map(row => [...row]);
      test[r][c] = 'O';
      if (checkWinner(test) === 'O') return [r, c];
    }
  }
  // Block player
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c]) continue;
      const test = board.map(row => [...row]);
      test[r][c] = 'X';
      if (checkWinner(test) === 'X') return [r, c];
    }
  }
  // Random near existing pieces
  const moves: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (!board[r][c]) moves.push([r, c]);
  return moves[Math.floor(Math.random() * moves.length)] ?? [0, 0];
}

export function NoughtsCrossesGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<{ board: Cell[][]; turn: 'X' | 'O' }>('noughts-crosses');

  const [board, setBoard] = useState<Cell[][]>(() =>
    Array.from({ length: SIZE }, () => Array(SIZE).fill(null))
  );
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<'X' | 'O' | null>(null);
  const [done, setDone] = useState(false);

  const s = useMemo(() => makeStyles(colors), [colors]);

  // Mount: quick game — skip resume modal, just start timer
  useEffect(() => {
    timer.start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = useCallback((w: boolean) => {
    clear();
    timer.pause();
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, clear, timer]);

  const handleTap = useCallback((r: number, c: number) => {
    if (board[r][c] || turn !== 'X' || winner) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = 'X';
    const w = checkWinner(newBoard);
    if (w) { setBoard(newBoard); setWinner(w); finish(w === 'X'); return; }
    setBoard(newBoard);
    setTurn('O');

    // AI move
    setTimeout(() => {
      const [ar, ac] = aiMove(newBoard);
      const aiBoard = newBoard.map(row => [...row]);
      aiBoard[ar][ac] = 'O';
      const aw = checkWinner(aiBoard);
      setBoard(aiBoard);
      if (aw) { setWinner(aw); finish(false); }
      else setTurn('X');
    }, 300);
  }, [board, turn, winner, finish]);

  return (
    <View style={s.container}>
      <Text style={s.title}>Connect Five</Text>
      <Text style={s.subtitle}>
        {winner ? (winner === 'X' ? 'You win! 🎉' : 'AI wins! 🤖') : turn === 'X' ? 'Your turn (X)' : 'AI thinking...'}
      </Text>

      <View style={s.board}>
        {board.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((cell, ci) => (
              <TouchableOpacity
                key={ci}
                style={[s.cell, { width: CELL, height: CELL }]}
                onPress={() => handleTap(ri, ci)}
                activeOpacity={0.7}
              >
                <Text style={[s.cellText, cell === 'O' && { color: colors.danger }]}>
                  {cell ?? ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{winner === 'X' ? '🏆' : '🤖'}</Text>
            <Text style={s.modalTitle}>{winner === 'X' ? 'You Win!' : 'AI Wins'}</Text>
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
              setBoard(Array.from({ length: SIZE }, () => Array(SIZE).fill(null)));
              setTurn('X'); setWinner(null);
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.inkMuted, marginBottom: 16 },
  board: { borderWidth: 1, borderColor: colors.divider },
  cell: { borderWidth: 0.5, borderColor: colors.rule, alignItems: 'center', justifyContent: 'center' },
  cellText: { fontFamily: fonts.black, fontSize: 14, color: colors.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
