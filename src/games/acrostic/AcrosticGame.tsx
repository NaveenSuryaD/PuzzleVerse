import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
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

// Acrostic: guess words where the first letters spell a hidden word
const PUZZLES = [
  {
    hiddenWord: 'SPRING',
    clues: [
      { clue: 'Season after winter', answer: 'SPRING' },
      { clue: 'Primary color of the sky', answer: 'PURPLE' },
      { clue: 'What flowers do in bloom', answer: 'RISE' },
      { clue: 'Opposite of push', answer: 'IN' },
      { clue: 'Baby bird sound', answer: 'NEST' },
      { clue: 'Opposite of dark', answer: 'GLOW' },
    ],
  },
  {
    hiddenWord: 'OCEAN',
    clues: [
      { clue: 'Large body of salt water', answer: 'OCEAN' },
      { clue: 'Shellfish with a pearl', answer: 'CLAM' },
      { clue: 'Underwater breathing device', answer: 'EQUIPMENT' },
      { clue: 'Boat propulsion fin', answer: 'ANCHOR' },
      { clue: "Sailor's danger: no wind", answer: 'NONE' },
    ],
  },
  {
    hiddenWord: 'BRAIN',
    clues: [
      { clue: 'Organ of thought', answer: 'BRAIN' },
      { clue: 'Reads facts and figures', answer: 'RESEARCH' },
      { clue: 'Intelligent and quick', answer: 'ASTUTE' },
      { clue: 'What thinking requires', answer: 'INSIGHT' },
      { clue: "Brain's protective casing", answer: 'NEURON' },
    ],
  },
];

interface SavedState {
  puzIdx: number;
  answers: string[];
}

export function AcrosticGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SavedState>('acrostic');

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SavedState | null>(null);

  const [puzIdx, setPuzIdx] = useState<number>(0);
  const puz = PUZZLES[puzIdx];

  const [answers, setAnswers] = useState<string[]>(() => puz.clues.map(() => ''));
  const [revealed, setRevealed] = useState<boolean[]>(puz.clues.map(() => false));
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  const s = useMemo(() => makeStyles(colors), [colors]);

  // Mount effect: load saved state
  useEffect(() => {
    load().then(result => {
      if (result.found && result.gameState) {
        setResumeElapsed(result.elapsedSeconds);
        setPendingSavedState(result.gameState);
        setShowResumeModal(true);
        timer.pause();
      } else {
        timer.start();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save effect
  useEffect(() => {
    if (!done) {
      save({ puzIdx, answers }, timer.elapsedSeconds);
    }
  }, [puzIdx, answers, done, save, timer.elapsedSeconds]);

  const handleResume = useCallback(() => {
    setShowResumeModal(false);
    if (pendingSavedState) {
      setPuzIdx(pendingSavedState.puzIdx);
      setAnswers(pendingSavedState.answers);
    }
    timer.restoreAndResume(resumeElapsed);
    setPendingSavedState(null);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    setShowResumeModal(false);
    setPendingSavedState(null);
    clear();
    setPuzIdx(0);
    setAnswers(PUZZLES[0].clues.map(() => ''));
    setRevealed(PUZZLES[0].clues.map(() => false));
    timer.start();
  }, [clear, timer]);

  useEffect(() => {
    setAnswers(puz.clues.map(() => ''));
    setRevealed(puz.clues.map(() => false));
  }, [puzIdx]);

  const finish = useCallback((w: boolean) => {
    clear();
    setWon(w);
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, timer.elapsedSeconds, clear]);

  const handleCheck = useCallback((idx: number) => {
    const ans = answers[idx].trim().toUpperCase();
    const correct = ans === puz.clues[idx].answer;
    const newRevealed = [...revealed];
    newRevealed[idx] = true;
    setRevealed(newRevealed);

    if (correct) {
      const newAnswers = [...answers];
      newAnswers[idx] = puz.clues[idx].answer;
      setAnswers(newAnswers);
      // Check if all correct
      const allCorrect = puz.clues.every((c, i) =>
        i === idx ? true : newAnswers[i] === c.answer
      );
      if (allCorrect) finish(true);
    }
  }, [answers, revealed, puz, finish]);

  // Build the acrostic word from first letters
  const acrostic = puz.clues.map((c, i) => {
    const ans = answers[i].trim().toUpperCase();
    return ans === c.answer && ans.length > 0 ? ans[0] : '_';
  }).join('');

  return (
    <ScrollView contentContainerStyle={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="✏️"
        gameName="Acrostic"
        elapsedSeconds={resumeElapsed}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.title}>Acrostic</Text>
      <Text style={s.subtitle}>Solve each clue · First letters spell a word</Text>

      <View style={s.acrosticBox}>
        {acrostic.split('').map((ch, i) => (
          <View key={i} style={[s.acrosticCell, ch !== '_' && s.acrosticCellFilled]}>
            <Text style={[s.acrosticLetter, ch !== '_' && s.acrosticLetterFilled]}>{ch}</Text>
          </View>
        ))}
      </View>

      {puz.clues.map((clue, i) => {
        const isCorrect = answers[i].trim().toUpperCase() === clue.answer;
        return (
          <View key={i} style={s.clueRow}>
            <View style={[s.letterBadge, isCorrect && s.letterBadgeCorrect]}>
              <Text style={[s.letterBadgeText, isCorrect && s.letterBadgeTextCorrect]}>
                {isCorrect ? clue.answer[0] : `${i+1}`}
              </Text>
            </View>
            <View style={s.clueInputCol}>
              <Text style={s.clueText}>{clue.clue}</Text>
              {isCorrect ? (
                <Text style={s.correctAnswer}>{clue.answer}</Text>
              ) : (
                <View style={s.inputRow}>
                  <TextInput
                    style={s.input}
                    value={answers[i]}
                    onChangeText={t => {
                      const newAns = [...answers];
                      newAns[i] = t.toUpperCase();
                      setAnswers(newAns);
                    }}
                    placeholder="Your answer..."
                    placeholderTextColor={colors.inkMuted}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity style={s.checkBtn} onPress={() => handleCheck(i)} activeOpacity={0.8}>
                    <Text style={s.checkBtnText}>✓</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        );
      })}

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '📝' : '❌'}</Text>
            <Text style={s.modalTitle}>{won ? 'Acrostic Ace!' : 'Try Again'}</Text>
            <Text style={s.modalSub}>Hidden word: {puz.hiddenWord}</Text>
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
              timer.start();
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
  subtitle: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginBottom: 16, textAlign: 'center' },
  acrosticBox: { flexDirection: 'row', gap: 4, marginBottom: 20 },
  acrosticCell: { width: 40, height: 44, borderWidth: 2, borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  acrosticCellFilled: { backgroundColor: colors.word.bg, borderColor: colors.word.ink },
  acrosticLetter: { fontFamily: fonts.black, fontSize: 20, color: colors.inkMuted },
  acrosticLetterFilled: { color: colors.word.ink },
  clueRow: { flexDirection: 'row', gap: 12, marginBottom: 16, width: '100%' },
  letterBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  letterBadgeCorrect: { backgroundColor: colors.number.bg },
  letterBadgeText: { fontFamily: fonts.black, fontSize: 14, color: colors.inkMuted },
  letterBadgeTextCorrect: { color: colors.number.ink },
  clueInputCol: { flex: 1 },
  clueText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkSoft, marginBottom: 4 },
  correctAnswer: { fontFamily: fonts.black, fontSize: 16, color: colors.success },
  inputRow: { flexDirection: 'row', gap: 6 },
  input: { flex: 1, fontFamily: fonts.bold, fontSize: 14, color: colors.ink, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  checkBtn: { backgroundColor: colors.number.bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, justifyContent: 'center' },
  checkBtnText: { fontFamily: fonts.black, fontSize: 14, color: colors.number.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
