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

type AIDifficulty = 'easy' | 'medium' | 'hard';
const COLS = 7, ROWS = 6, WIN_LEN = 4;
type Cell = 0 | 1 | 2;
type Board = Cell[][];

function initBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0) as Cell[]);
}

function dropPiece(board: Board, col: number, player: Cell): Board | null {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) {
      const next = board.map(row => [...row] as Cell[]);
      next[r][col] = player;
      return next;
    }
  }
  return null;
}

function checkWin(board: Board, player: Cell): boolean {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c <= COLS - WIN_LEN; c++)
      if (Array.from({ length: WIN_LEN }).every((_, i) => board[r][c + i] === player)) return true;
  for (let r = 0; r <= ROWS - WIN_LEN; r++)
    for (let c = 0; c < COLS; c++)
      if (Array.from({ length: WIN_LEN }).every((_, i) => board[r + i][c] === player)) return true;
  for (let r = 0; r <= ROWS - WIN_LEN; r++)
    for (let c = 0; c <= COLS - WIN_LEN; c++)
      if (Array.from({ length: WIN_LEN }).every((_, i) => board[r + i][c + i] === player)) return true;
  for (let r = 0; r <= ROWS - WIN_LEN; r++)
    for (let c = WIN_LEN - 1; c < COLS; c++)
      if (Array.from({ length: WIN_LEN }).every((_, i) => board[r + i][c - i] === player)) return true;
  return false;
}

function scoreWindow(window: Cell[], player: Cell): number {
  const opp = player === 2 ? 1 : 2;
  const mine = window.filter(c => c === player).length;
  const theirs = window.filter(c => c === opp).length;
  const empty = window.filter(c => c === 0).length;
  if (mine === 4) return 100;
  if (mine === 3 && empty === 1) return 5;
  if (mine === 2 && empty === 2) return 2;
  if (theirs === 3 && empty === 1) return -4;
  return 0;
}

function scoreBoard(board: Board, player: Cell): number {
  let score = 0;
  const centerCol = Math.floor(COLS / 2);
  for (let r = 0; r < ROWS; r++) score += board[r][centerCol] === player ? 3 : 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c <= COLS - WIN_LEN; c++)
      score += scoreWindow(board[r].slice(c, c + WIN_LEN), player);
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r <= ROWS - WIN_LEN; r++)
      score += scoreWindow(Array.from({ length: WIN_LEN }, (_, i) => board[r + i][c]), player);
  return score;
}

function minimax(board: Board, depth: number, isMax: boolean, alpha: number, beta: number): number {
  if (checkWin(board, 2)) return 1000 + depth;
  if (checkWin(board, 1)) return -(1000 + depth);
  if (depth === 0 || board[0].every(c => c !== 0)) return scoreBoard(board, 2);
  if (isMax) {
    let best = -Infinity;
    for (let c = 0; c < COLS; c++) {
      const next = dropPiece(board, c, 2);
      if (!next) continue;
      best = Math.max(best, minimax(next, depth - 1, false, alpha, beta));
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (let c = 0; c < COLS; c++) {
      const next = dropPiece(board, c, 1);
      if (!next) continue;
      best = Math.min(best, minimax(next, depth - 1, true, alpha, beta));
      beta = Math.min(beta, best);
      if (alpha >= beta) break;
    }
    return best;
  }
}

function getAIColumn(board: Board, difficulty: AIDifficulty): number {
  const available = Array.from({ length: COLS }, (_, i) => i).filter(c => board[0][c] === 0);
  if (available.length === 0) return 0;

  if (difficulty === 'easy') {
    // Immediate win only, else random
    for (const c of available) {
      const next = dropPiece(board, c, 2);
      if (next && checkWin(next, 2)) return c;
    }
    return available[Math.floor(Math.random() * available.length)];
  }

  if (difficulty === 'medium') {
    for (const c of available) {
      const next = dropPiece(board, c, 2);
      if (next && checkWin(next, 2)) return c;
    }
    for (const c of available) {
      const next = dropPiece(board, c, 1);
      if (next && checkWin(next, 1)) return c;
    }
    const order = [3, 2, 4, 1, 5, 0, 6];
    for (const c of order) if (available.includes(c)) return c;
    return available[0];
  }

  // Hard: minimax depth 5
  let bestCol = available[Math.floor(available.length / 2)];
  let bestScore = -Infinity;
  for (const c of available) {
    const next = dropPiece(board, c, 2);
    if (!next) continue;
    const score = minimax(next, 5, false, -Infinity, Infinity);
    if (score > bestScore) { bestScore = score; bestCol = c; }
  }
  return bestCol;
}

export function GravityBlocksGame({ onComplete, onBack, savedStateJSON }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => { try { return savedStateJSON ? JSON.parse(savedStateJSON) : null; } catch { return null; } }, []);
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [board, setBoard] = useState<Board>(() => saved?.board ?? initBoard());
  const [turn, setTurn] = useState<'player' | 'ai'>(() => saved?.turn ?? 'player');
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  useSaveGame('gravity-blocks', () => ({ board, turn }), !done, [board, turn], elapsedRef);

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

  const resetGame = useCallback((diff?: AIDifficulty) => {
    setDone(false);
    completedRef.current = false;
    setBoard(initBoard());
    setTurn('player');
    setAiThinking(false);
    elapsedRef.current = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
    if (diff) setDifficulty(diff);
  }, []);

  const doAITurn = useCallback((b: Board, diff: AIDifficulty) => {
    setAiThinking(true);
    const thinkTime = diff === 'hard' ? 50 : 300;
    setTimeout(() => {
      const col = getAIColumn(b, diff);
      const newBoard = dropPiece(b, col, 2);
      if (!newBoard) { finish(true); setAiThinking(false); return; }
      if (diff !== 'easy') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setBoard(newBoard);
      if (checkWin(newBoard, 2)) { finish(false); setAiThinking(false); return; }
      if (newBoard[0].every(c => c !== 0)) { finish(false); setAiThinking(false); return; }
      setTurn('player');
      setAiThinking(false);
    }, thinkTime);
  }, [finish]);

  const handleColumnPress = useCallback((col: number) => {
    if (turn !== 'player' || aiThinking) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newBoard = dropPiece(board, col, 1);
    if (!newBoard) return;
    setBoard(newBoard);
    if (checkWin(newBoard, 1)) { finish(true); return; }
    if (newBoard[0].every(c => c !== 0)) { finish(false); return; }
    setTurn('ai');
    doAITurn(newBoard, difficulty);
  }, [board, turn, aiThinking, difficulty, doAITurn, finish]);

  const CELL_SIZE = 44;

  return (
    <View style={s.container}>
      {/* Difficulty selector */}
      <View style={s.diffRow}>
        {(['easy', 'medium', 'hard'] as AIDifficulty[]).map(d => (
          <TouchableOpacity
            key={d}
            style={[s.diffPill, difficulty === d && { backgroundColor: colors.ink, borderColor: colors.ink }]}
            onPress={() => resetGame(d)}
            activeOpacity={0.8}
          >
            <Text style={[s.diffText, difficulty === d && { color: colors.bg }]}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.turnText}>
        {aiThinking ? 'AI thinking...' : turn === 'player' ? 'Your turn (Red)' : 'AI turn (Yellow)'}
      </Text>

      {/* Column tap arrows */}
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        {Array.from({ length: COLS }, (_, ci) => (
          <TouchableOpacity
            key={ci}
            style={{ width: CELL_SIZE, height: 28, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => handleColumnPress(ci)}
            activeOpacity={0.7}
          >
            <Text style={{ color: turn === 'player' && !aiThinking ? '#C0432F' : colors.inkMuted, fontSize: 14 }}>▼</Text>
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
                    { width: CELL_SIZE - 8, height: CELL_SIZE - 8 },
                    cell === 1 ? s.piecePlayer : s.pieceAI,
                  ]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <Text style={s.hint}>Tap column to drop · Connect 4 to win</Text>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🔴' : '🟡'}</Text>
            <Text style={s.modalTitle}>{won ? 'You Win!' : 'AI Wins'}</Text>
            <Text style={s.modalSub}>{won ? 'Great move!' : `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} AI wins this round`}</Text>
            {onBack && (
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 8 }]}
                onPress={onBack}
              >
                <Text style={[s.modalBtnText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.modalBtn} onPress={() => resetGame()}>
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
  diffRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  diffPill: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5, borderColor: colors.divider, backgroundColor: colors.surface },
  diffText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkSoft },
  turnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted, marginBottom: 8 },
  board: { backgroundColor: '#1565C0', marginBottom: 12 },
  cell: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  piece: { borderRadius: 999 },
  piecePlayer: { backgroundColor: '#C0432F' },
  pieceAI: { backgroundColor: '#F1C40F' },
  hint: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginTop: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300, gap: 4 },
  modalEmoji: { fontSize: 52, marginBottom: 8 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 4 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.inkMuted, marginBottom: 20 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999, width: '100%', alignItems: 'center' },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
