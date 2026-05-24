import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { HIDDEN_WORD_PUZZLES } from './puzzles';
import * as Haptics from 'expo-haptics';
import { useSaveGame } from '../../utils/gameSave';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  savedStateJSON?: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function HiddenWordsGame({ onComplete, onBack, savedStateJSON }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => { try { return savedStateJSON ? JSON.parse(savedStateJSON) : null; } catch { return null; } }, []);
  const [puzzles] = useState<typeof HIDDEN_WORD_PUZZLES>(() => saved?.puzzles ?? shuffle([...HIDDEN_WORD_PUZZLES]).slice(0, 10));
  const [round, setRound] = useState<number>(() => saved?.round ?? 0);
  const [score, setScore] = useState<number>(() => saved?.score ?? 0);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  useSaveGame('hidden-words', () => ({ puzzles, round, score }), !done, [round], elapsedRef);
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

  const current = puzzles[round];
  const choices = useMemo(() => {
    if (!current) return [];
    return shuffle([current.hiddenWord, ...current.wrongChoices]);
  }, [current]);

  const handleChoice = useCallback((choice: string) => {
    if (selected !== null || !current) return;
    setSelected(choice);
    const correct = choice === current.hiddenWord;
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (round + 1 >= 10) {
        finish(score + (correct ? 1 : 0) >= 7);
      } else {
        setRound(r => r + 1);
        setSelected(null);
      }
    }, 800);
  }, [selected, current, round, score, finish]);

  if (!current) return null;

  // Highlight the hidden word within the long word
  const lwLower = current.longWord;
  const hwLower = current.hiddenWord;
  const startIdx = lwLower.indexOf(hwLower);

  return (
    <View style={s.container}>
      <Text style={s.round}>Round {round + 1} / 10  ·  Score: {score}</Text>
      <Text style={s.instruction}>Find the hidden word inside:</Text>

      <View style={s.longWordBox}>
        <Text style={s.longWordText}>
          {lwLower.split('').map((ch, i) => (
            <Text
              key={i}
              style={[
                s.longWordChar,
                i >= startIdx && i < startIdx + hwLower.length && s.highlight,
              ]}
            >
              {ch}
            </Text>
          ))}
        </Text>
      </View>

      <Text style={s.question}>Which shorter word is hidden inside?</Text>

      <View style={s.choices}>
        {choices.map(choice => {
          let bg = colors.surface;
          let border = colors.divider;
          if (selected === choice) {
            bg = choice === current.hiddenWord ? colors.number.bg : '#FFE0E0';
            border = choice === current.hiddenWord ? colors.number.ink : colors.danger;
          } else if (selected !== null && choice === current.hiddenWord) {
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

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🔍' : '📖'}</Text>
            <Text style={s.modalTitle}>{won ? 'Sharp Eye!' : 'Keep Looking'}</Text>
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
              setDone(false); completedRef.current = false;
              setRound(0); setScore(0); setSelected(null);
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
  round: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted, marginBottom: 16 },
  instruction: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 12 },
  longWordBox: { backgroundColor: colors.word.bg, paddingHorizontal: 24, paddingVertical: 18, borderRadius: 16, marginBottom: 16 },
  longWordText: { flexDirection: 'row' },
  longWordChar: { fontFamily: fonts.black, fontSize: 28, color: colors.word.ink },
  highlight: { color: colors.danger, textDecorationLine: 'underline' },
  question: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.inkMuted, marginBottom: 24 },
  choices: { width: '100%', gap: 12 },
  choice: { borderWidth: 2, borderRadius: 14, padding: 14, alignItems: 'center' },
  choiceText: { fontFamily: fonts.extraBold, fontSize: 18, color: colors.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
