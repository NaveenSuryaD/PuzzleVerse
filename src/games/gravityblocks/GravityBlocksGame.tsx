import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

// Gravity Blocks: tap columns to drop colored blocks; match 4 in a row/col/diagonal (Connect 4 style)
const COLS = 7;
const ROWS = 6;
const WIN_LEN = 4;

type Cell = 0 | 1 | 2; // 0=empty, 1=player, 2=AI
type Board = Cell[][];

function initBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0) as Cell[]);
}

function dropPiece(board: Board, col: number, player: Cell): Board | null {
  for (let r = ROWS-1; r >= 0; r--) {
    if (board[r][col] === 0) {
      const next = board.map(row => [...row] as Cell[]);
      next[r][col] = player;
      return next;
    }
  }
  return null; // column full
}

function checkWin(board: Board, player: Cell): boolean {
  // Horizontal
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c <= COLS-WIN_LEN; c++)
      if (Array.from({length:WIN_LEN}).every((_,i) => board[r][c+i]===player)) return true;
  // Vertical
  for (let r = 0; r <= ROWS-WIN_LEN; r++)
    for (let c = 0; c < COLS; c++)
      if (Array.from({length:WIN_LEN}).every((_,i) => board[r+i][c]===player)) return true;
  // Diagonal ↘
  for (let r = 0; r <= ROWS-WIN_LEN; r++)
    for (let c = 0; c <= COLS-WIN_LEN; c++)
      if (Array.from({length:WIN_LEN}).every((_,i) => board[r+i][c+i]===player)) return true;
  // Diagonal ↙
  for (let r = 0; r <= ROWS-WIN_LEN; r++)
    for (let c = WIN_LEN-1; c < COLS; c++)
      if (Array.from({length:WIN_LEN}).every((_,i) => board[r+i][c-i]===player)) return true;
  return false;
}

function getAIColumn(board: Board): number {
  // Try to win
  for (let c = 0; c < COLS; c++) {
    const next = dropPiece(board, c, 2);
    if (next && checkWin(next, 2)) return c;
  }
  // Block player
  for (let c = 0; c < COLS; c++) {
    const next = dropPiece(board, c, 1);
    if (next && checkWin(next, 1)) return c;
  }
  // Center preference
  const order = [3,2,4,1,5,0,6];
  for (const c of order) {
    if (dropPiece(board, c, 2)) return c;
  }
  return 0;
}

export function GravityBlocksGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const [board, setBoard] = useState<Board>(initBoard);
  const [turn, setTurn] = useState<'player'|'ai'>('player');
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

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

  const doAITurn = useCallback((b: Board) => {
    setAiThinking(true);
    setTimeout(() => {
      const col = getAIColumn(b);
      const newBoard = dropPiece(b, col, 2);
      if (!newBoard) { finish(true); setAiThinking(false); return; }
      setBoard(newBoard);
      if (checkWin(newBoard, 2)) { finish(false); setAiThinking(false); return; }
      // Check draw
      if (newBoard[0].every(c => c !== 0)) { finish(true); setAiThinking(false); return; }
      setTurn('player');
      setAiThinking(false);
    }, 600);
  }, [finish]);

  const handleColumnPress = useCallback((col: number) => {
    if (turn !== 'player' || aiThinking) return;
    const newBoard = dropPiece(board, col, 1);
    if (!newBoard) return;
    setBoard(newBoard);
    if (checkWin(newBoard, 1)) { finish(true); return; }
    if (newBoard[0].every(c => c !== 0)) { finish(false); return; }
    setTurn('ai');
    doAITurn(newBoard);
  }, [board, turn, aiThinking, doAITurn, finish]);

  const CELL_SIZE = 44;

  return (
    <View style={s.container}>
      <Text style={s.title}>Gravity Blocks</Text>
      <Text style={s.subtitle}>Drop blocks · Connect 4 to win</Text>
      <Text style={s.turnText}>{aiThinking ? 'AI thinking...' : turn==='player' ? 'Your turn (Red)' : 'AI turn (Yellow)'}</Text>

      {/* Column tap buttons */}
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        {Array.from({length:COLS}, (_, ci) => (
          <TouchableOpacity
            key={ci}
            style={{ width: CELL_SIZE, height: 28, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => handleColumnPress(ci)}
            activeOpacity={0.7}
          >
            <Text style={{ color: colors.inkMuted, fontSize: 14 }}>▼</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[s.board, { borderWidth: 2, borderColor: colors.ink }]}>
        {board.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((cell, ci) => (
              <TouchableOpacity
                key={ci}
                style={[s.cell, { width: CELL_SIZE, height: CELL_SIZE }]}
                onPress={() => handleColumnPress(ci)}
                activeOpacity={0.8}
              >
                {cell !== 0 && (
                  <View style={[
                    s.piece,
                    { width: CELL_SIZE-8, height: CELL_SIZE-8 },
                    cell === 1 ? s.piecePlayer : s.pieceAI,
                  ]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🔴' : '🟡'}</Text>
            <Text style={s.modalTitle}>{won ? 'You Win!' : 'AI Wins'}</Text>
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
              setBoard(initBoard()); setTurn('player'); setAiThinking(false);
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
  subtitle: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 4 },
  turnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted, marginBottom: 8 },
  board: { backgroundColor: '#1565C0', marginBottom: 16 },
  cell: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  piece: { borderRadius: 999 },
  piecePlayer: { backgroundColor: '#C0432F' },
  pieceAI: { backgroundColor: '#F1C40F' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
