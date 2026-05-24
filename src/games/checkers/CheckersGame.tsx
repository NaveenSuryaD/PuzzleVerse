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

type Piece = 0 | 1 | 2 | 3 | 4; // 0=empty, 1=player, 2=playerKing, 3=AI, 4=AIKing
type Board = Piece[][];

const SIZE = 8;

function initBoard(): Board {
  const b: Board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0) as Piece[]);
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < SIZE; c++)
      if ((r + c) % 2 === 1) b[r][c] = 3;
  for (let r = 5; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if ((r + c) % 2 === 1) b[r][c] = 1;
  return b;
}

function isPlayer(p: Piece) { return p === 1 || p === 2; }
function isAI(p: Piece) { return p === 3 || p === 4; }
function isKing(p: Piece) { return p === 2 || p === 4; }

function getMoves(board: Board, r: number, c: number): { nr: number; nc: number; jump?: [number,number] }[] {
  const piece = board[r][c];
  if (piece === 0) return [];
  const dirs: [number,number][] = [];
  if (isPlayer(piece) || isKing(piece)) dirs.push([-1,-1],[-1,1]);
  if (isAI(piece) || isKing(piece)) dirs.push([1,-1],[1,1]);

  const moves: { nr: number; nc: number; jump?: [number,number] }[] = [];
  for (const [dr,dc] of dirs) {
    const nr = r+dr, nc = c+dc;
    if (nr>=0 && nr<SIZE && nc>=0 && nc<SIZE) {
      if (board[nr][nc] === 0) {
        moves.push({ nr, nc });
      } else {
        // Check jump
        const opp = isPlayer(piece) ? isAI : isPlayer;
        if (opp(board[nr][nc])) {
          const jr = nr+dr, jc = nc+dc;
          if (jr>=0 && jr<SIZE && jc>=0 && jc<SIZE && board[jr][jc]===0) {
            moves.push({ nr: jr, nc: jc, jump: [nr,nc] });
          }
        }
      }
    }
  }
  return moves;
}

export function CheckersGame({ onComplete, onBack, savedStateJSON }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => { try { return savedStateJSON ? JSON.parse(savedStateJSON) : null; } catch { return null; } }, []);
  const [board, setBoard] = useState<Board>(() => saved?.board ?? initBoard());
  const [selected, setSelected] = useState<[number,number] | null>(null);
  const [turn, setTurn] = useState<'player'|'ai'>(() => (saved?.turn ?? 'player') as 'player'|'ai');
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  useSaveGame('checkers', () => ({ board, turn }), !done, [board, turn], elapsedRef);
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

  const applyMove = useCallback((b: Board, fr: number, fc: number, tr: number, tc: number): Board => {
    const next = b.map(row => [...row] as Piece[]);
    const piece = next[fr][fc];
    next[fr][fc] = 0;
    // King promotion
    let newPiece = piece;
    if (piece === 1 && tr === 0) newPiece = 2;
    if (piece === 3 && tr === SIZE-1) newPiece = 4;
    next[tr][tc] = newPiece;
    return next;
  }, []);

  const doAITurn = useCallback((b: Board) => {
    setAiThinking(true);
    setTimeout(() => {
      // Find all AI moves
      const allMoves: { fr:number; fc:number; tr:number; tc:number; jump?:[number,number] }[] = [];
      for (let r=0; r<SIZE; r++)
        for (let c=0; c<SIZE; c++)
          if (isAI(b[r][c])) {
            for (const m of getMoves(b,r,c)) {
              allMoves.push({ fr:r, fc:c, tr:m.nr, tc:m.nc, jump:m.jump });
            }
          }

      if (allMoves.length === 0) { finish(true); setAiThinking(false); return; }

      // Prefer jumps
      const jumps = allMoves.filter(m => m.jump);
      const move = jumps.length > 0 ? jumps[Math.floor(Math.random()*jumps.length)] : allMoves[Math.floor(Math.random()*allMoves.length)];

      let newBoard = applyMove(b, move.fr, move.fc, move.tr, move.tc);
      if (move.jump) newBoard[move.jump[0]][move.jump[1]] = 0;

      // Check player pieces left
      let playerCount = 0;
      for (const row of newBoard) for (const p of row) if (isPlayer(p)) playerCount++;
      if (playerCount === 0) { setBoard(newBoard); finish(false); setAiThinking(false); return; }

      setBoard(newBoard);
      setTurn('player');
      setAiThinking(false);
    }, 600);
  }, [applyMove, finish]);

  const handlePress = useCallback((r: number, c: number) => {
    if (turn !== 'player' || aiThinking) return;
    const piece = board[r][c];

    if (selected) {
      const [sr,sc] = selected;
      const moves = getMoves(board,sr,sc);
      const mv = moves.find(m => m.nr===r && m.nc===c);
      if (mv) {
        let newBoard = applyMove(board, sr, sc, r, c);
        if (mv.jump) newBoard[mv.jump[0]][mv.jump[1]] = 0;
        setSelected(null);

        // Check AI pieces left
        let aiCount = 0;
        for (const row of newBoard) for (const p of row) if (isAI(p)) aiCount++;
        if (aiCount === 0) { setBoard(newBoard); finish(true); return; }

        setBoard(newBoard);
        setTurn('ai');
        doAITurn(newBoard);
        return;
      }
    }

    if (isPlayer(piece)) setSelected([r,c]);
    else setSelected(null);
  }, [turn, aiThinking, board, selected, applyMove, doAITurn, finish]);

  const validMoves = selected ? getMoves(board, selected[0], selected[1]) : [];

  return (
    <View style={s.container}>
      <Text style={s.title}>Checkers</Text>
      <Text style={s.subtitle}>You are Red · Capture all AI pieces</Text>
      <Text style={s.turnText}>{aiThinking ? 'AI thinking...' : turn==='player' ? 'Your turn' : 'AI turn'}</Text>

      <View style={s.board}>
        {board.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((cell, ci) => {
              const isDark = (ri+ci)%2===1;
              const isSel = selected?.[0]===ri && selected?.[1]===ci;
              const isValidMove = validMoves.some(m=>m.nr===ri&&m.nc===ci);
              return (
                <TouchableOpacity
                  key={ci}
                  style={[
                    s.cell,
                    isDark ? s.cellDark : s.cellLight,
                    isSel && s.cellSelected,
                    isValidMove && s.cellValidMove,
                  ]}
                  onPress={() => handlePress(ri,ci)}
                  activeOpacity={0.8}
                >
                  {cell===1 && <View style={[s.piece, s.piecePlayer]} />}
                  {cell===2 && <View style={[s.piece, s.piecePlayer]}><Text style={s.kingMark}>★</Text></View>}
                  {cell===3 && <View style={[s.piece, s.pieceAI]} />}
                  {cell===4 && <View style={[s.piece, s.pieceAI]}><Text style={s.kingMark}>★</Text></View>}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '♟️' : '🤖'}</Text>
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
              setBoard(initBoard()); setSelected(null); setTurn('player'); setAiThinking(false);
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

const CELL_SIZE = 40;
const PIECE_SIZE = 30;

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginBottom: 4 },
  turnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted, marginBottom: 12 },
  board: { borderWidth: 2, borderColor: colors.ink },
  cell: { width: CELL_SIZE, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center' },
  cellLight: { backgroundColor: '#F0D9B5' },
  cellDark: { backgroundColor: '#B58863' },
  cellSelected: { backgroundColor: colors.logic.bg + 'CC' },
  cellValidMove: { backgroundColor: colors.success + '60' },
  piece: { width: PIECE_SIZE, height: PIECE_SIZE, borderRadius: PIECE_SIZE/2, alignItems: 'center', justifyContent: 'center' },
  piecePlayer: { backgroundColor: '#C0432F', borderWidth: 2, borderColor: '#8B2212' },
  pieceAI: { backgroundColor: '#F5F5F5', borderWidth: 2, borderColor: '#999' },
  kingMark: { fontSize: 12, color: '#FFD700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
