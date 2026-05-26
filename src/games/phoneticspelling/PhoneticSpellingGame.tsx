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

// Alternative words for each letter — used as plausible wrong options
// All words start with the same letter as the question letter
const LETTER_ALTS: Record<string, string[]> = {
  A: ['ANCHOR', 'AMBER', 'ARROW', 'ATLAS'],
  B: ['BANNER', 'BRIDGE', 'BADGE', 'BARON'],
  C: ['COPPER', 'CASTLE', 'COBRA', 'CEDAR'],
  D: ['DAGGER', 'DOME', 'DRAKE', 'DUSK'],
  E: ['EAGLE', 'EMBER', 'ELDER', 'ENVOY'],
  F: ['FALCON', 'FERRY', 'FLAME', 'FROST'],
  G: ['GAMMA', 'GECKO', 'GHOST', 'GRAVEL'],
  H: ['HARBOR', 'HAWK', 'HAZE', 'HERALD'],
  I: ['ICEBERG', 'IRON', 'IVORY', 'IGLOO'],
  J: ['JUNGLE', 'JADE', 'JASPER', 'JESTER'],
  K: ['KELP', 'KNIGHT', 'KNOT', 'KYOTO'],
  L: ['LEMON', 'LUNAR', 'LOGIC', 'LANCE'],
  M: ['MAPLE', 'MARBLE', 'MANGO', 'METRO'],
  N: ['NEON', 'NOBLE', 'NOMAD', 'NORTH'],
  O: ['ONYX', 'ORBIT', 'OPAL', 'OTTER'],
  P: ['PILOT', 'PRISM', 'PANDA', 'PIXEL'],
  Q: ['QUARTZ', 'QUEEN', 'QUOTA', 'QUEST'],
  R: ['RADAR', 'RAPID', 'RAVEN', 'RIDGE'],
  S: ['SOLAR', 'STORM', 'SAPPHIRE', 'SCOUT'],
  T: ['TIGER', 'TORCH', 'TERRA', 'TURBO'],
  U: ['ULTRA', 'UMBRA', 'URBAN', 'UNITY'],
  V: ['VIPER', 'VAULT', 'VALOR', 'VISTA'],
  W: ['WALRUS', 'WINTER', 'WARDEN', 'WAVE'],
  X: ['XENON', 'XERIC', 'XMAS', 'XYLEM'],
  Y: ['YELLOW', 'YONDER', 'YACHT', 'YIELD'],
  Z: ['ZEBRA', 'ZENITH', 'ZEPHYR', 'ZINC'],
};

// Phonetic Spelling: match NATO phonetic alphabet words to letters
const NATO = [
  { letter: 'A', word: 'ALPHA' },
  { letter: 'B', word: 'BRAVO' },
  { letter: 'C', word: 'CHARLIE' },
  { letter: 'D', word: 'DELTA' },
  { letter: 'E', word: 'ECHO' },
  { letter: 'F', word: 'FOXTROT' },
  { letter: 'G', word: 'GOLF' },
  { letter: 'H', word: 'HOTEL' },
  { letter: 'I', word: 'INDIA' },
  { letter: 'J', word: 'JULIET' },
  { letter: 'K', word: 'KILO' },
  { letter: 'L', word: 'LIMA' },
  { letter: 'M', word: 'MIKE' },
  { letter: 'N', word: 'NOVEMBER' },
  { letter: 'O', word: 'OSCAR' },
  { letter: 'P', word: 'PAPA' },
  { letter: 'Q', word: 'QUEBEC' },
  { letter: 'R', word: 'ROMEO' },
  { letter: 'S', word: 'SIERRA' },
  { letter: 'T', word: 'TANGO' },
  { letter: 'U', word: 'UNIFORM' },
  { letter: 'V', word: 'VICTOR' },
  { letter: 'W', word: 'WHISKEY' },
  { letter: 'X', word: 'X-RAY' },
  { letter: 'Y', word: 'YANKEE' },
  { letter: 'Z', word: 'ZULU' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Mode = 'letterToWord' | 'wordToLetter';

interface SavedState {
  questions: typeof NATO;
  round: number;
  score: number;
}

export function PhoneticSpellingGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SavedState>('phonetic-spelling');

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SavedState | null>(null);

  const [questions, setQuestions] = useState<typeof NATO>(() => shuffle([...NATO]).slice(0, 10));
  const [round, setRound] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [mode] = useState<Mode>('letterToWord');
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  const s = useMemo(() => makeStyles(colors), [colors]);
  const current = questions[round];

  const choices = useMemo(() => {
    if (!current) return [];
    // Wrong options must start with the same letter as the correct answer
    const alts = LETTER_ALTS[current.letter] ?? [];
    const wrong = shuffle(alts).slice(0, 3);
    // Pad with other-letter NATO words if not enough alts (shouldn't happen)
    const padded = wrong.length < 3
      ? [...wrong, ...shuffle(NATO.filter(n => n.letter !== current.letter)).map(n => n.word)].slice(0, 3)
      : wrong;
    return shuffle([current.word, ...padded]);
  }, [current]);

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
    setQuestions(shuffle([...NATO]).slice(0, 10));
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

  const handleChoice = useCallback((word: string) => {
    if (chosen !== null) return;
    setChosen(word);
    const correct = word === current.word;
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (round + 1 >= questions.length) {
        finish(score + (correct ? 1 : 0) >= 7);
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
        gameEmoji="🔊"
        gameName="Phonetic Spelling"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `Round ${pendingSavedState.round + 1} / ${pendingSavedState.questions.length}  ·  Score: ${pendingSavedState.score}` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.round}>Round {round+1} / {questions.length}  ·  Score: {score}</Text>
      <Text style={s.instruction}>NATO phonetic word for this letter?</Text>

      <View style={s.letterBox}>
        <Text style={s.letter}>{current.letter}</Text>
      </View>

      <View style={s.choices}>
        {choices.map(word => {
          let bg = colors.surface;
          let border = colors.divider;
          if (chosen === word) {
            bg = word === current.word ? colors.number.bg : '#FFE0E0';
            border = word === current.word ? colors.number.ink : colors.danger;
          } else if (chosen !== null && word === current.word) {
            bg = colors.number.bg;
            border = colors.number.ink;
          }
          return (
            <TouchableOpacity
              key={word}
              style={[s.choice, { backgroundColor: bg, borderColor: border }]}
              onPress={() => handleChoice(word)}
              activeOpacity={0.8}
            >
              <Text style={s.choiceText}>{word}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '📡' : '📻'}</Text>
            <Text style={s.modalTitle}>{won ? 'Copy That!' : 'Stay Frosty'}</Text>
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
              setQuestions(shuffle([...NATO]).slice(0, 10));
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
  letterBox: { backgroundColor: colors.classic.bg, width: 100, height: 100, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  letter: { fontFamily: fonts.black, fontSize: 56, color: colors.classic.ink },
  choices: { width: '100%', gap: 10 },
  choice: { borderWidth: 2, borderRadius: 12, padding: 14, alignItems: 'center' },
  choiceText: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
