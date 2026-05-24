import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

// Word Maze: find a path through letter grid that spells a word
// Player traces adjacent letters to form hidden words
const PUZZLES = [
  {
    grid: [
      ['W','O','R','D'],
      ['A','T','H','S'],
      ['T','E','R','E'],
      ['C','H','A','N'],
    ],
    words: ['WORD','WRATH','OTHER','THERE','WATER','WATCH'],
    minWord: 4,
  },
  {
    grid: [
      ['P','L','A','N'],
      ['E','A','T','E'],
      ['A','R','H','S'],
      ['C','T','E','R'],
    ],
    words: ['PLAN','PLANET','EARTH','LATER','PLANE','NEAT'],
    minWord: 4,
  },
];

function isAdjacent(r1: number, c1: number, r2: number, c2: number) {
  return Math.abs(r1-r2) <= 1 && Math.abs(c1-c2) <= 1 && !(r1===r2 && c1===c2);
}

const CELL_SIZE = 64;

export function WordMazeGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const [puzIdx, setPuzIdx] = useState(0);
  const puz = PUZZLES[puzIdx];

  const [path, setPath] = useState<[number,number][]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  const s = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    setPath([]); setFound([]);
  }, [puzIdx]);

  const finish = useCallback((w: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setWon(w);
    setDone(true);
    onComplete(w, elapsedRef.current);
  }, [onComplete]);

  const currentWord = path.map(([r,c]) => puz.grid[r][c]).join('');

  const handleCellPress = useCallback((r: number, c: number) => {
    const key = `${r},${c}`;
    const inPath = path.some(([pr,pc]) => pr===r && pc===c);

    if (inPath) {
      // Truncate path to this cell
      const idx = path.findIndex(([pr,pc]) => pr===r && pc===c);
      setPath(path.slice(0, idx+1));
      return;
    }

    if (path.length === 0) {
      setPath([[r,c]]);
      return;
    }

    const [lr,lc] = path[path.length-1];
    if (!isAdjacent(lr,lc,r,c)) {
      // Start new path
      setPath([[r,c]]);
      return;
    }

    const newPath = [...path, [r,c] as [number,number]];
    setPath(newPath);

    const word = newPath.map(([pr,pc]) => puz.grid[pr][pc]).join('');
    if (puz.words.includes(word) && !found.includes(word)) {
      const newFound = [...found, word];
      setFound(newFound);
      setPath([]);
      // Win after finding 3 words
      if (newFound.length >= 3) finish(true);
    }
  }, [path, found, puz, finish]);

  const isOnPath = (r: number, c: number) => path.some(([pr,pc]) => pr===r && pc===c);
  const pathIndex = (r: number, c: number) => path.findIndex(([pr,pc]) => pr===r && pc===c);

  return (
    <View style={s.container}>
      <Text style={s.title}>Word Maze</Text>
      <Text style={s.subtitle}>Trace adjacent letters to form words</Text>
      <Text style={s.progress}>Found: {found.length} / 3 words</Text>

      <View style={s.currentBox}>
        <Text style={[s.currentWord, puz.words.includes(currentWord) && s.currentWordValid]}>
          {currentWord || '—'}
        </Text>
        {puz.words.includes(currentWord) && !found.includes(currentWord) && (
          <Text style={s.validLabel}>Valid word!</Text>
        )}
      </View>

      <View style={s.grid}>
        {puz.grid.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((letter, ci) => {
              const onPath = isOnPath(ri, ci);
              const idx = pathIndex(ri, ci);
              return (
                <TouchableOpacity
                  key={ci}
                  style={[s.cell, onPath && s.cellOnPath]}
                  onPress={() => handleCellPress(ri, ci)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.letter, onPath && s.letterOnPath]}>{letter}</Text>
                  {onPath && <Text style={s.pathNum}>{idx+1}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={s.foundList}>
        {found.map(w => (
          <View key={w} style={s.foundChip}>
            <Text style={s.foundChipText}>{w}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={s.clearBtn} onPress={() => setPath([])} activeOpacity={0.8}>
        <Text style={s.clearBtnText}>Clear Path</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🗺️' : '❌'}</Text>
            <Text style={s.modalTitle}>{won ? 'Maze Master!' : 'Keep Searching'}</Text>
            <Text style={s.modalSub}>Found: {found.join(', ')}</Text>
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
  subtitle: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginBottom: 4, textAlign: 'center' },
  progress: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted, marginBottom: 8 },
  currentBox: { height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  currentWord: { fontFamily: fonts.black, fontSize: 24, color: colors.ink },
  currentWordValid: { color: colors.success },
  validLabel: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.success },
  grid: { borderWidth: 2, borderColor: colors.ink, marginBottom: 16 },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  cellOnPath: { backgroundColor: colors.word.bg, borderColor: colors.word.ink, borderWidth: 2 },
  letter: { fontFamily: fonts.black, fontSize: 22, color: colors.ink },
  letterOnPath: { color: colors.word.ink },
  pathNum: { position: 'absolute', top: 2, right: 4, fontFamily: fonts.semiBold, fontSize: 10, color: colors.word.ink },
  foundList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 12 },
  foundChip: { backgroundColor: colors.number.bg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  foundChipText: { fontFamily: fonts.bold, fontSize: 13, color: colors.number.ink },
  clearBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 999 },
  clearBtnText: { fontFamily: fonts.bold, fontSize: 13, color: colors.inkSoft },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.inkMuted, marginBottom: 24, textAlign: 'center' },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
