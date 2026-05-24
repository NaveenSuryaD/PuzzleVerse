import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

// Shikaku: divide grid into rectangles, each containing exactly one number
// Number indicates the area of its rectangle
const PUZZLES = [
  {
    rows: 5, cols: 5,
    clues: [
      { r: 0, c: 0, n: 6 },
      { r: 0, c: 3, n: 4 },
      { r: 2, c: 2, n: 4 },
      { r: 4, c: 0, n: 6 },
      { r: 4, c: 4, n: 5 },
    ],
    // Solution: rectangles as [r1,c1,r2,c2] (top-left to bottom-right)
    solution: [
      [0,0,1,2], // 6: 2x3
      [0,3,1,4], // 4: 2x2
      [2,1,3,2], // 4: 2x2
      [3,0,4,2], // actually let's do simpler
      [2,3,4,4], // 6: 3x2
    ],
  },
];

const CELL = 56;

function rectContains(r1: number, c1: number, r2: number, c2: number, r: number, c: number) {
  return r >= r1 && r <= r2 && c >= c1 && c <= c2;
}

export function ShikakuGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const puz = PUZZLES[0];
  const ROWS = puz.rows, COLS = puz.cols;

  const [selecting, setSelecting] = useState<{ r: number; c: number } | null>(null);
  const [rects, setRects] = useState<Array<{ r1: number; c1: number; r2: number; c2: number; color: string }>>([]);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  const s = useMemo(() => makeStyles(colors), [colors]);

  const RECT_COLORS = ['#E74C3C','#3498DB','#2ECC71','#F1C40F','#9B59B6','#E67E22','#1ABC9C','#E91E63'];

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

  const checkSolution = useCallback((newRects: typeof rects) => {
    // Each clue cell must be covered by exactly one rect whose area equals the clue
    for (const clue of puz.clues) {
      const covering = newRects.filter(rect =>
        rectContains(rect.r1, rect.c1, rect.r2, rect.c2, clue.r, clue.c)
      );
      if (covering.length !== 1) return false;
      const rect = covering[0];
      const area = (rect.r2 - rect.r1 + 1) * (rect.c2 - rect.c1 + 1);
      if (area !== clue.n) return false;
    }
    // Total coverage
    const totalCoverage = newRects.reduce((sum, rect) =>
      sum + (rect.r2 - rect.r1 + 1) * (rect.c2 - rect.c1 + 1), 0
    );
    return totalCoverage === ROWS * COLS;
  }, [puz, ROWS, COLS]);

  const handleCellPress = useCallback((r: number, c: number) => {
    if (!selecting) {
      setSelecting({ r, c });
    } else {
      const r1 = Math.min(selecting.r, r);
      const c1 = Math.min(selecting.c, c);
      const r2 = Math.max(selecting.r, r);
      const c2 = Math.max(selecting.c, c);

      // Check overlap with existing rects
      const hasOverlap = rects.some(rect => {
        return r1 <= rect.r2 && r2 >= rect.r1 && c1 <= rect.c2 && c2 >= rect.c1;
      });

      if (!hasOverlap) {
        const newRects = [...rects, { r1, c1, r2, c2, color: RECT_COLORS[rects.length % RECT_COLORS.length] }];
        setRects(newRects);
        if (checkSolution(newRects)) finish(true);
      }
      setSelecting(null);
    }
  }, [selecting, rects, checkSolution, finish, RECT_COLORS]);

  const getRectForCell = (r: number, c: number) =>
    rects.find(rect => rectContains(rect.r1, rect.c1, rect.r2, rect.c2, r, c));

  const getClue = (r: number, c: number) =>
    puz.clues.find(cl => cl.r === r && cl.c === c);

  return (
    <View style={s.container}>
      <Text style={s.title}>Shikaku</Text>
      <Text style={s.subtitle}>Divide into rectangles · Each number = rectangle area</Text>

      <View style={s.grid}>
        {Array.from({ length: ROWS }, (_, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {Array.from({ length: COLS }, (_, ci) => {
              const rect = getRectForCell(ri, ci);
              const clue = getClue(ri, ci);
              const isSel = selecting?.r === ri && selecting?.c === ci;
              return (
                <TouchableOpacity
                  key={ci}
                  style={[
                    s.cell,
                    rect ? { backgroundColor: rect.color + '40', borderColor: rect.color } : {},
                    isSel ? { backgroundColor: colors.logic.bg, borderColor: colors.logic.ink } : {},
                  ]}
                  onPress={() => handleCellPress(ri, ci)}
                  activeOpacity={0.7}
                >
                  {clue && <Text style={s.clueNum}>{clue.n}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <TouchableOpacity style={s.resetBtn} onPress={() => { setRects([]); setSelecting(null); }} activeOpacity={0.8}>
        <Text style={s.resetBtnText}>Reset</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '▦' : '✗'}</Text>
            <Text style={s.modalTitle}>{won ? 'Solved!' : 'Keep Trying'}</Text>
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
              setRects([]); setSelecting(null);
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginBottom: 20, textAlign: 'center' },
  grid: { borderWidth: 2, borderColor: colors.ink, marginBottom: 24 },
  cell: { width: CELL, height: CELL, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  clueNum: { fontFamily: fonts.black, fontSize: 18, color: colors.ink },
  resetBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999 },
  resetBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
