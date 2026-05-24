import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

// Tapa: shade cells to form one connected group
// Clue cells show how many consecutive shaded neighbors exist in each group
const PUZZLES = [
  {
    size: 5,
    // clues[r][c] = array of group lengths, [] = free cell, null = clue cell
    clues: [
      [null, [], [], null, []],
      [[], null, [], [], null],
      [null, [], null, [], []],
      [[], [], null, null, []],
      [null, [], [], null, null],
    ] as unknown as (null | number[])[],
    clueValues: {
      '0,0': [3], '0,3': [2],
      '1,1': [1,2], '1,4': [1],
      '2,0': [2], '2,2': [4],
      '3,2': [1], '3,3': [2],
      '4,0': [3], '4,3': [1], '4,4': [1],
    } as Record<string, number[]>,
    // Solution: set of "r,c" shaded
    solution: new Set([
      '0,1','0,2','0,4',
      '1,0','1,2','1,3',
      '2,1','2,3','2,4',
      '3,0','3,1','3,4',
      '4,1','4,2',
    ]),
  },
];

const CELL_SIZE = 58;

export function TapaGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const puz = PUZZLES[0];
  const SIZE = puz.size;

  const [shaded, setShaded] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

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

  const isClueCell = (r: number, c: number) => puz.clueValues[`${r},${c}`] !== undefined;

  const handleTap = useCallback((r: number, c: number) => {
    if (isClueCell(r, c)) return;
    const key = `${r},${c}`;
    const newShaded = new Set(shaded);
    if (newShaded.has(key)) newShaded.delete(key);
    else newShaded.add(key);
    setShaded(newShaded);

    // Simple win check: match solution
    if (newShaded.size === puz.solution.size) {
      let match = true;
      for (const k of newShaded) if (!puz.solution.has(k)) { match = false; break; }
      if (match) finish(true);
    }
  }, [shaded, puz, finish]);

  return (
    <View style={s.container}>
      <Text style={s.title}>Tapa</Text>
      <Text style={s.subtitle}>Shade cells to form one connected wall · Follow clues</Text>

      <View style={s.grid}>
        {Array.from({ length: SIZE }, (_, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {Array.from({ length: SIZE }, (_, ci) => {
              const clue = puz.clueValues[`${ri},${ci}`];
              const isShaded = shaded.has(`${ri},${ci}`);

              return clue ? (
                <View key={ci} style={[s.cell, s.clueCell]}>
                  <Text style={s.clueText}>{clue.join(',')}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  key={ci}
                  style={[s.cell, isShaded && s.cellShaded]}
                  onPress={() => handleTap(ri, ci)}
                  activeOpacity={0.7}
                />
              );
            })}
          </View>
        ))}
      </View>

      <Text style={s.progress}>Shaded: {shaded.size} / {puz.solution.size}</Text>

      <TouchableOpacity style={s.resetBtn} onPress={() => setShaded(new Set())} activeOpacity={0.8}>
        <Text style={s.resetBtnText}>Reset</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '⬛' : '❌'}</Text>
            <Text style={s.modalTitle}>{won ? 'Wall Built!' : 'Not Quite'}</Text>
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
              setShaded(new Set());
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
  grid: { borderWidth: 2, borderColor: colors.ink, marginBottom: 16 },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface },
  clueCell: { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  clueText: { fontFamily: fonts.black, fontSize: 13, color: colors.ink },
  cellShaded: { backgroundColor: colors.ink },
  progress: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted, marginBottom: 12 },
  resetBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999 },
  resetBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
