import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
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

// Typeshift: columns of letters, slide each column up/down to form words
const PUZZLES = [
  {
    // Each column contains letters; slide rows to align valid words
    columns: [
      ['C','S','T','B'],
      ['A','H','O','R'],
      ['T','O','P','I'],
    ],
    // Valid words that can be formed (row combinations)
    words: ['CAT','SAP','TOP','BRI','HAP','SAT','COT','TAP','BAT','HOT'],
    // Start positions for each column (0-indexed)
    startPositions: [0, 0, 0],
    // Target word
    target: 'CAT',
  },
  {
    columns: [
      ['F','B','G','P'],
      ['L','A','O','I'],
      ['Y','T','G','N'],
    ],
    words: ['FLY','BAT','GOG','PIN','FAT','BOY','GAG','PLY','FIG','POT'],
    startPositions: [0, 0, 0],
    target: 'FLY',
  },
];

interface SaveState {
  puzIdx: number;
  positions: number[];
  foundWords: string[];
}

export function TypeshiftGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('typeshift');

  const [puzIdx, setPuzIdx] = useState<number>(0);
  const puz = PUZZLES[puzIdx];

  const [positions, setPositions] = useState<number[]>(() => puz.startPositions.slice());
  const [foundWords, setFoundWords] = useState<Set<string>>(() => new Set());
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

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
      save({ puzIdx, positions, foundWords: [...foundWords] }, timer.elapsedSeconds);
    }
  }, [puzIdx, positions, foundWords, timer.elapsedSeconds, done, showResumeModal, save]);

  const handleResume = useCallback(() => {
    if (pendingSavedState) {
      setPuzIdx(pendingSavedState.puzIdx);
      setPositions(pendingSavedState.positions);
      setFoundWords(new Set(pendingSavedState.foundWords));
    }
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    clear();
    setPuzIdx(0);
    setPositions(PUZZLES[0].startPositions.slice());
    setFoundWords(new Set());
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

  const currentWord = positions.map((pos, col) => puz.columns[col][pos % puz.columns[col].length]).join('');

  const shift = useCallback((col: number, dir: 1 | -1) => {
    setPositions(prev => {
      const next = [...prev];
      const len = puz.columns[col].length;
      next[col] = ((next[col] + dir) + len) % len;
      return next;
    });
  }, [puz]);

  useEffect(() => {
    if (puz.words.includes(currentWord)) {
      const newFound = new Set(foundWords);
      newFound.add(currentWord);
      setFoundWords(newFound);
      if (newFound.has(puz.target)) finish(true);
    }
  }, [currentWord, puz.words, puz.target, foundWords, finish]);

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="⌨️"
        gameName="Typeshift"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `${pendingSavedState.foundWords.length} words found` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.title}>Typeshift</Text>
      <Text style={s.subtitle}>Slide columns to form the target word</Text>
      <Text style={s.target}>Target: <Text style={s.targetWord}>{puz.target}</Text></Text>

      <View style={s.columnRow}>
        {puz.columns.map((col, ci) => {
          const pos = positions[ci];
          return (
            <View key={ci} style={s.column}>
              <TouchableOpacity style={s.arrow} onPress={() => shift(ci, -1)} activeOpacity={0.7}>
                <Text style={s.arrowText}>▲</Text>
              </TouchableOpacity>
              {/* Show 3 letters centered on current */}
              {[-1, 0, 1].map(offset => {
                const idx = ((pos + offset) + col.length) % col.length;
                const isCurrent = offset === 0;
                return (
                  <View key={offset} style={[s.letterBox, isCurrent && s.letterBoxActive]}>
                    <Text style={[s.letter, isCurrent && s.letterActive]}>{col[idx]}</Text>
                  </View>
                );
              })}
              <TouchableOpacity style={s.arrow} onPress={() => shift(ci, 1)} activeOpacity={0.7}>
                <Text style={s.arrowText}>▼</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <View style={s.currentWordBox}>
        <Text style={s.currentWordLabel}>Current: </Text>
        <Text style={[s.currentWord, puz.words.includes(currentWord) && s.currentWordValid]}>{currentWord}</Text>
      </View>

      <Text style={s.foundLabel}>Found words: {foundWords.size}</Text>
      <View style={s.foundList}>
        {Array.from(foundWords).map(w => (
          <View key={w} style={s.foundChip}>
            <Text style={s.foundChipText}>{w}</Text>
          </View>
        ))}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🔤' : '📝'}</Text>
            <Text style={s.modalTitle}>{won ? 'Shifted!' : 'Try Again'}</Text>
            <Text style={s.modalSub}>Found {foundWords.size} words</Text>
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
              const next = (puzIdx + 1) % PUZZLES.length;
              setPuzIdx(next);
              setPositions(PUZZLES[next].startPositions.slice());
              setFoundWords(new Set());
              timer.start();
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 8, textAlign: 'center' },
  target: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkSoft, marginBottom: 24 },
  targetWord: { fontFamily: fonts.black, color: colors.word.ink },
  columnRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  column: { alignItems: 'center', gap: 4 },
  arrow: { padding: 8 },
  arrowText: { fontFamily: fonts.black, fontSize: 18, color: colors.inkMuted },
  letterBox: { width: 52, height: 52, borderWidth: 1.5, borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  letterBoxActive: { backgroundColor: colors.word.bg, borderColor: colors.word.ink, borderWidth: 2 },
  letter: { fontFamily: fonts.black, fontSize: 24, color: colors.inkMuted },
  letterActive: { color: colors.word.ink, fontSize: 28 },
  currentWordBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  currentWordLabel: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.inkMuted },
  currentWord: { fontFamily: fonts.black, fontSize: 20, color: colors.ink },
  currentWordValid: { color: colors.success },
  foundLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.inkMuted, marginBottom: 8 },
  foundList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  foundChip: { backgroundColor: colors.number.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  foundChipText: { fontFamily: fonts.bold, fontSize: 12, color: colors.number.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
