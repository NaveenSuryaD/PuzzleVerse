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

// Emoji Story: decode a famous story/movie/phrase from emojis
const PUZZLES = [
  { emojis: '🦁👑🌍', answer: 'THE LION KING', hint: 'Disney animated film' },
  { emojis: '🕷️🕸️👦', answer: 'SPIDER-MAN', hint: 'Marvel superhero' },
  { emojis: '❄️👸🏔️', answer: 'FROZEN', hint: 'Disney princess movie' },
  { emojis: '🐠🔍🌊', answer: 'FINDING NEMO', hint: 'Pixar underwater adventure' },
  { emojis: '🚂⚡📚', answer: 'HARRY POTTER', hint: 'Wizard at Hogwarts' },
  { emojis: '💍🧙‍♂️🏔️', answer: 'LORD OF THE RINGS', hint: 'Fantasy epic' },
  { emojis: '🦈🏖️😱', answer: 'JAWS', hint: 'Spielberg thriller' },
  { emojis: '👽🚲🌕', answer: 'E.T.', hint: 'Extraterrestrial goes home' },
  { emojis: '🤖🌎☢️', answer: 'WALL-E', hint: 'Pixar robot in space' },
  { emojis: '🐼🥋🏆', answer: 'KUNG FU PANDA', hint: 'DreamWorks animation' },
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
  questions: typeof PUZZLES;
  round: number;
  score: number;
}

export function EmojiStoryGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('emoji-story');

  const [questions, setQuestions] = useState<typeof PUZZLES>(() => shuffle([...PUZZLES]).slice(0, 8));
  const [round, setRound] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [revealed, setRevealed] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SaveState | null>(null);

  const s = useMemo(() => makeStyles(colors), [colors]);

  const current = questions[round];

  const choices = useMemo(() => {
    if (!current) return [];
    const others = PUZZLES.filter(p => p.answer !== current.answer);
    const wrong = shuffle(others).slice(0, 3).map(p => p.answer);
    return shuffle([current.answer, ...wrong]);
  }, [current]);

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
    setQuestions(shuffle([...PUZZLES]).slice(0, 8));
    setRound(0);
    setScore(0);
    setChosen(null);
    setRevealed(false);
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

  const handleChoice = useCallback((answer: string) => {
    if (chosen !== null) return;
    setChosen(answer);
    setRevealed(true);
    const correct = answer === current.answer;
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (round + 1 >= questions.length) {
        finish(score + (correct ? 1 : 0) >= 6);
      } else {
        setRound(r => r + 1);
        setChosen(null);
        setRevealed(false);
      }
    }, 1000);
  }, [chosen, current, round, score, questions.length, finish]);

  if (!current) return null;

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="😄"
        gameName="Emoji Story"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `Round ${pendingSavedState.round + 1} · Score ${pendingSavedState.score}` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.round}>Round {round + 1} / {questions.length}  ·  Score: {score}</Text>
      <Text style={s.instruction}>What does this represent?</Text>

      <View style={s.emojiBox}>
        <Text style={s.emojis}>{current.emojis}</Text>
      </View>

      {revealed && (
        <Text style={s.hint}>Hint: {current.hint}</Text>
      )}

      <View style={s.choices}>
        {choices.map(ans => {
          let bg = colors.surface;
          let border = colors.divider;
          if (chosen === ans) {
            bg = ans === current.answer ? colors.number.bg : '#FFE0E0';
            border = ans === current.answer ? colors.number.ink : colors.danger;
          } else if (revealed && ans === current.answer) {
            bg = colors.number.bg;
            border = colors.number.ink;
          }
          return (
            <TouchableOpacity
              key={ans}
              style={[s.choice, { backgroundColor: bg, borderColor: border }]}
              onPress={() => handleChoice(ans)}
              activeOpacity={0.8}
            >
              <Text style={s.choiceText}>{ans}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🎬' : '📽️'}</Text>
            <Text style={s.modalTitle}>{won ? 'Director!' : 'Keep Watching'}</Text>
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
              setQuestions(shuffle([...PUZZLES]).slice(0, 8));
              setRound(0); setScore(0); setChosen(null); setRevealed(false);
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
  emojiBox: { backgroundColor: colors.classic.bg, paddingHorizontal: 32, paddingVertical: 24, borderRadius: 24, marginBottom: 8 },
  emojis: { fontSize: 48, letterSpacing: 8 },
  hint: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginBottom: 16, fontStyle: 'italic' },
  choices: { width: '100%', gap: 10, marginTop: 8 },
  choice: { borderWidth: 2, borderRadius: 12, padding: 14, alignItems: 'center' },
  choiceText: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink, textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
