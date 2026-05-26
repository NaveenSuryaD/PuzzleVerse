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

// Syllable Split: tap the correct syllable breakdown of a word
const QUESTIONS = [
  { word: 'ELEPHANT', choices: ['E·LE·PHANT','EL·E·PHANT','ELE·PHANT','E·LEPH·ANT'], answer: 'EL·E·PHANT' },
  { word: 'BEAUTIFUL', choices: ['BEAU·TI·FUL','BE·AU·TI·FUL','BEAU·TIFUL','BEAUTI·FUL'], answer: 'BEAU·TI·FUL' },
  { word: 'COMPUTER', choices: ['COM·PU·TER','COMP·U·TER','COM·PUT·ER','COMPU·TER'], answer: 'COM·PU·TER' },
  { word: 'CHOCOLATE', choices: ['CHOC·O·LATE','CHO·CO·LATE','CHOCO·LATE','CH·OC·O·LATE'], answer: 'CHOC·O·LATE' },
  { word: 'UMBRELLA', choices: ['UM·BREL·LA','UMB·REL·LA','UM·BRELLA','UMBREL·LA'], answer: 'UM·BREL·LA' },
  { word: 'FANTASTIC', choices: ['FAN·TAS·TIC','FANT·AS·TIC','FAN·TASTIC','FANTAS·TIC'], answer: 'FAN·TAS·TIC' },
  { word: 'ADVENTURE', choices: ['AD·VEN·TURE','ADV·EN·TURE','AD·VENTURE','ADVEN·TURE'], answer: 'AD·VEN·TURE' },
  { word: 'DINOSAUR', choices: ['DI·NO·SAUR','DIN·O·SAUR','DINO·SAUR','DI·NOS·AUR'], answer: 'DI·NO·SAUR' },
  { word: 'WONDERFUL', choices: ['WON·DER·FUL','WOND·ER·FUL','WON·DERFUL','WONDER·FUL'], answer: 'WON·DER·FUL' },
  { word: 'BASKETBALL', choices: ['BAS·KET·BALL','BASK·ET·BALL','BASKET·BALL','BAS·KETBALL'], answer: 'BAS·KET·BALL' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface SavedState {
  questions: typeof QUESTIONS;
  round: number;
  score: number;
}

export function SyllableSplitGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SavedState>('syllable-split');

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SavedState | null>(null);

  const [questions, setQuestions] = useState<typeof QUESTIONS>(() => shuffle([...QUESTIONS]).slice(0, 8));
  const [round, setRound] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  const s = useMemo(() => makeStyles(colors), [colors]);
  const current = questions[round];

  // Mount effect: load saved state
  useEffect(() => {
    load().then(result => {
      if (result.found && result.gameState) {
        setResumeElapsed(result.elapsedSeconds);
        setPendingSavedState(result.gameState);
        setShowResumeModal(true);
        timer.pause();
      } else {
        timer.start();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save effect
  useEffect(() => {
    if (!done) {
      save({ questions, round, score }, timer.elapsedSeconds);
    }
  }, [round, score, done, save, timer.elapsedSeconds, questions]);

  const handleResume = useCallback(() => {
    setShowResumeModal(false);
    if (pendingSavedState) {
      setQuestions(pendingSavedState.questions);
      setRound(pendingSavedState.round);
      setScore(pendingSavedState.score);
    }
    timer.restoreAndResume(resumeElapsed);
    setPendingSavedState(null);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    setShowResumeModal(false);
    setPendingSavedState(null);
    clear();
    setQuestions(shuffle([...QUESTIONS]).slice(0, 8));
    setRound(0);
    setScore(0);
    setChosen(null);
    timer.start();
  }, [clear, timer]);

  const finish = useCallback((w: boolean) => {
    clear();
    setWon(w);
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, timer.elapsedSeconds, clear]);

  const handleChoice = useCallback((choice: string) => {
    if (chosen !== null) return;
    setChosen(choice);
    const correct = choice === current.answer;
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (round + 1 >= questions.length) {
        finish(score + (correct ? 1 : 0) >= 6);
      } else {
        setRound(r => r + 1);
        setChosen(null);
      }
    }, 800);
  }, [chosen, current, round, score, questions.length, finish]);

  if (!current) return null;

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="🔤"
        gameName="Syllable Split"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `Round ${pendingSavedState.round + 1} / ${pendingSavedState.questions.length}  ·  Score: ${pendingSavedState.score}` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.round}>Round {round+1} / {questions.length}  ·  Score: {score}</Text>
      <Text style={s.instruction}>Which shows the correct syllables?</Text>

      <View style={s.wordBox}>
        <Text style={s.word}>{current.word}</Text>
      </View>

      <View style={s.choices}>
        {current.choices.map(ch => {
          let bg = colors.surface;
          let border = colors.divider;
          if (chosen === ch) {
            bg = ch === current.answer ? colors.number.bg : '#FFE0E0';
            border = ch === current.answer ? colors.number.ink : colors.danger;
          } else if (chosen !== null && ch === current.answer) {
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
            <Text style={s.modalEmoji}>{won ? '🗣️' : '📖'}</Text>
            <Text style={s.modalTitle}>{won ? 'Syllable Pro!' : 'Keep Practicing'}</Text>
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
              setDone(false);
              setQuestions(shuffle([...QUESTIONS]).slice(0, 8));
              setRound(0); setScore(0); setChosen(null);
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
  wordBox: { backgroundColor: colors.word.bg, paddingHorizontal: 32, paddingVertical: 20, borderRadius: 20, marginBottom: 24 },
  word: { fontFamily: fonts.black, fontSize: 32, color: colors.word.ink, letterSpacing: 2 },
  choices: { width: '100%', gap: 10 },
  choice: { borderWidth: 2, borderRadius: 12, padding: 14, alignItems: 'center' },
  choiceText: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink, letterSpacing: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
