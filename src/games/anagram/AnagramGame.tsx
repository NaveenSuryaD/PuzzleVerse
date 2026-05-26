import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { generateAnagram } from './generator';
import type { AnagramPuzzle } from './types';
import * as Haptics from 'expo-haptics';
import { useGameTimer } from '../../hooks/useGameTimer';
import { usePersistentGameState } from '../../hooks/usePersistentGameState';
import { ResumeGameModal } from '../../components/ResumeGameModal';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  paused?: boolean;
}

interface SaveState {
  puzzle: AnagramPuzzle;
  placed: (string | null)[];
  usedIndices: number[];
  round: number;
  score: number;
}

export function AnagramGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();

  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('anagram');

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SaveState | null>(null);

  const [puzzle, setPuzzle] = useState<AnagramPuzzle>(() => generateAnagram());
  const [placed, setPlaced] = useState<(string | null)[]>(() => Array(puzzle.word.length).fill(null));
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);
  const [round, setRound] = useState<number>(1);
  const [score, setScore] = useState<number>(0);

  const s = useMemo(() => makeStyles(colors), [colors]);

  // Mount effect: load saved state
  useEffect(() => {
    load().then(result => {
      if (result.found && result.gameState) {
        setPendingSavedState(result.gameState);
        setResumeElapsed(result.elapsedSeconds);
        setShowResumeModal(true);
      } else {
        const puz = generateAnagram();
        setPuzzle(puz);
        setPlaced(Array(puz.word.length).fill(null));
        setUsedIndices(new Set());
        timer.start();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save effect: save on state changes
  useEffect(() => {
    if (!done) {
      save({ puzzle, placed, usedIndices: Array.from(usedIndices), round, score }, timer.elapsedSeconds);
    }
  }, [placed, round, score, done, puzzle, usedIndices, timer.elapsedSeconds, save]);

  const handleResume = useCallback(() => {
    if (pendingSavedState) {
      setPuzzle(pendingSavedState.puzzle);
      setPlaced(pendingSavedState.placed);
      setUsedIndices(new Set(pendingSavedState.usedIndices));
      setRound(pendingSavedState.round);
      setScore(pendingSavedState.score);
    }
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    clear();
    setShowResumeModal(false);
    const puz = generateAnagram();
    setPuzzle(puz);
    setPlaced(Array(puz.word.length).fill(null));
    setUsedIndices(new Set());
    setRound(1);
    setScore(0);
    timer.start();
  }, [clear, timer]);

  const finish = useCallback((w: boolean) => {
    timer.pause();
    clear();
    setWon(w);
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, timer, clear]);

  const initPuzzle = useCallback(() => {
    const puz = generateAnagram();
    setPuzzle(puz);
    setPlaced(Array(puz.word.length).fill(null));
    setUsedIndices(new Set());
  }, []);

  const handleScrambledTap = useCallback((idx: number) => {
    if (usedIndices.has(idx)) return;
    const letter = puzzle.scrambled[idx];
    setPlaced(prev => {
      const copy = [...prev];
      const emptyIdx = copy.findIndex(v => v === null);
      if (emptyIdx === -1) return prev;
      copy[emptyIdx] = letter;
      return copy;
    });
    setUsedIndices(prev => new Set([...prev, idx]));
  }, [usedIndices, puzzle.scrambled]);

  const handlePlacedTap = useCallback((slotIdx: number) => {
    const letter = placed[slotIdx];
    if (!letter) return;
    // Find which scrambled index this was (find unused match)
    const scramIdx = puzzle.scrambled.findIndex((l, i) => l === letter && !usedIndices.has(i));
    // Actually we need to track which scrambled index maps to each slot
    // Simpler: remove from placed and free the scrambled letter
    setPlaced(prev => {
      const copy = [...prev];
      copy[slotIdx] = null;
      return copy;
    });
    // Find first used index with this letter to restore
    setUsedIndices(prev => {
      const newSet = new Set(prev);
      for (const i of Array.from(prev)) {
        if (puzzle.scrambled[i] === letter) {
          newSet.delete(i);
          break;
        }
      }
      return newSet;
    });
  }, [placed, puzzle.scrambled, usedIndices]);

  const handleSubmit = useCallback(() => {
    const answer = placed.join('');
    if (answer === puzzle.word) {
      if (round >= 5) {
        setScore(s => s + 1);
        finish(true);
      } else {
        setScore(s => s + 1);
        setRound(r => r + 1);
        initPuzzle();
      }
    } else {
      finish(false);
    }
  }, [placed, puzzle.word, round, finish, initPuzzle]);

  const allFilled = placed.every(v => v !== null);

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="🔤"
        gameName="Anagram"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `Round ${pendingSavedState.round} of 5 · Score: ${pendingSavedState.score}` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.round}>Round {round} / 5</Text>
      <Text style={s.instruction}>Unscramble the word</Text>

      {/* Answer slots */}
      <View style={s.slotsRow}>
        {placed.map((letter, i) => (
          <TouchableOpacity
            key={i}
            style={[s.slot, letter ? s.slotFilled : s.slotEmpty]}
            onPress={() => handlePlacedTap(i)}
            activeOpacity={letter ? 0.7 : 1}
          >
            <Text style={s.slotLetter}>{letter ?? ''}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scrambled letters */}
      <View style={s.scrambledRow}>
        {puzzle.scrambled.map((letter, i) => (
          <TouchableOpacity
            key={i}
            style={[s.scrambledBtn, usedIndices.has(i) && s.scrambledUsed]}
            onPress={() => handleScrambledTap(i)}
            disabled={usedIndices.has(i)}
            activeOpacity={0.7}
          >
            <Text style={[s.scrambledLetter, usedIndices.has(i) && s.scrambledLetterUsed]}>
              {letter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[s.submitBtn, !allFilled && s.submitDisabled]}
        onPress={handleSubmit}
        disabled={!allFilled}
        activeOpacity={0.8}
      >
        <Text style={s.submitText}>Submit</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🎉' : '😞'}</Text>
            <Text style={s.modalTitle}>{won ? 'Brilliant!' : 'Try Again'}</Text>
            <Text style={s.modalSub}>
              {won ? `Score: ${score}/5` : `The word was: ${puzzle.word}`}
            </Text>
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
              setRound(1);
              setScore(0);
              timer.start();
              initPuzzle();
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  round: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted, marginBottom: 8 },
  instruction: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 32 },
  slotsRow: { flexDirection: 'row', gap: 8, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' },
  slot: { width: 42, height: 52, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  slotEmpty: { borderColor: colors.divider, backgroundColor: colors.surface },
  slotFilled: { borderColor: colors.word.ink, backgroundColor: colors.word.bg },
  slotLetter: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, width: 42, textAlign: 'center' },
  scrambledRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 },
  scrambledBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: colors.word.bg, alignItems: 'center', justifyContent: 'center' },
  scrambledUsed: { backgroundColor: colors.rule, opacity: 0.4 },
  scrambledLetter: { fontFamily: fonts.black, fontSize: 22, color: colors.word.ink, width: 50, textAlign: 'center' },
  scrambledLetterUsed: { color: colors.inkMuted },
  submitBtn: { backgroundColor: colors.ink, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 999 },
  submitDisabled: { opacity: 0.35 },
  submitText: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.bg },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24, textAlign: 'center' },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
