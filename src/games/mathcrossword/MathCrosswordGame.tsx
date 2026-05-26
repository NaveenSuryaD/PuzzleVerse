import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
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

interface SaveState {
  answers: Record<number, number | null>;
}

// Curated self-contained math crossword puzzles
const PUZZLES = [
  {
    name: 'Puzzle 1',
    // Format: rows of [a, op, b, '=', c]
    rows: [
      { a: 3, op: '+', b: 4, eq: 7 },
      { a: 6, op: '-', b: 2, eq: 4 },
      { a: 5, op: '*', b: 2, eq: 10 },
    ],
    cols: [
      { a: 3, op: '+', b: 6, eq: 9 },
      { a: 4, op: '-', b: 2, eq: 2 },
      { a: 7, op: '+', b: 4, eq: 11 },
    ],
    questions: [
      { label: '1→ 3 + ? = 7', answer: 4 },
      { label: '2→ 6 - ? = 4', answer: 2 },
      { label: '3→ 5 × ? = 10', answer: 2 },
      { label: '4↓ 3 + ? = 9', answer: 6 },
      { label: '5↓ ? - 2 = 2', answer: 4 },
    ],
  },
];

export function MathCrosswordGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('math-crossword');

  const puzzle = PUZZLES[0];
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [selected, setSelected] = useState<number | null>(null);
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
      save({ answers }, timer.elapsedSeconds);
    }
  }, [answers]);

  const handleResume = useCallback(() => {
    if (!pendingSavedState) return;
    setAnswers(pendingSavedState.answers);
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    clear();
    setAnswers({});
    setShowResumeModal(false);
    timer.start();
  }, [clear, timer]);

  const finish = useCallback((w: boolean) => {
    clear();
    timer.pause();
    setWon(w);
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, clear, timer]);

  const checkSolved = useCallback((ans: Record<number, number | null>) => {
    const allCorrect = puzzle.questions.every((q, i) => ans[i] === q.answer);
    if (allCorrect) finish(true);
  }, [puzzle, finish]);

  const handleNumpad = useCallback((n: number) => {
    if (selected === null) return;
    setAnswers(prev => {
      const next = { ...prev, [selected]: n };
      checkSolved(next);
      return next;
    });
  }, [selected, checkSolved]);

  return (
    <ScrollView contentContainerStyle={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="➕"
        gameName="Math Crossword"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `${Object.keys(pendingSavedState.answers).length} / ${puzzle.questions.length} answered` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.title}>Math Crossword</Text>
      <Text style={s.subtitle}>Fill in the missing numbers</Text>

      {puzzle.questions.map((q, i) => {
        const ans = answers[i];
        const isSel = selected === i;
        const isCorrect = ans === q.answer;
        return (
          <TouchableOpacity
            key={i}
            style={[s.row, isSel && s.rowSelected]}
            onPress={() => setSelected(i)}
            activeOpacity={0.8}
          >
            <Text style={s.clue}>{q.label}</Text>
            <View style={[s.answerBox, isCorrect && { borderColor: colors.success, backgroundColor: colors.number.bg }]}>
              <Text style={s.answerText}>{ans !== null && ans !== undefined ? String(ans) : '?'}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={s.numpad}>
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
          <TouchableOpacity key={n} style={s.numBtn} onPress={() => handleNumpad(n)} activeOpacity={0.7}>
            <Text style={s.numBtnText}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.checkBtn} onPress={() => checkSolved(answers)} activeOpacity={0.8}>
        <Text style={s.checkBtnText}>Check Answers</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '➕' : '🔢'}</Text>
            <Text style={s.modalTitle}>{won ? 'Perfect!' : 'Keep Trying'}</Text>
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
              setAnswers({}); setSelected(null);
              timer.start();
            }}>
              <Text style={s.modalBtnText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { alignItems: 'center', padding: 24, paddingBottom: 40 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: 14, marginBottom: 10, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1.5, borderColor: colors.divider },
  rowSelected: { borderColor: colors.logic.ink, backgroundColor: colors.logic.bg },
  clue: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.ink, flex: 1 },
  answerBox: { width: 48, height: 48, borderWidth: 2, borderColor: colors.divider, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  answerText: { fontFamily: fonts.black, fontSize: 20, color: colors.ink },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: 240, justifyContent: 'center', marginTop: 20, marginBottom: 16 },
  numBtn: { width: 56, height: 48, backgroundColor: colors.surface, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.divider },
  numBtnText: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.ink },
  checkBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  checkBtnText: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.bg },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
