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

type Cell = 0 | 1 | 2; // 0=empty, 1=player(black), 2=AI(white)
const SIZE = 6;

const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

function initBoard(): Cell[][] {
  const b: Cell[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(0) as Cell[]);
  const m = SIZE / 2;
  b[m-1][m-1] = 2; b[m-1][m] = 1;
  b[m][m-1] = 1;   b[m][m] = 2;
  return b;
}

function getFlips(board: Cell[][], r: number, c: number, player: Cell): [number,number][] {
  if (board[r][c] !== 0) return [];
  const opp: Cell = player === 1 ? 2 : 1;
  const flips: [number,number][] = [];
  for (const [dr,dc] of DIRS) {
    const line: [number,number][] = [];
    let nr = r+dr, nc = c+dc;
    while (nr>=0 && nr<SIZE && nc>=0 && nc<SIZE && board[nr][nc]===opp) {
      line.push([nr,nc]);
      nr+=dr; nc+=dc;
    }
    if (line.length > 0 && nr>=0 && nr<SIZE && nc>=0 && nc<SIZE && board[nr][nc]===player) {
      flips.push(...line);
    }
  }
  return flips;
}

function getValidMoves(board: Cell[][], player: Cell): [number,number][] {
  const moves: [number,number][] = [];
  for (let r=0; r<SIZE; r++)
    for (let c=0; c<SIZE; c++)
      if (getFlips(board,r,c,player).length > 0) moves.push([r,c]);
  return moves;
}

function applyMove(board: Cell[][], r: number, c: number, player: Cell): Cell[][] {
  const flips = getFlips(board,r,c,player);
  const next = board.map(row => [...row] as Cell[]);
  next[r][c] = player;
  for (const [fr,fc] of flips) next[fr][fc] = player;
  return next;
}

function aiMove(board: Cell[][]): [number,number] | null {
  const moves = getValidMoves(board, 2);
  if (moves.length === 0) return null;
  // Pick move that flips most
  let best: [number,number] = moves[0];
  let bestFlips = 0;
  for (const [r,c] of moves) {
    const f = getFlips(board,r,c,2).length;
    if (f > bestFlips) { bestFlips = f; best = [r,c]; }
  }
  return best;
}

interface SaveState {
  board: Cell[][];
  turn: 1 | 2;
}

export function ReversiGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('reversi');

  const [board, setBoard] = useState<Cell[][]>(() => initBoard());
  const [turn, setTurn] = useState<1|2>(1);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

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
      save({ board, turn }, timer.elapsedSeconds);
    }
  }, [board, turn, timer.elapsedSeconds, done, showResumeModal, save]);

  const handleResume = useCallback(() => {
    if (pendingSavedState) {
      setBoard(pendingSavedState.board);
      setTurn(pendingSavedState.turn);
    }
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    clear();
    setBoard(initBoard());
    setTurn(1);
    setAiThinking(false);
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

  const checkEnd = useCallback((b: Cell[][], nextTurn: 1|2) => {
    const playerMoves = getValidMoves(b, 1);
    const aiMoves = getValidMoves(b, 2);
    if (playerMoves.length === 0 && aiMoves.length === 0) {
      let p1=0, p2=0;
      for (const row of b) for (const c of row) { if (c===1) p1++; else if (c===2) p2++; }
      finish(p1 > p2);
      return true;
    }
    if (nextTurn === 1 && playerMoves.length === 0) {
      setTurn(2); return false;
    }
    if (nextTurn === 2 && aiMoves.length === 0) {
      setTurn(1); return false;
    }
    return false;
  }, [finish]);

  const handlePress = useCallback((r: number, c: number) => {
    if (turn !== 1 || aiThinking) return;
    const flips = getFlips(board, r, c, 1);
    if (flips.length === 0) return;
    const newBoard = applyMove(board, r, c, 1);
    setBoard(newBoard);
    if (checkEnd(newBoard, 2)) return;
    setTurn(2);
    setAiThinking(true);
    setTimeout(() => {
      const move = aiMove(newBoard);
      if (move) {
        const afterAI = applyMove(newBoard, move[0], move[1], 2);
        setBoard(afterAI);
        if (!checkEnd(afterAI, 1)) setTurn(1);
      } else {
        setTurn(1);
      }
      setAiThinking(false);
    }, 500);
  }, [board, turn, aiThinking, checkEnd]);

  const counts = useMemo(() => {
    let p1=0, p2=0;
    for (const row of board) for (const c of row) { if (c===1) p1++; else if (c===2) p2++; }
    return { p1, p2 };
  }, [board]);

  const validMoves = turn === 1 ? getValidMoves(board, 1) : [];
  const isValid = (r: number, c: number) => validMoves.some(([vr,vc]) => vr===r && vc===c);

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="⚫"
        gameName="Reversi"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `Black: ${pendingSavedState.board.flat().filter(c => c===1).length} · White: ${pendingSavedState.board.flat().filter(c => c===2).length}` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.title}>Reversi</Text>
      <Text style={s.subtitle}>You are Black · Outflank White</Text>

      <View style={s.scoreRow}>
        <View style={s.scoreBadge}>
          <View style={[s.disc, s.discBlack]} />
          <Text style={s.scoreNum}>{counts.p1}</Text>
        </View>
        <Text style={s.turnText}>{aiThinking ? 'AI thinking...' : turn===1 ? 'Your turn' : 'AI turn'}</Text>
        <View style={s.scoreBadge}>
          <View style={[s.disc, s.discWhite]} />
          <Text style={s.scoreNum}>{counts.p2}</Text>
        </View>
      </View>

      <View style={s.board}>
        {board.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((cell, ci) => {
              const valid = isValid(ri, ci);
              return (
                <TouchableOpacity
                  key={ci}
                  style={[s.cell, valid && s.cellValid]}
                  onPress={() => handlePress(ri, ci)}
                  activeOpacity={0.7}
                >
                  {cell === 1 && <View style={[s.disc, s.discBlack]} />}
                  {cell === 2 && <View style={[s.disc, s.discWhite]} />}
                  {cell === 0 && valid && <View style={s.validDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '⬛' : '⬜'}</Text>
            <Text style={s.modalTitle}>{won ? 'You Win!' : 'AI Wins'}</Text>
            <Text style={s.modalSub}>Black: {counts.p1}  White: {counts.p2}</Text>
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
              setBoard(initBoard()); setTurn(1); setAiThinking(false);
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

const DISC_SIZE = 36;
const CELL_SIZE = 48;

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 16 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  scoreBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreNum: { fontFamily: fonts.black, fontSize: 22, color: colors.ink },
  turnText: { fontFamily: fonts.bold, fontSize: 13, color: colors.inkMuted },
  board: { borderWidth: 2, borderColor: colors.ink, backgroundColor: '#2E7D32', marginBottom: 16 },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderWidth: 1, borderColor: '#1B5E20', alignItems: 'center', justifyContent: 'center' },
  cellValid: { backgroundColor: 'rgba(255,255,255,0.1)' },
  disc: { width: DISC_SIZE, height: DISC_SIZE, borderRadius: DISC_SIZE/2 },
  discBlack: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#444' },
  discWhite: { backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#ccc' },
  validDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.4)' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
