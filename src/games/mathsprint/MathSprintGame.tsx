import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions,
} from 'react-native';
import { useTheme, type ThemeColors } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { generateQuestions } from './generator';
import type { Question } from './types';
import * as Haptics from 'expo-haptics';
import { playSound } from '../../audio/sounds';

type Difficulty = 'easy' | 'medium' | 'hard';

const { width: SCREEN_W } = Dimensions.get('window');
const PAD_KEYS = ['7','8','9','4','5','6','1','2','3','⌫','0','✓'];
const PENALTY = 10;

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

export function MathSprintGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [questions, setQuestions] = useState(() => generateQuestions('medium'));
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const [done, setDone] = useState(false);

  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setDone(true);
    playSound('win');
    onComplete(true, elapsedRef.current);
  }, [onComplete]);

  const submit = useCallback(() => {
    if (!input) return;
    const q = questions[idx];
    const userAns = parseInt(input, 10);
    if (userAns === q.answer) {
      setCorrect(c => c + 1);
      setFlash('correct');
      playSound('correct');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setWrong(w => w + 1);
      elapsedRef.current += PENALTY;
      setFlash('wrong');
      playSound('absent');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setTimeout(() => setFlash(null), 350);
    setInput('');
    if (idx + 1 >= questions.length) {
      setTimeout(finish, 400);
    } else {
      setIdx(i => i + 1);
    }
  }, [input, idx, questions, finish]);

  const pressKey = useCallback((key: string) => {
    if (key === '⌫') {
      setInput(p => p.slice(0, -1));
    } else if (key === '✓') {
      submit();
    } else if (input.length < 5) {
      setInput(p => p + key);
    }
  }, [input, submit]);

  const q: Question = questions[Math.min(idx, questions.length - 1)];
  const progress = idx / questions.length;

  const flashBg = flash === 'correct' ? colors.success
    : flash === 'wrong' ? colors.danger
    : 'transparent';

  return (
    <View style={s.root}>
      {/* Progress bar */}
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${progress * 100}%` as any, backgroundColor: colors.number.ink }]} />
      </View>

      {/* Score row */}
      <View style={s.scoreRow}>
        <View style={[s.scorePill, { backgroundColor: colors.number.bg }]}>
          <Text style={[s.scoreNum, { color: colors.number.ink }]}>{correct}</Text>
          <Text style={[s.scoreLabel, { color: colors.number.ink }]}>correct</Text>
        </View>
        <Text style={s.counter}>{idx + 1} / {questions.length}</Text>
        <View style={[s.scorePill, { backgroundColor: colors.word.bg }]}>
          <Text style={[s.scoreNum, { color: colors.word.ink }]}>{wrong}</Text>
          <Text style={[s.scoreLabel, { color: colors.word.ink }]}>wrong</Text>
        </View>
      </View>

      {/* Question card */}
      <View style={[s.card, flash && { backgroundColor: flashBg + '33' }]}>
        <Text style={s.question}>{q.a} {q.op} {q.b} =</Text>
        <Text style={[s.inputDisplay, !input && s.inputPlaceholder]}>
          {input || '?'}
        </Text>
      </View>

      {/* Number pad */}
      <View style={s.pad}>
        {PAD_KEYS.map(key => (
          <TouchableOpacity
            key={key}
            style={[
              s.padKey,
              key === '✓' && { backgroundColor: colors.number.bg },
              key === '⌫' && { backgroundColor: colors.surface },
            ]}
            onPress={() => pressKey(key)}
            activeOpacity={0.7}
          >
            <Text style={[
              s.padKeyText,
              key === '✓' && { color: colors.number.ink, fontSize: 20 },
            ]}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Done modal */}
      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={[s.trophy, { backgroundColor: colors.number.bg }]}>
              <Text style={{ fontSize: 36 }}>⚡</Text>
            </View>
            <Text style={s.modalTitle}>Sprint Complete!</Text>
            <View style={s.resultRow}>
              <View style={[s.resultTile, { backgroundColor: colors.number.bg }]}>
                <Text style={[s.resultBig, { color: colors.number.ink }]}>{correct}</Text>
                <Text style={[s.resultLabel, { color: colors.number.ink }]}>Correct</Text>
              </View>
              <View style={[s.resultTile, { backgroundColor: colors.word.bg }]}>
                <Text style={[s.resultBig, { color: colors.word.ink }]}>{wrong}</Text>
                <Text style={[s.resultLabel, { color: colors.word.ink }]}>Wrong</Text>
              </View>
              <View style={[s.resultTile, { backgroundColor: colors.logic.bg }]}>
                <Text style={[s.resultBig, { color: colors.logic.ink }]}>
                  {Math.round((correct / questions.length) * 100)}%
                </Text>
                <Text style={[s.resultLabel, { color: colors.logic.ink }]}>Score</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.ink }]}
              onPress={() => {
                setDone(false);
                completedRef.current = false;
                setIdx(0);
                setInput('');
                setCorrect(0);
                setWrong(0);
                elapsedRef.current = 0;
                setQuestions(generateQuestions(difficulty));
                timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
              }}
              activeOpacity={0.8}
            >
              <Text style={[s.btnText, { color: colors.bg }]}>Play Again</Text>
            </TouchableOpacity>
            {onBack && (
              <TouchableOpacity
                style={[s.btn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 8 }]}
                onPress={onBack}
                activeOpacity={0.8}
              >
                <Text style={[s.btnText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => {
  const KEY_W = (SCREEN_W - 32 - 8) / 3;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },

    progressTrack: { height: 4, backgroundColor: colors.rule, marginHorizontal: 22, marginTop: 8, borderRadius: 2 },
    progressFill: { height: 4, borderRadius: 2 },

    scoreRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 22, marginTop: 14,
    },
    scorePill: {
      paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14,
      alignItems: 'center', minWidth: 70,
    },
    scoreNum: { fontFamily: fonts.black, fontSize: 20 },
    scoreLabel: { fontFamily: fonts.bold, fontSize: 11 },
    counter: { fontFamily: fonts.extraBold, fontSize: 14, color: colors.inkMuted },

    card: {
      marginHorizontal: 22, marginTop: 20,
      backgroundColor: colors.surface, borderRadius: 28,
      paddingVertical: 32, paddingHorizontal: 24,
      alignItems: 'center', gap: 12,
      shadowColor: colors.ink, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
    },
    question: {
      fontFamily: fonts.black, fontSize: 36, color: colors.ink,
      letterSpacing: -1,
    },
    inputDisplay: {
      fontFamily: fonts.black, fontSize: 48, color: colors.ink,
      letterSpacing: -1, minWidth: 80, textAlign: 'center',
    },
    inputPlaceholder: { color: colors.inkMuted },

    pad: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 4,
      paddingHorizontal: 16, marginTop: 24,
    },
    padKey: {
      width: KEY_W, height: KEY_W * 0.65, borderRadius: 14,
      backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
      shadowColor: colors.ink, shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
    },
    padKeyText: { fontFamily: fonts.extraBold, fontSize: 22, color: colors.ink },

    overlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    },
    modal: {
      width: '100%', backgroundColor: colors.surface,
      borderRadius: 28, padding: 28, alignItems: 'center', gap: 16,
    },
    trophy: {
      width: 72, height: 72, borderRadius: 36,
      alignItems: 'center', justifyContent: 'center',
    },
    modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, letterSpacing: -0.5 },
    resultRow: { flexDirection: 'row', gap: 8, width: '100%' },
    resultTile: {
      flex: 1, borderRadius: 18, paddingVertical: 14, alignItems: 'center', gap: 4,
    },
    resultBig: { fontFamily: fonts.black, fontSize: 24 },
    resultLabel: { fontFamily: fonts.bold, fontSize: 11 },
    btn: {
      width: '100%', height: 52, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center',
    },
    btnText: { fontFamily: fonts.extraBold, fontSize: 16 },
  });
};
