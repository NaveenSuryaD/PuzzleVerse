import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme, type ThemeColors } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { generatePatterns } from './generator';
import { PatternItemView } from './PatternItem';
import * as Haptics from 'expo-haptics';

const TOTAL = 8;

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

export function PatternRecogGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [puzzles, setPuzzles] = useState(() => generatePatterns(TOTAL));
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const [done, setDone] = useState(false);

  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const puzzle = puzzles[Math.min(idx, TOTAL - 1)];

  const handleChoice = useCallback((choiceIdx: number) => {
    if (selected !== null || flash) return;
    const choice = puzzle.choices[choiceIdx];
    const isCorrect =
      choice.shape === puzzle.answer.shape &&
      choice.color === puzzle.answer.color &&
      choice.size === puzzle.answer.size &&
      choice.count === puzzle.answer.count;

    setSelected(choiceIdx);
    setFlash(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setCorrect(c => c + 1);

    setTimeout(() => {
      setFlash(null);
      setSelected(null);
      const nextIdx = idx + 1;
      if (nextIdx >= TOTAL) {
        if (completedRef.current) return;
        completedRef.current = true;
        if (timerRef.current) clearInterval(timerRef.current);
        setDone(true);
        onComplete(true, elapsedRef.current);
      } else {
        setIdx(nextIdx);
      }
    }, 600);
  }, [selected, flash, puzzle, idx, onComplete]);

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.progressText}>{idx + 1} / {TOTAL}</Text>
        <Text style={s.label}>What comes next?</Text>
      </View>

      {/* Progress dots */}
      <View style={s.dots}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <View key={i} style={[
            s.dot,
            i < idx && { backgroundColor: colors.success },
            i === idx && { backgroundColor: colors.ink },
          ]} />
        ))}
      </View>

      {/* Sequence */}
      <View style={s.seqRow}>
        {puzzle.sequence.map((item, i) => (
          <PatternItemView key={i} item={item} containerSize={60} />
        ))}
        <View style={[s.questionBox, { borderColor: colors.inkMuted }]}>
          <Text style={[s.questionMark, { color: colors.inkMuted }]}>?</Text>
        </View>
      </View>

      {/* 4 choices */}
      <View style={s.choicesGrid}>
        {puzzle.choices.map((choice, ci) => {
          const isSelected = selected === ci;
          const isCorrectChoice =
            choice.shape === puzzle.answer.shape &&
            choice.color === puzzle.answer.color &&
            choice.size === puzzle.answer.size &&
            choice.count === puzzle.answer.count;

          let borderColor = colors.rule;
          if (isSelected && flash === 'correct') borderColor = colors.success;
          if (isSelected && flash === 'wrong') borderColor = colors.danger;
          if (!isSelected && flash === 'wrong' && isCorrectChoice) borderColor = colors.success;

          return (
            <TouchableOpacity
              key={ci}
              style={[s.choiceBtn, { borderColor }]}
              onPress={() => handleChoice(ci)}
              activeOpacity={0.8}
              disabled={selected !== null}
            >
              <PatternItemView item={choice} containerSize={72} />
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={[s.trophy, { backgroundColor: colors.visual.bg }]}>
              <Text style={{ fontSize: 36 }}>🔭</Text>
            </View>
            <Text style={s.modalTitle}>Patterns Cracked!</Text>
            <View style={[s.scoreBadge, { backgroundColor: colors.visual.bg }]}>
              <Text style={[s.scoreBig, { color: colors.visual.ink }]}>{correct}/{TOTAL}</Text>
            </View>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.ink }]}
              onPress={() => {
                setDone(false);
                completedRef.current = false;
                setIdx(0);
                setSelected(null);
                setCorrect(0);
                elapsedRef.current = 0;
                setPuzzles(generatePatterns(TOTAL));
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

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', paddingTop: 16 },

  header: { alignItems: 'center', gap: 4, marginBottom: 12 },
  progressText: { fontFamily: fonts.bold, fontSize: 13, color: colors.inkMuted },
  label: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, letterSpacing: -0.4 },

  dots: { flexDirection: 'row', gap: 6, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.rule },

  seqRow: {
    flexDirection: 'row', gap: 10, alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 32,
  },
  questionBox: {
    width: 60, height: 60, borderRadius: 14,
    borderWidth: 2, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  questionMark: { fontFamily: fonts.black, fontSize: 28 },

  choicesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: 24, justifyContent: 'center',
  },
  choiceBtn: {
    borderRadius: 20, borderWidth: 2,
    backgroundColor: colors.surface,
    shadowColor: colors.ink, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },

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
  scoreBadge: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 18 },
  scoreBig: { fontFamily: fonts.black, fontSize: 32, letterSpacing: -1 },
  btn: {
    width: '100%', height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { fontFamily: fonts.extraBold, fontSize: 16 },
});
