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

const ELEMENTS = [
  { symbol: 'H', name: 'Hydrogen' }, { symbol: 'He', name: 'Helium' },
  { symbol: 'Li', name: 'Lithium' }, { symbol: 'C', name: 'Carbon' },
  { symbol: 'N', name: 'Nitrogen' }, { symbol: 'O', name: 'Oxygen' },
  { symbol: 'Na', name: 'Sodium' }, { symbol: 'Mg', name: 'Magnesium' },
  { symbol: 'Al', name: 'Aluminium' }, { symbol: 'Si', name: 'Silicon' },
  { symbol: 'P', name: 'Phosphorus' }, { symbol: 'S', name: 'Sulfur' },
  { symbol: 'Cl', name: 'Chlorine' }, { symbol: 'K', name: 'Potassium' },
  { symbol: 'Ca', name: 'Calcium' }, { symbol: 'Fe', name: 'Iron' },
  { symbol: 'Cu', name: 'Copper' }, { symbol: 'Zn', name: 'Zinc' },
  { symbol: 'Ag', name: 'Silver' }, { symbol: 'Au', name: 'Gold' },
  { symbol: 'Hg', name: 'Mercury' }, { symbol: 'Pb', name: 'Lead' },
  { symbol: 'U', name: 'Uranium' }, { symbol: 'Pt', name: 'Platinum' },
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
  questions: typeof ELEMENTS;
  round: number;
  score: number;
}

export function ScienceSymbolsGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('science-symbols');

  const [questions, setQuestions] = useState<typeof ELEMENTS>(() => shuffle([...ELEMENTS]).slice(0, 10));
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
    setQuestions(shuffle([...ELEMENTS]).slice(0, 10));
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
    const others = ELEMENTS.filter(e => e.symbol !== current.symbol);
    const wrong = shuffle(others).slice(0, 3);
    return shuffle([current, ...wrong]);
  }, [current, round]);

  const handleChoice = useCallback((name: string) => {
    if (selected !== null || !current) return;
    setSelected(name);
    const correct = name === current.name;
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (round + 1 >= 10) {
        finish(score + (correct ? 1 : 0) >= 7);
      } else {
        setRound(r => r + 1);
        setSelected(null);
      }
    }, 700);
  }, [selected, current, round, score, finish]);

  if (!current) return null;

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="⚗️"
        gameName="Science Symbols"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `Round ${pendingSavedState.round + 1} · Score ${pendingSavedState.score}` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.round}>Round {round + 1} / 10  ·  Score: {score}</Text>
      <Text style={s.instruction}>What element has the symbol:</Text>

      <View style={s.symbolBox}>
        <Text style={s.symbol}>{current.symbol}</Text>
      </View>

      <View style={s.choices}>
        {choices.map(el => {
          let bg = colors.surface;
          let border = colors.divider;
          if (selected === el.name) {
            bg = el.name === current.name ? colors.number.bg : '#FFE0E0';
            border = el.name === current.name ? colors.number.ink : colors.danger;
          } else if (selected !== null && el.name === current.name) {
            bg = colors.number.bg;
            border = colors.number.ink;
          }
          return (
            <TouchableOpacity
              key={el.symbol}
              style={[s.choice, { backgroundColor: bg, borderColor: border }]}
              onPress={() => handleChoice(el.name)}
              activeOpacity={0.8}
            >
              <Text style={s.choiceText}>{el.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '⚗️' : '🔬'}</Text>
            <Text style={s.modalTitle}>{won ? 'Chemistry Pro!' : 'Keep Learning'}</Text>
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
              setQuestions(shuffle([...ELEMENTS]).slice(0, 10));
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
  symbolBox: { width: 120, height: 120, borderRadius: 20, backgroundColor: colors.number.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 2, borderColor: colors.number.ink },
  symbol: { fontFamily: fonts.black, fontSize: 52, color: colors.number.ink },
  choices: { width: '100%', gap: 10 },
  choice: { borderWidth: 2, borderRadius: 12, padding: 14, alignItems: 'center' },
  choiceText: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 24, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
