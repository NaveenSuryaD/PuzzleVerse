import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { COMPOUND_PAIRS } from './puzzles';
import * as Haptics from 'expo-haptics';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRound(usedIndices: Set<number>) {
  const available = COMPOUND_PAIRS.map((_, i) => i).filter(i => !usedIndices.has(i));
  if (available.length === 0) return null;
  const idx = available[Math.floor(Math.random() * available.length)];
  const correct = COMPOUND_PAIRS[idx];
  const wrongs = shuffle(COMPOUND_PAIRS.filter((_, i) => i !== idx)).slice(0, 3);
  const choices = shuffle([correct.word, ...wrongs.map(w => w.word)]);
  return { idx, puzzle: correct, choices };
}

export function CompoundWordsGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [usedIndices] = useState(() => new Set<number>());
  const [current, setCurrent] = useState(() => buildRound(new Set<number>()));
  const [selected, setSelected] = useState<string | null>(null);
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

  const handleChoice = useCallback((choice: string) => {
    if (selected !== null || !current) return;
    setSelected(choice);
    const correct = choice === current.puzzle.word;
    if (correct) setScore(s => s + 1);

    setTimeout(() => {
      if (round >= 10) {
        finish(score + (correct ? 1 : 0) >= 7);
      } else {
        usedIndices.add(current.idx);
        const next = buildRound(usedIndices);
        if (next) {
          setCurrent(next);
          setRound(r => r + 1);
          setSelected(null);
        } else {
          finish(score + (correct ? 1 : 0) >= 7);
        }
      }
    }, 800);
  }, [selected, current, round, score, finish, usedIndices]);

  if (!current) return null;

  return (
    <View style={s.container}>
      <Text style={s.round}>Round {round} / 10</Text>

      <View style={s.partsRow}>
        <View style={s.partBox}>
          <Text style={s.partText}>{current.puzzle.a}</Text>
        </View>
        <Text style={s.plus}>+</Text>
        <View style={s.partBox}>
          <Text style={s.partText}>{current.puzzle.b}</Text>
        </View>
      </View>

      <Text style={s.question}>Which compound word do these parts form?</Text>

      <View style={s.choices}>
        {current.choices.map(choice => {
          let bg = colors.surface;
          let border = colors.divider;
          if (selected === choice) {
            bg = choice === current.puzzle.word ? colors.number.bg : '#FFD5D5';
            border = choice === current.puzzle.word ? colors.number.ink : colors.danger;
          } else if (selected !== null && choice === current.puzzle.word) {
            bg = colors.number.bg;
            border = colors.number.ink;
          }
          return (
            <TouchableOpacity
              key={choice}
              style={[s.choice, { backgroundColor: bg, borderColor: border }]}
              onPress={() => handleChoice(choice)}
              activeOpacity={0.8}
            >
              <Text style={s.choiceText}>{choice}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={s.scoreRow}>
        <Text style={s.scoreText}>Score: {score}</Text>
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🏆' : '📚'}</Text>
            <Text style={s.modalTitle}>{won ? 'Well Done!' : 'Keep Practicing'}</Text>
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
              completedRef.current = false;
              setRound(1);
              setScore(0);
              elapsedRef.current = 0;
              usedIndices.clear();
              const next = buildRound(usedIndices);
              setCurrent(next);
              setSelected(null);
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
  round: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted, marginBottom: 24 },
  partsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  partBox: { backgroundColor: colors.word.bg, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14 },
  partText: { fontFamily: fonts.black, fontSize: 22, color: colors.word.ink },
  plus: { fontFamily: fonts.black, fontSize: 28, color: colors.inkMuted },
  question: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24, textAlign: 'center' },
  choices: { width: '100%', gap: 12 },
  choice: { borderWidth: 2, borderRadius: 14, padding: 16, alignItems: 'center' },
  choiceText: { fontFamily: fonts.extraBold, fontSize: 18, color: colors.ink },
  scoreRow: { marginTop: 24 },
  scoreText: { fontFamily: fonts.bold, fontSize: 16, color: colors.inkMuted },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
