import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { FLAGS } from './puzzles';
import type { FlagDesign } from './puzzles';
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
  flags: FlagDesign[];
  round: number;
  score: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function FlagView({ flag }: { flag: FlagDesign }) {
  return (
    <View style={{
      width: 160, height: 100, borderRadius: 8, overflow: 'hidden',
      flexDirection: flag.direction === 'horizontal' ? 'column' : 'row',
      borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)',
    }}>
      {flag.stripes.map((stripe, i) => (
        <View key={i} style={{ flex: stripe.flex, backgroundColor: stripe.color, alignItems: 'center', justifyContent: 'center' }}>
          {i === Math.floor(flag.stripes.length / 2) && flag.emblem && (
            <Text style={{ fontSize: 24 }}>{flag.emblem}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

function initFlags() { return shuffle([...FLAGS]).slice(0, 10); }

export function FlagQuizGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('flag-quiz');

  const [flags, setFlags] = useState<FlagDesign[]>(() => initFlags());
  const [round, setRound] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selected, setSelected] = useState<string | null>(null);
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
      save({ flags, round, score }, timer.elapsedSeconds);
    }
  }, [round, score]);

  const handleResume = useCallback(() => {
    if (!pendingSavedState) return;
    setFlags(pendingSavedState.flags);
    setRound(pendingSavedState.round);
    setScore(pendingSavedState.score);
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    clear();
    setFlags(initFlags());
    setRound(0);
    setScore(0);
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

  const currentFlag = flags[round];
  const choices = useMemo(() => {
    if (!currentFlag) return [];
    const others = FLAGS.filter(f => f.country !== currentFlag.country);
    const wrong = shuffle(others).slice(0, 3).map(f => f.country);
    return shuffle([currentFlag.country, ...wrong]);
  }, [currentFlag, round]);

  const handleChoice = useCallback((country: string) => {
    if (selected !== null || !currentFlag) return;
    setSelected(country);
    const correct = country === currentFlag.country;
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (round + 1 >= 10) {
        finish(score + (correct ? 1 : 0) >= 7);
      } else {
        setRound(r => r + 1);
        setSelected(null);
      }
    }, 800);
  }, [selected, currentFlag, round, score, finish]);

  if (!currentFlag) return null;

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="🏳️"
        gameName="Flag Quiz"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `Round ${pendingSavedState.round + 1} / 10 · Score: ${pendingSavedState.score}` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.round}>Round {round + 1} / 10  ·  Score: {score}</Text>
      <Text style={s.instruction}>Which country does this flag belong to?</Text>

      <View style={s.flagContainer}>
        <FlagView flag={currentFlag} />
      </View>

      <View style={s.choices}>
        {choices.map(country => {
          let bg = colors.surface;
          let border = colors.divider;
          if (selected === country) {
            bg = country === currentFlag.country ? colors.number.bg : '#FFE0E0';
            border = country === currentFlag.country ? colors.number.ink : colors.danger;
          } else if (selected !== null && country === currentFlag.country) {
            bg = colors.number.bg;
            border = colors.number.ink;
          }
          return (
            <TouchableOpacity
              key={country}
              style={[s.choice, { backgroundColor: bg, borderColor: border }]}
              onPress={() => handleChoice(country)}
              activeOpacity={0.8}
            >
              <Text style={s.choiceText}>{country}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🌍' : '🗺️'}</Text>
            <Text style={s.modalTitle}>{won ? 'Geography Expert!' : 'Keep Exploring'}</Text>
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
              const newFlags = initFlags();
              setFlags(newFlags);
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
  instruction: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 20 },
  flagContainer: { marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  choices: { width: '100%', gap: 10 },
  choice: { borderWidth: 2, borderRadius: 12, padding: 14, alignItems: 'center' },
  choiceText: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 24, color: colors.ink, marginBottom: 8, textAlign: 'center' },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
