import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
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

const VOCAB = [
  { word: 'SERENDIPITY', def: 'Finding something good without looking for it' },
  { word: 'EPHEMERAL', def: 'Lasting for a very short time' },
  { word: 'LOQUACIOUS', def: 'Tending to talk a great deal' },
  { word: 'UBIQUITOUS', def: 'Present everywhere at the same time' },
  { word: 'MELLIFLUOUS', def: 'Sweet or musical; pleasant to hear' },
  { word: 'PERSPICACIOUS', def: 'Having a ready insight into things; shrewd' },
  { word: 'SAGACIOUS', def: 'Having or showing good judgment' },
  { word: 'SYCOPHANT', def: 'A person who flatters to gain favor' },
  { word: 'TACITURN', def: 'Reserved or uncommunicative in speech' },
  { word: 'VENERATE', def: 'To regard with great respect' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface SaveState {
  questions: typeof VOCAB;
  round: number;
  score: number;
}

export function VocabBuilderGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('vocab-builder');

  const [questions, setQuestions] = useState<typeof VOCAB>(() => shuffle([...VOCAB]).slice(0, 10));
  const [round, setRound] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selected, setSelected] = useState<string | null>(null);
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
      save({ questions, round, score }, timer.elapsedSeconds);
    }
  }, [round, score, timer.elapsedSeconds, done, showResumeModal, save, questions]);

  const handleResume = useCallback(() => {
    if (pendingSavedState) {
      setQuestions(pendingSavedState.questions);
      setRound(pendingSavedState.round);
      setScore(pendingSavedState.score);
    }
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    clear();
    setQuestions(shuffle([...VOCAB]).slice(0, 10));
    setRound(0);
    setScore(0);
    setSelected(null);
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

  const current = questions[round];
  const choices = useMemo(() => {
    if (!current) return [];
    const others = VOCAB.filter(v => v.word !== current.word);
    const wrong = shuffle(others).slice(0, 3);
    return shuffle([current, ...wrong]);
  }, [current, round]);

  const handleChoice = useCallback((word: string) => {
    if (selected !== null || !current) return;
    setSelected(word);
    const correct = word === current.word;
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

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="📚"
        gameName="Vocab Builder"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `Round ${pendingSavedState.round + 1} · Score ${pendingSavedState.score}` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.round}>Round {round + 1} / 10  ·  Score: {score}</Text>
      <Text style={s.instruction}>Which word matches this definition?</Text>

      <View style={s.defBox}>
        <Text style={s.defText}>"{current.def}"</Text>
      </View>

      <View style={s.choices}>
        {choices.map(v => {
          let bg = colors.surface;
          let border = colors.divider;
          if (selected === v.word) {
            bg = v.word === current.word ? colors.number.bg : '#FFE0E0';
            border = v.word === current.word ? colors.number.ink : colors.danger;
          } else if (selected !== null && v.word === current.word) {
            bg = colors.number.bg;
            border = colors.number.ink;
          }
          return (
            <TouchableOpacity key={v.word} style={[s.choice, { backgroundColor: bg, borderColor: border }]} onPress={() => handleChoice(v.word)} activeOpacity={0.8}>
              <Text style={s.choiceText}>{v.word}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '📖' : '📚'}</Text>
            <Text style={s.modalTitle}>{won ? 'Wordsmith!' : 'Keep Reading'}</Text>
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
              setQuestions(shuffle([...VOCAB]).slice(0, 10));
              setRound(0); setScore(0); setSelected(null);
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
  defBox: { backgroundColor: colors.surface2, borderRadius: 16, padding: 20, marginBottom: 24, width: '100%' },
  defText: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink, textAlign: 'center', lineHeight: 24 },
  choices: { width: '100%', gap: 10 },
  choice: { borderWidth: 2, borderRadius: 12, padding: 14, alignItems: 'center' },
  choiceText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
