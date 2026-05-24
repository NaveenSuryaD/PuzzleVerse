import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';
import { useSaveGame } from '../../utils/gameSave';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  savedStateJSON?: string;
}

const PUZZLES = [
  {
    people: ['Alice', 'Bob', 'Carol'],
    attributes: ['Red', 'Blue', 'Green'],
    clues: [
      'Alice does not like Red.',
      'Bob likes Blue.',
      'The person who likes Green is not Carol.',
    ],
    solution: { Alice: 'Green', Bob: 'Blue', Carol: 'Red' },
  },
  {
    people: ['Dan', 'Eve', 'Frank'],
    attributes: ['Dog', 'Cat', 'Bird'],
    clues: [
      'Eve does not have a Dog.',
      'Frank has a Bird.',
      'Dan does not have a Cat.',
    ],
    solution: { Dan: 'Dog', Eve: 'Cat', Frank: 'Bird' },
  },
];

type GridState = Record<string, Record<string, boolean | null>>;

export function LogicGridGame({ onComplete, onBack, savedStateJSON }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => { try { return savedStateJSON ? JSON.parse(savedStateJSON) : null; } catch { return null; } }, []);
  const [puzIdx, setPuzIdx] = useState<number>(() => saved?.puzIdx ?? 0);
  const puzzle = PUZZLES[puzIdx];

  const initGrid = (): GridState => {
    const g: GridState = {};
    for (const p of puzzle.people) {
      g[p] = {};
      for (const a of puzzle.attributes) g[p][a] = null;
    }
    return g;
  };

  const [grid, setGrid] = useState<GridState>(() => saved?.grid ?? initGrid());
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  useSaveGame('logic-grid', () => ({ puzIdx, grid }), !done, [puzIdx, grid], elapsedRef);
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

  const checkSolved = useCallback((g: GridState) => {
    for (const p of puzzle.people) {
      const chosen = puzzle.attributes.find(a => g[p][a] === true);
      if (!chosen) return;
      if (chosen !== puzzle.solution[p as keyof typeof puzzle.solution]) { finish(false); return; }
    }
    finish(true);
  }, [puzzle, finish]);

  const handleTap = useCallback((person: string, attr: string) => {
    setGrid(prev => {
      const next: GridState = {};
      for (const p of puzzle.people) {
        next[p] = { ...prev[p] };
      }
      const curr = next[person][attr];
      next[person][attr] = curr === null ? true : curr === true ? false : null;
      checkSolved(next);
      return next;
    });
  }, [puzzle, checkSolved]);

  const CELL = 44;

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.title}>Logic Grid</Text>
      <Text style={s.subtitle}>Use clues to match each person with their attribute</Text>

      {/* Clues */}
      {puzzle.clues.map((clue, i) => (
        <View key={i} style={s.clue}>
          <Text style={s.clueNum}>{i + 1}.</Text>
          <Text style={s.clueText}>{clue}</Text>
        </View>
      ))}

      {/* Grid */}
      <View style={s.grid}>
        {/* Header row */}
        <View style={{ flexDirection: 'row' }}>
          <View style={{ width: 64 }} />
          {puzzle.attributes.map(a => (
            <View key={a} style={{ width: CELL, alignItems: 'center' }}>
              <Text style={s.header}>{a}</Text>
            </View>
          ))}
        </View>
        {/* Rows */}
        {puzzle.people.map(person => (
          <View key={person} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[s.person, { width: 64 }]}>{person}</Text>
            {puzzle.attributes.map(attr => {
              const v = grid[person]?.[attr];
              return (
                <TouchableOpacity
                  key={attr}
                  style={[
                    s.cell, { width: CELL, height: CELL },
                    v === true && { backgroundColor: colors.success + '30' },
                    v === false && { backgroundColor: colors.danger + '20' },
                  ]}
                  onPress={() => handleTap(person, attr)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.cellVal, v === true && { color: colors.success }, v === false && { color: colors.danger }]}>
                    {v === true ? '✓' : v === false ? '✗' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🧩' : '❌'}</Text>
            <Text style={s.modalTitle}>{won ? 'Deduced!' : 'Not quite'}</Text>
            {!won && (
              <Text style={s.modalSub}>
                {puzzle.people.map(p => `${p}: ${puzzle.solution[p as keyof typeof puzzle.solution]}`).join('\n')}
              </Text>
            )}
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
              const next = (puzIdx + 1) % PUZZLES.length;
              setPuzIdx(next);
              setGrid(initGrid());
              elapsedRef.current = 0;
              timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
            }}>
              <Text style={s.modalBtnText}>Next Puzzle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { alignItems: 'center', padding: 20, paddingBottom: 40 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 16, textAlign: 'center' },
  clue: { flexDirection: 'row', gap: 8, marginBottom: 8, width: '100%' },
  clueNum: { fontFamily: fonts.extraBold, fontSize: 14, color: colors.ink },
  clueText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.inkSoft, flex: 1 },
  grid: { marginTop: 16 },
  header: { fontFamily: fonts.bold, fontSize: 11, color: colors.inkMuted, textAlign: 'center' },
  person: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.ink },
  cell: { borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  cellVal: { fontFamily: fonts.black, fontSize: 18, color: colors.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 24, textAlign: 'center' },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
