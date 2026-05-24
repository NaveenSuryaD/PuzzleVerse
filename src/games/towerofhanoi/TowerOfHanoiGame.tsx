import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { useProgressStore } from '../../store/useProgressStore';
import * as Haptics from 'expo-haptics';
import { useSaveGame } from '../../utils/gameSave';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  savedStateJSON?: string;
}

const { width: SCREEN_W } = Dimensions.get('window');
const PEG_AREA_W = (SCREEN_W - 48) / 3;
const MAX_DISC_W = PEG_AREA_W - 12;
const DISC_H = 26;
const PEG_H = 180;

const DISC_COLORS = ['#E74C3C', '#E67E22', '#F1C40F', '#2ECC71', '#3498DB'];

function initPegs(n: number): number[][] {
  const discs = Array.from({ length: n }, (_, i) => n - i);
  return [discs, [], []];
}

export function TowerOfHanoiGame({ onComplete, onBack, savedStateJSON }: Props) {
  const colors = useTheme();
  const { levels, setGameLevel } = useProgressStore();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => { try { return savedStateJSON ? JSON.parse(savedStateJSON) : null; } catch { return null; } }, []);
  const [level, setLevel] = useState(() => levels['tower-of-hanoi'] ?? 1);
  const initDiscs = Math.min(3 + ((levels['tower-of-hanoi'] ?? 1) - 1), 7);
  const [discCount, setDiscCount] = useState(initDiscs);
  const [pegs, setPegs] = useState<number[][]>(() => saved?.pegs ?? initPegs(initDiscs));
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState<number>(() => saved?.moves ?? 0);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  useSaveGame('tower-of-hanoi', () => ({ pegs, moves }), !done, [pegs], elapsedRef);

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

  const checkWin = useCallback((newPegs: number[][]) => {
    // Win when all discs on peg 2 (rightmost)
    if (newPegs[2].length === discCount) finish(true);
  }, [discCount, finish]);

  const handlePegTap = useCallback((pegIdx: number) => {
    if (selected === null) {
      if (pegs[pegIdx].length > 0) setSelected(pegIdx);
      return;
    }
    if (selected === pegIdx) {
      setSelected(null);
      return;
    }
    const srcPeg = pegs[selected];
    const dstPeg = pegs[pegIdx];
    const topSrc = srcPeg[srcPeg.length - 1];
    const topDst = dstPeg[dstPeg.length - 1];
    if (dstPeg.length === 0 || topSrc < topDst) {
      setPegs(prev => {
        const next = prev.map(p => [...p]);
        next[selected].pop();
        next[pegIdx].push(topSrc);
        checkWin(next);
        return next;
      });
      setMoves(m => m + 1);
    }
    setSelected(null);
  }, [selected, pegs, checkWin]);

  const minMoves = Math.pow(2, discCount) - 1;

  return (
    <View style={s.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Text style={s.title}>Tower of Hanoi</Text>
        <View style={[s.levelBadge, { backgroundColor: colors.visual.bg }]}>
          <Text style={[s.levelText, { color: colors.visual.ink }]}>Level {level}</Text>
        </View>
      </View>
      <Text style={s.subtitle}>Move all discs to the right peg · Moves: {moves}</Text>
      <Text style={s.hint}>Tap a peg to select, then tap destination</Text>

      <View style={s.board}>
        {pegs.map((peg, pi) => (
          <TouchableOpacity
            key={pi}
            style={[s.pegArea, selected === pi && s.pegAreaSelected]}
            onPress={() => handlePegTap(pi)}
            activeOpacity={0.8}
          >
            {/* Vertical peg rod */}
            <View style={[s.pegRod, { backgroundColor: colors.inkMuted }]} />

            {/* Discs */}
            <View style={s.discsContainer}>
              {peg.map((size, di) => {
                const w = (size / discCount) * MAX_DISC_W;
                const col = DISC_COLORS[(size - 1) % DISC_COLORS.length];
                return (
                  <View
                    key={di}
                    style={[s.disc, { width: w, height: DISC_H, backgroundColor: col }]}
                  >
                    <Text style={s.discText}>{size}</Text>
                  </View>
                );
              })}
            </View>

            {/* Peg base */}
            <View style={[s.pegBase, { backgroundColor: colors.inkMuted }]} />
            <Text style={s.pegLabel}>{['A', 'B', 'C'][pi]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.optimal}>Optimal: {minMoves} moves</Text>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🏆' : '😅'}</Text>
            <Text style={s.modalTitle}>{won ? 'Solved!' : 'Game Over'}</Text>
            <Text style={s.modalSub}>Moves: {moves} (optimal: {minMoves})</Text>
            {onBack && (
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 8 }]}
                onPress={onBack}
              >
                <Text style={[s.modalBtnText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            )}
            {won && (
              <TouchableOpacity style={s.modalBtn} onPress={() => {
                const nextDiscs = Math.min(discCount + 1, 7);
                const nextLevel = level + 1;
                setDone(false);
                completedRef.current = false;
                setLevel(nextLevel);
                setGameLevel('tower-of-hanoi', nextLevel);
                setDiscCount(nextDiscs);
                setPegs(initPegs(nextDiscs));
                setSelected(null);
                setMoves(0);
                elapsedRef.current = 0;
                timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
              }}>
                <Text style={s.modalBtnText}>Next Level →</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[s.modalBtn, won && { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule }]} onPress={() => {
              setDone(false);
              completedRef.current = false;
              setPegs(initPegs(discCount));
              setSelected(null);
              setMoves(0);
              elapsedRef.current = 0;
              timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
            }}>
              <Text style={[s.modalBtnText, won && { color: colors.inkSoft }]}>Play Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink },
  levelBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  levelText: { fontFamily: fonts.extraBold, fontSize: 13 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.inkMuted, marginBottom: 4 },
  hint: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginBottom: 24 },
  board: { flexDirection: 'row', width: SCREEN_W - 48, height: PEG_H + 50, alignItems: 'flex-end' },
  pegArea: {
    flex: 1, height: PEG_H + 50, alignItems: 'center', justifyContent: 'flex-end',
    borderRadius: 12, paddingBottom: 4,
  },
  pegAreaSelected: { backgroundColor: colors.logic.bg },
  pegRod: { position: 'absolute', bottom: 30, width: 6, height: PEG_H, borderRadius: 3 },
  discsContainer: { position: 'absolute', bottom: 30, width: '100%', alignItems: 'center', gap: 2 },
  disc: { borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  discText: { fontFamily: fonts.bold, fontSize: 11, color: 'white' },
  pegBase: { width: '80%', height: 8, borderRadius: 4 },
  pegLabel: { fontFamily: fonts.black, fontSize: 16, color: colors.inkSoft, marginTop: 4 },
  optimal: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginTop: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
