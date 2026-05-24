import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { SKYSCRAPER_PUZZLES } from './puzzles';
import * as Haptics from 'expo-haptics';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

const CELL = 60;
const CLUE = 28;

export function SkyscrapersGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const [puzIdx, setPuzIdx] = useState(0);
  const puzzle = SKYSCRAPER_PUZZLES[puzIdx];
  const N = puzzle.size;

  const [grid, setGrid] = useState<(number | null)[][]>(() =>
    Array.from({ length: N }, () => Array(N).fill(null))
  );
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [done, setDone] = useState(false);

  const s = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const finish = useCallback((w: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setDone(true);
    onComplete(w, elapsedRef.current);
  }, [onComplete]);

  const checkSolved = useCallback((g: (number | null)[][]) => {
    if (g.some(row => row.some(v => v === null))) return;
    const nums = g as number[][];
    const correct = nums.every((row, ri) => row.every((v, ci) => v === puzzle.solution[ri][ci]));
    if (correct) finish(true);
  }, [puzzle, finish]);

  const handleNumpad = useCallback((n: number) => {
    if (!selected) return;
    const [r, c] = selected;
    setGrid(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = n;
      checkSolved(next);
      return next;
    });
  }, [selected, checkSolved]);

  return (
    <View style={s.container}>
      <Text style={s.title}>Skyscrapers</Text>
      <Text style={s.subtitle}>Numbers show visible buildings from that direction</Text>

      <View>
        {/* Top clues */}
        <View style={{ flexDirection: 'row', paddingLeft: CLUE }}>
          {puzzle.clues.top.map((n, i) => (
            <View key={i} style={{ width: CELL, alignItems: 'center' }}>
              <Text style={s.clue}>{n ?? ''}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row' }}>
          {/* Left clues */}
          <View>
            {puzzle.clues.left.map((n, i) => (
              <View key={i} style={{ width: CLUE, height: CELL, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={s.clue}>{n ?? ''}</Text>
              </View>
            ))}
          </View>

          {/* Grid */}
          <View style={s.grid}>
            {grid.map((row, ri) => (
              <View key={ri} style={{ flexDirection: 'row' }}>
                {row.map((val, ci) => {
                  const isSel = selected?.[0] === ri && selected?.[1] === ci;
                  return (
                    <TouchableOpacity
                      key={ci}
                      style={[s.cell, isSel && s.cellSelected]}
                      onPress={() => setSelected([ri, ci])}
                      activeOpacity={0.7}
                    >
                      <Text style={s.cellVal}>{val ?? ''}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Right clues */}
          <View>
            {puzzle.clues.right.map((n, i) => (
              <View key={i} style={{ width: CLUE, height: CELL, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={s.clue}>{n ?? ''}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom clues */}
        <View style={{ flexDirection: 'row', paddingLeft: CLUE }}>
          {puzzle.clues.bottom.map((n, i) => (
            <View key={i} style={{ width: CELL, alignItems: 'center' }}>
              <Text style={s.clue}>{n ?? ''}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={s.numpad}>
        {[1,2,3,4].map(n => (
          <TouchableOpacity key={n} style={s.numBtn} onPress={() => handleNumpad(n)} activeOpacity={0.7}>
            <Text style={s.numBtnText}>{n}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[s.numBtn, { backgroundColor: colors.danger + '20' }]} onPress={() => {
          if (!selected) return;
          const [r, c] = selected;
          setGrid(prev => { const next = prev.map(row => [...row]); next[r][c] = null; return next; });
        }}>
          <Text style={[s.numBtnText, { color: colors.danger }]}>✕</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>🏙️</Text>
            <Text style={s.modalTitle}>City Planned!</Text>
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
              const next = (puzIdx + 1) % SKYSCRAPER_PUZZLES.length;
              setPuzIdx(next);
              setGrid(Array.from({ length: N }, () => Array(N).fill(null)));
              setSelected(null);
              elapsedRef.current = 0;
              timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginBottom: 20, textAlign: 'center' },
  clue: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft },
  grid: { borderWidth: 2, borderColor: colors.ink },
  cell: { width: CELL, height: CELL, borderWidth: 0.5, borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  cellSelected: { backgroundColor: colors.logic.bg, borderColor: colors.logic.ink, borderWidth: 2 },
  cellVal: { fontFamily: fonts.black, fontSize: 24, color: colors.ink },
  numpad: { flexDirection: 'row', gap: 12, marginTop: 20 },
  numBtn: { width: 60, height: 52, backgroundColor: colors.surface, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.divider },
  numBtnText: { fontFamily: fonts.extraBold, fontSize: 22, color: colors.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
