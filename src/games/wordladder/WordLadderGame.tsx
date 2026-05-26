import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { WORD_LADDER_PUZZLES, FOUR_LETTER_WORDS } from './puzzles';
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
  puzzleIdx: number;
  ladder: string[];
}

function differsByOne(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diffs = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diffs++;
  }
  return diffs === 1;
}

export function WordLadderGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('word-ladder');

  const [puzzleIdx] = useState<number>(() => Math.floor(Math.random() * WORD_LADDER_PUZZLES.length));
  const puzzle = WORD_LADDER_PUZZLES[puzzleIdx];
  const [ladder, setLadder] = useState<string[]>([puzzle.start]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SaveState | null>(null);

  const s = useMemo(() => makeStyles(colors), [colors]);

  // Mount: load saved state
  useEffect(() => {
    load().then(result => {
      if (result.found && result.gameState) {
        setPendingSavedState(result.gameState);
        setResumeElapsed(result.elapsedSeconds);
        setShowResumeModal(true);
      } else {
        timer.start();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save on meaningful changes
  useEffect(() => {
    if (!done && timer.isRunning) {
      save({ puzzleIdx, ladder }, timer.elapsedSeconds);
    }
  }, [ladder]);

  const handleResume = useCallback(() => {
    if (!pendingSavedState) return;
    setLadder(pendingSavedState.ladder);
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    clear();
    setLadder([puzzle.start]);
    setShowResumeModal(false);
    timer.start();
  }, [clear, puzzle, timer]);

  const finish = useCallback((w: boolean) => {
    clear();
    timer.pause();
    setWon(w);
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, clear, timer]);

  const handleSubmit = useCallback(() => {
    const word = input.trim().toUpperCase();
    const lastWord = ladder[ladder.length - 1];
    if (word.length !== puzzle.start.length) {
      setError(`Must be ${puzzle.start.length} letters`);
      return;
    }
    if (!differsByOne(word, lastWord)) {
      setError('Must change exactly one letter');
      return;
    }
    if (!FOUR_LETTER_WORDS.has(word.toLowerCase())) {
      setError('Not a valid word');
      return;
    }
    if (ladder.includes(word)) {
      setError('Already used');
      return;
    }
    const newLadder = [...ladder, word];
    setLadder(newLadder);
    setInput('');
    setError('');
    if (word === puzzle.end) {
      finish(true);
    } else if (newLadder.length > 8) {
      finish(false);
    }
  }, [input, ladder, puzzle, finish]);

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="🪜"
        gameName="Word Ladder"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `${pendingSavedState.ladder.length - 1} steps taken` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <View style={s.header}>
        <View style={s.wordBox}>
          <Text style={s.wordBoxLabel}>START</Text>
          <Text style={s.wordBoxWord}>{puzzle.start}</Text>
        </View>
        <Text style={s.arrow}>→</Text>
        <View style={[s.wordBox, { backgroundColor: colors.number.bg }]}>
          <Text style={[s.wordBoxLabel, { color: colors.number.ink }]}>TARGET</Text>
          <Text style={[s.wordBoxWord, { color: colors.number.ink }]}>{puzzle.end}</Text>
        </View>
      </View>

      <Text style={s.steps}>Steps: {ladder.length - 1} / 6</Text>

      <ScrollView style={s.ladderList} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
        {ladder.map((w, i) => (
          <View key={i} style={[s.step, i === ladder.length - 1 && s.stepCurrent]}>
            <Text style={s.stepNum}>{i + 1}</Text>
            <Text style={s.stepWord}>{w}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={t => { setInput(t.toUpperCase()); setError(''); }}
          placeholder="Change one letter..."
          placeholderTextColor={colors.inkMuted}
          autoCapitalize="characters"
          maxLength={puzzle.start.length}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
        <TouchableOpacity style={s.goBtn} onPress={handleSubmit} activeOpacity={0.8}>
          <Text style={s.goBtnText}>→</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}

      <TouchableOpacity style={s.hintBtn} onPress={() => {
        if (puzzle.solution.length > ladder.length) {
          const hint = puzzle.solution[ladder.length];
          setInput(hint);
        }
      }} activeOpacity={0.8}>
        <Text style={s.hintBtnText}>Hint</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🪜' : '😔'}</Text>
            <Text style={s.modalTitle}>{won ? 'Climbed it!' : 'Too many steps'}</Text>
            <Text style={s.modalSub}>{puzzle.start} → {puzzle.end} in {ladder.length - 1} steps</Text>
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
              setLadder([puzzle.start]); setInput(''); setError('');
              timer.start();
            }}>
              <Text style={s.modalBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { flex: 1, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 },
  wordBox: { backgroundColor: colors.word.bg, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  wordBoxLabel: { fontFamily: fonts.bold, fontSize: 11, color: colors.word.ink, letterSpacing: 1 },
  wordBoxWord: { fontFamily: fonts.black, fontSize: 24, color: colors.word.ink },
  arrow: { fontFamily: fonts.black, fontSize: 24, color: colors.inkMuted },
  steps: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted, textAlign: 'center', marginBottom: 12 },
  ladderList: { flex: 1, marginBottom: 12 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: colors.surface, borderRadius: 10 },
  stepCurrent: { backgroundColor: colors.logic.bg, borderWidth: 1.5, borderColor: colors.logic.ink },
  stepNum: { fontFamily: fonts.bold, fontSize: 12, color: colors.inkMuted, width: 20 },
  stepWord: { fontFamily: fonts.black, fontSize: 20, color: colors.ink },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  input: {
    flex: 1, height: 48, backgroundColor: colors.surface, borderRadius: 12,
    paddingHorizontal: 16, fontFamily: fonts.black, fontSize: 20, color: colors.ink,
    borderWidth: 1.5, borderColor: colors.divider, textAlign: 'center', letterSpacing: 4,
  },
  goBtn: { backgroundColor: colors.ink, width: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  goBtnText: { fontFamily: fonts.extraBold, fontSize: 20, color: colors.bg },
  error: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.danger, textAlign: 'center', marginBottom: 8 },
  hintBtn: { alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider },
  hintBtnText: { fontFamily: fonts.bold, fontSize: 13, color: colors.inkSoft },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24, textAlign: 'center' },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
