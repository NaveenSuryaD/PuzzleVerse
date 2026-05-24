import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

// Daily Challenge: a rotating set of mini challenges (one per "day")
// Uses date-based seed to pick challenge
const CHALLENGES = [
  {
    type: 'wordscramble',
    title: 'Word Scramble',
    prompt: 'Unscramble this word:',
    scrambled: 'LEPAHENT',
    answer: 'ELEPHANT',
    choices: ['ELEPHANT','TELEFONE','PHANTELE','ELEHPANT'],
  },
  {
    type: 'mathold',
    title: 'Math Challenge',
    prompt: 'Solve: 17 × 8 - 36 =',
    answer: '100',
    choices: ['98','100','102','96'],
  },
  {
    type: 'trivia',
    title: 'Trivia Time',
    prompt: 'What is the chemical symbol for Gold?',
    answer: 'Au',
    choices: ['Au','Go','Gd','AG'],
  },
  {
    type: 'wordscramble',
    title: 'Word Scramble',
    prompt: 'Unscramble this word:',
    scrambled: 'TBURIFTELY',
    answer: 'BUTTERFLY',
    choices: ['BUTTERFLY','FLUTTERBY','BUTTERFYL','BURTLEFLY'],
  },
  {
    type: 'trivia',
    title: 'Trivia Time',
    prompt: 'How many sides does a hexagon have?',
    answer: '6',
    choices: ['5','6','7','8'],
  },
  {
    type: 'mathold',
    title: 'Math Challenge',
    prompt: 'Solve: √144 + 5² =',
    answer: '37',
    choices: ['35','36','37','38'],
  },
  {
    type: 'trivia',
    title: 'Trivia Time',
    prompt: 'Which planet is closest to the Sun?',
    answer: 'Mercury',
    choices: ['Mercury','Venus','Mars','Earth'],
  },
];

export function DailyChallengeGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // Use day-of-year as seed to pick challenge
  const challengeIdx = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return dayOfYear % CHALLENGES.length;
  }, []);

  const challenge = CHALLENGES[challengeIdx];

  const [chosen, setChosen] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);

  const totalRounds = 3;
  const currentChallenge = CHALLENGES[(challengeIdx + round) % CHALLENGES.length];

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

  const handleChoice = useCallback((choice: string) => {
    if (chosen !== null) return;
    setChosen(choice);
    const correct = choice === currentChallenge.answer;
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (round + 1 >= totalRounds) {
        finish(score + (correct ? 1 : 0) >= 2);
      } else {
        setRound(r => r + 1);
        setChosen(null);
      }
    }, 900);
  }, [chosen, currentChallenge, round, score, finish]);

  const typeIcon = currentChallenge.type === 'trivia' ? '🧠' :
    currentChallenge.type === 'mathold' ? '🔢' : '🔤';

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.title}>Daily Challenge</Text>
      <Text style={s.subtitle}>3 mixed mini-challenges · Fresh every day</Text>

      <View style={s.header}>
        <Text style={s.dayText}>Challenge {round+1} / {totalRounds}</Text>
        <Text style={s.scoreText}>Score: {score}</Text>
      </View>

      <View style={s.challengeCard}>
        <Text style={s.typeIcon}>{typeIcon}</Text>
        <Text style={s.challengeTitle}>{currentChallenge.title}</Text>
        <Text style={s.challengePrompt}>{currentChallenge.prompt}</Text>
        {currentChallenge.scrambled && (
          <View style={s.scrambledBox}>
            <Text style={s.scrambledText}>{currentChallenge.scrambled}</Text>
          </View>
        )}
      </View>

      <View style={s.choices}>
        {currentChallenge.choices.map(ch => {
          let bg = colors.surface;
          let border = colors.divider;
          if (chosen === ch) {
            bg = ch === currentChallenge.answer ? colors.number.bg : '#FFE0E0';
            border = ch === currentChallenge.answer ? colors.number.ink : colors.danger;
          } else if (chosen !== null && ch === currentChallenge.answer) {
            bg = colors.number.bg;
            border = colors.number.ink;
          }
          return (
            <TouchableOpacity
              key={ch}
              style={[s.choice, { backgroundColor: bg, borderColor: border }]}
              onPress={() => handleChoice(ch)}
              activeOpacity={0.8}
            >
              <Text style={s.choiceText}>{ch}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🌟' : '📅'}</Text>
            <Text style={s.modalTitle}>{won ? 'Challenge Complete!' : 'Come Back Tomorrow'}</Text>
            <Text style={s.modalSub}>Score: {score} / {totalRounds}</Text>
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
              setRound(0); setScore(0); setChosen(null);
              elapsedRef.current = 0;
              timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
            }}>
              <Text style={s.modalBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { alignItems: 'center', padding: 24, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginBottom: 16, textAlign: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 16 },
  dayText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted },
  scoreText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted },
  challengeCard: { backgroundColor: colors.logic.bg, borderRadius: 20, padding: 24, alignItems: 'center', width: '100%', marginBottom: 24 },
  typeIcon: { fontSize: 40, marginBottom: 8 },
  challengeTitle: { fontFamily: fonts.black, fontSize: 18, color: colors.logic.ink, marginBottom: 8 },
  challengePrompt: { fontFamily: fonts.bold, fontSize: 15, color: colors.logic.ink, textAlign: 'center' },
  scrambledBox: { backgroundColor: colors.logic.soft, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 12 },
  scrambledText: { fontFamily: fonts.black, fontSize: 24, color: colors.logic.ink, letterSpacing: 3 },
  choices: { width: '100%', gap: 10 },
  choice: { borderWidth: 2, borderRadius: 12, padding: 14, alignItems: 'center' },
  choiceText: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 8, textAlign: 'center' },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
