import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';
import { useSaveGame } from '../../utils/gameSave';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  savedStateJSON?: string;
}

// Word Parts: combine prefix + root + suffix to form a word
const QUESTIONS = [
  {
    parts: ['PRE', 'DICT', 'ION'],
    blanks: ['?', 'DICT', '?'],
    choices: { prefix: ['PRE','MIS','UN','RE'], suffix: ['ION','ING','ED','LY'] },
    answer: { prefix: 'PRE', suffix: 'ION' },
    result: 'PREDICTION',
  },
  {
    parts: ['UN', 'BREAK', 'ABLE'],
    blanks: ['?', 'BREAK', '?'],
    choices: { prefix: ['UN','RE','PRE','DIS'], suffix: ['ABLE','NESS','MENT','LY'] },
    answer: { prefix: 'UN', suffix: 'ABLE' },
    result: 'UNBREAKABLE',
  },
  {
    parts: ['RE', 'PLACE', 'MENT'],
    blanks: ['?', 'PLACE', '?'],
    choices: { prefix: ['RE','UN','MIS','IN'], suffix: ['MENT','NESS','LY','ABLE'] },
    answer: { prefix: 'RE', suffix: 'MENT' },
    result: 'REPLACEMENT',
  },
  {
    parts: ['MIS', 'UNDER', 'STAND'],
    blanks: ['?', 'UNDERSTAND', ''],
    choices: { prefix: ['MIS','UN','PRE','IM'], suffix: ['','ING','S','ER'] },
    answer: { prefix: 'MIS', suffix: '' },
    result: 'MISUNDERSTAND',
  },
  {
    parts: ['IM', 'POSSI', 'BLE'],
    blanks: ['?', 'POSSI', '?'],
    choices: { prefix: ['IM','UN','DIS','IN'], suffix: ['BLE','NESS','LY','MENT'] },
    answer: { prefix: 'IM', suffix: 'BLE' },
    result: 'IMPOSSIBLE',
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function WordPartsGame({ onComplete, onBack, savedStateJSON }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => { try { return savedStateJSON ? JSON.parse(savedStateJSON) : null; } catch { return null; } }, []);
  const [questions] = useState<typeof QUESTIONS[0][]>(() => saved?.questions ?? shuffle([...QUESTIONS]).slice(0, 5));
  const [round, setRound] = useState<number>(() => saved?.round ?? 0);
  const [score, setScore] = useState<number>(() => saved?.score ?? 0);
  const [selectedPrefix, setSelectedPrefix] = useState<string | null>(null);
  const [selectedSuffix, setSelectedSuffix] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  useSaveGame('word-parts', () => ({ questions, round, score }), !done, [round], elapsedRef);
  const s = useMemo(() => makeStyles(colors), [colors]);
  const current = questions[round];

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

  const handleCheck = useCallback(() => {
    if (!selectedPrefix || selectedSuffix === null || checked) return;
    setChecked(true);
    const correct = selectedPrefix === current.answer.prefix && selectedSuffix === current.answer.suffix;
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (round + 1 >= questions.length) {
        finish(score + (correct ? 1 : 0) >= 4);
      } else {
        setRound(r => r + 1);
        setSelectedPrefix(null);
        setSelectedSuffix(null);
        setChecked(false);
      }
    }, 1000);
  }, [selectedPrefix, selectedSuffix, checked, current, round, score, questions.length, finish]);

  if (!current) return null;

  const root = current.parts[1];
  const preview = (selectedPrefix || '?') + root + (selectedSuffix !== null ? selectedSuffix : '?');

  return (
    <View style={s.container}>
      <Text style={s.round}>Round {round+1} / {questions.length}  ·  Score: {score}</Text>
      <Text style={s.instruction}>Build the word by selecting prefix and suffix</Text>

      <View style={s.previewBox}>
        <Text style={s.preview}>{preview}</Text>
      </View>

      <View style={s.rootBox}>
        <Text style={s.rootLabel}>Root word:</Text>
        <Text style={s.root}>{root}</Text>
      </View>

      <View style={s.section}>
        <Text style={s.sectionLabel}>Prefix</Text>
        <View style={s.optionRow}>
          {current.choices.prefix.map(p => (
            <TouchableOpacity
              key={p}
              style={[s.option, selectedPrefix===p && s.optionSelected]}
              onPress={() => !checked && setSelectedPrefix(p)}
              activeOpacity={0.8}
            >
              <Text style={[s.optionText, selectedPrefix===p && s.optionTextSelected]}>{p || '(none)'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionLabel}>Suffix</Text>
        <View style={s.optionRow}>
          {current.choices.suffix.map(sf => (
            <TouchableOpacity
              key={sf || '_none'}
              style={[s.option, selectedSuffix===sf && s.optionSelected]}
              onPress={() => !checked && setSelectedSuffix(sf)}
              activeOpacity={0.8}
            >
              <Text style={[s.optionText, selectedSuffix===sf && s.optionTextSelected]}>{sf || '(none)'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {checked && (
        <Text style={[s.feedback, selectedPrefix===current.answer.prefix&&selectedSuffix===current.answer.suffix ? s.correct : s.wrong]}>
          {selectedPrefix===current.answer.prefix&&selectedSuffix===current.answer.suffix ? `Correct! ${current.result}` : `Answer: ${current.result}`}
        </Text>
      )}

      <TouchableOpacity
        style={[s.checkBtn, (!selectedPrefix || selectedSuffix === null || checked) && s.checkBtnDisabled]}
        onPress={handleCheck}
        activeOpacity={0.8}
      >
        <Text style={s.checkBtnText}>Check</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🔤' : '📖'}</Text>
            <Text style={s.modalTitle}>{won ? 'Word Architect!' : 'Keep Building'}</Text>
            <Text style={s.modalSub}>Score: {score} / {questions.length}</Text>
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
              setRound(0); setScore(0); setSelectedPrefix(null); setSelectedSuffix(null); setChecked(false);
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
  instruction: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 16, textAlign: 'center' },
  previewBox: { backgroundColor: colors.classic.bg, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16, marginBottom: 12 },
  preview: { fontFamily: fonts.black, fontSize: 22, color: colors.classic.ink, letterSpacing: 1 },
  rootBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  rootLabel: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted },
  root: { fontFamily: fonts.black, fontSize: 18, color: colors.ink, backgroundColor: colors.surface2, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  section: { width: '100%', marginBottom: 16 },
  sectionLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.inkMuted, marginBottom: 8 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 2, borderColor: colors.divider, backgroundColor: colors.surface },
  optionSelected: { backgroundColor: colors.word.bg, borderColor: colors.word.ink },
  optionText: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  optionTextSelected: { color: colors.word.ink },
  feedback: { fontFamily: fonts.bold, fontSize: 14, marginBottom: 12 },
  correct: { color: colors.success },
  wrong: { color: colors.danger },
  checkBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  checkBtnDisabled: { opacity: 0.4 },
  checkBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
