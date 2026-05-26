import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { HIDDEN_WORD_PUZZLES } from './puzzles';
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
  puzzles: typeof HIDDEN_WORD_PUZZLES;
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

export function HiddenWordsGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();

  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('hidden-words');

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SaveState | null>(null);

  const [puzzles] = useState<typeof HIDDEN_WORD_PUZZLES>(() => shuffle([...HIDDEN_WORD_PUZZLES]).slice(0, 10));
  const [round, setRound] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  const s = useMemo(() => makeStyles(colors), [colors]);

  // Mount effect: load saved state
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

  // Save effect: save on state changes
  useEffect(() => {
    if (!done) {
      save({ puzzles, round, score }, timer.elapsedSeconds);
    }
  }, [round, done, puzzles, score, timer.elapsedSeconds, save]);

  const handleResume = useCallback(() => {
    if (pendingSavedState) {
      setRound(pendingSavedState.round);
      setScore(pendingSavedState.score);
    }
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    clear();
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
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="🔍"
        gameName="Hidden Words"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `Round ${pendingSavedState.round + 1} of 10 · Score: ${pendingSavedState.score}` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

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
              setDone(false);
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
