import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

const PUZZLES = [
  { sentence: 'ehT noom si thgirb', answer: 'The moon is bright' },
  { sentence: 'sdriB yfl hgih ni eht yks', answer: 'Birds fly high in the sky' },
  { sentence: 'ekaC si ylicised teews', answer: 'Cake is deliciously sweet' },
  { sentence: 'eviF stak tis no eht llaw', answer: 'Five cats sit on the wall' },
  { sentence: 'ehT gib der esuoh', answer: 'The big red house' },
  { sentence: 'taeJ sgnirb yas mottob', answer: 'Jets bring sky bottom' },
  { sentence: 'raB fo dloG si doog', answer: 'Bar of Gold is good' },
  { sentence: 'pots eht kcolc', answer: 'stop the clock' },
];

export function BackwardsWordsGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
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

  const current = PUZZLES[round % PUZZLES.length];

  const handleSubmit = useCallback(() => {
    const correct = input.trim().toLowerCase() === current.answer.toLowerCase();
    setResult(correct ? 'correct' : 'wrong');
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (round + 1 >= 5) {
        finish(score + (correct ? 1 : 0) >= 3);
      } else {
        setRound(r => r + 1);
        setInput('');
        setResult(null);
      }
    }, 800);
  }, [input, current, round, score, finish]);

  return (
    <View style={s.container}>
      <Text style={s.round}>Round {round + 1} / 5  ·  Score: {score}</Text>
      <Text style={s.instruction}>Each word is spelled backwards. Type the correct sentence:</Text>

      <View style={s.puzzleBox}>
        <Text style={s.puzzleText}>{current.sentence}</Text>
      </View>

      <TextInput
        style={[s.input, result === 'correct' && { borderColor: colors.success }, result === 'wrong' && { borderColor: colors.danger }]}
        value={input}
        onChangeText={setInput}
        placeholder="Type the correct sentence..."
        placeholderTextColor={colors.inkMuted}
        autoCapitalize="sentences"
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        editable={result === null}
      />

      {result && (
        <Text style={[s.resultText, { color: result === 'correct' ? colors.success : colors.danger }]}>
          {result === 'correct' ? '✓ Correct!' : `✗ Answer: ${current.answer}`}
        </Text>
      )}

      <TouchableOpacity style={[s.submitBtn, result !== null && { opacity: 0.5 }]} onPress={handleSubmit} disabled={result !== null} activeOpacity={0.8}>
        <Text style={s.submitBtnText}>Submit</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🔄' : '📝'}</Text>
            <Text style={s.modalTitle}>{won ? 'Decoded!' : 'Keep Trying'}</Text>
            <Text style={s.modalSub}>Score: {score} / 5</Text>
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
              setRound(0); setScore(0); setInput(''); setResult(null);
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  round: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted, marginBottom: 12 },
  instruction: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.inkMuted, marginBottom: 16, textAlign: 'center' },
  puzzleBox: { backgroundColor: colors.surface2, padding: 20, borderRadius: 16, marginBottom: 24, width: '100%' },
  puzzleText: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink, textAlign: 'center', letterSpacing: 1 },
  input: { width: '100%', height: 52, backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16, fontFamily: fonts.semiBold, fontSize: 16, color: colors.ink, borderWidth: 1.5, borderColor: colors.divider, marginBottom: 8 },
  resultText: { fontFamily: fonts.bold, fontSize: 14, marginBottom: 12, textAlign: 'center' },
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
