import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
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

const QUOTES = [
  { quote: 'Be the ___ you wish to see in the world', missing: 'change', author: 'Gandhi' },
  { quote: 'In the middle of every difficulty lies ___', missing: 'opportunity', author: 'Einstein' },
  { quote: 'Stay hungry, stay ___', missing: 'foolish', author: 'Steve Jobs' },
  { quote: 'To be or not to be, that is the ___', missing: 'question', author: 'Shakespeare' },
  { quote: 'All that glitters is not ___', missing: 'gold', author: 'Shakespeare' },
  { quote: 'Ask not what your country can do for ___', missing: 'you', author: 'JFK' },
  { quote: 'I have a ___', missing: 'dream', author: 'Martin Luther King' },
  { quote: 'Float like a butterfly, sting like a ___', missing: 'bee', author: 'Ali' },
  { quote: 'That\'s one small step for man, one giant leap for ___', missing: 'mankind', author: 'Armstrong' },
  { quote: 'Elementary, my dear ___', missing: 'Watson', author: 'Sherlock Holmes' },
];

interface SaveState {
  round: number;
  score: number;
}

export function QuoteGuessGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('quote-guess');

  const [round, setRound] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
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
      save({ round, score }, timer.elapsedSeconds);
    }
  }, [round, score, timer.elapsedSeconds, done, showResumeModal, save]);

  const handleResume = useCallback(() => {
    if (pendingSavedState) {
      setRound(pendingSavedState.round);
      setScore(pendingSavedState.score);
    }
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    clear();
    setRound(0);
    setScore(0);
    setInput('');
    setResult(null);
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

  const current = QUOTES[round % QUOTES.length];

  const handleSubmit = useCallback(() => {
    if (result !== null) return;
    const correct = input.trim().toLowerCase() === current.missing.toLowerCase();
    setResult(correct ? 'correct' : 'wrong');
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (round + 1 >= 10) {
        finish(score + (correct ? 1 : 0) >= 6);
      } else {
        setRound(r => r + 1);
        setInput('');
        setResult(null);
      }
    }, 900);
  }, [input, current, result, round, score, finish]);

  const parts = current.quote.split('___');

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="💬"
        gameName="Quote Guess"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `Round ${pendingSavedState.round + 1} · Score ${pendingSavedState.score}` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.round}>Round {round + 1} / 10  ·  Score: {score}</Text>
      <Text style={s.instruction}>Fill in the missing word:</Text>

      <View style={s.quoteBox}>
        <Text style={s.quoteText}>"{parts[0]}<Text style={s.blank}>___</Text>{parts[1]}"</Text>
        <Text style={s.author}>— {current.author}</Text>
      </View>

      <TextInput
        style={[s.input, result === 'correct' && { borderColor: colors.success }, result === 'wrong' && { borderColor: colors.danger }]}
        value={input}
        onChangeText={setInput}
        placeholder="Missing word..."
        placeholderTextColor={colors.inkMuted}
        autoCapitalize="none"
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        editable={result === null}
      />
      {result && (
        <Text style={[s.result, { color: result === 'correct' ? colors.success : colors.danger }]}>
          {result === 'correct' ? '✓ Correct!' : `✗ Answer: ${current.missing}`}
        </Text>
      )}

      <TouchableOpacity style={[s.submitBtn, result !== null && { opacity: 0.4 }]} onPress={handleSubmit} disabled={result !== null} activeOpacity={0.8}>
        <Text style={s.submitBtnText}>Submit</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '💬' : '📚'}</Text>
            <Text style={s.modalTitle}>{won ? 'Quote Master!' : 'Keep Reading'}</Text>
            <Text style={s.modalSub}>Score: {score} / 10</Text>
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
              setRound(0); setScore(0); setInput(''); setResult(null);
              timer.start();
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
  round: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted, marginBottom: 12 },
  instruction: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 16 },
  quoteBox: { backgroundColor: colors.surface2, borderRadius: 16, padding: 20, marginBottom: 20, width: '100%' },
  quoteText: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink, textAlign: 'center', lineHeight: 26 },
  blank: { color: colors.danger, fontFamily: fonts.black },
  author: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, textAlign: 'right', marginTop: 8 },
  input: { width: '100%', height: 52, backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16, fontFamily: fonts.semiBold, fontSize: 16, color: colors.ink, borderWidth: 1.5, borderColor: colors.divider, marginBottom: 8, textAlign: 'center' },
  result: { fontFamily: fonts.bold, fontSize: 14, marginBottom: 12, textAlign: 'center' },
  submitBtn: { backgroundColor: colors.ink, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 999 },
  submitBtnText: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.bg },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
