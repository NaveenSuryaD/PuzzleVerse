import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { RHYME_ROUNDS } from './puzzles';
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
  rounds: typeof RHYME_ROUNDS;
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

export function RhymeTimeGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('rhyme-time');

  const [rounds] = useState<typeof RHYME_ROUNDS>(() => shuffle([...RHYME_ROUNDS]).slice(0, 5));
  const [round, setRound] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
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
      save({ rounds, round, score }, timer.elapsedSeconds);
    }
  }, [round, score]);

  const handleResume = useCallback(() => {
    if (!pendingSavedState) return;
    setRound(pendingSavedState.round);
    setScore(pendingSavedState.score);
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    clear();
    setRound(0);
    setScore(0);
    setSelected(new Set());
    setSubmitted(false);
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

  const current = rounds[round];

  const handleToggle = useCallback((word: string) => {
    if (submitted) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  }, [submitted]);

  const handleSubmit = useCallback(() => {
    if (submitted || !current) return;
    setSubmitted(true);
    const rhymingWords = current.options.filter(o => o.rhymes).map(o => o.word);
    const correct = rhymingWords.every(w => selected.has(w)) &&
      [...selected].every(w => rhymingWords.includes(w));
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (round + 1 >= 5) {
        finish(score + (correct ? 1 : 0) >= 3);
      } else {
        setRound(r => r + 1);
        setSelected(new Set());
        setSubmitted(false);
      }
    }, 1000);
  }, [submitted, current, selected, round, score, finish]);

  if (!current) return null;

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="🎵"
        gameName="Rhyme Time"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `Round ${pendingSavedState.round + 1} / 5 · Score: ${pendingSavedState.score}` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.round}>Round {round + 1} / 5  ·  Score: {score}</Text>
      <Text style={s.instruction}>Select ALL words that rhyme with:</Text>

      <View style={s.targetBox}>
        <Text style={s.targetWord}>{current.target}</Text>
      </View>

      <View style={s.grid}>
        {current.options.map(({ word, rhymes }) => {
          const isSel = selected.has(word);
          let bg = colors.surface;
          let border = colors.divider;
          if (submitted) {
            if (rhymes && isSel) { bg = colors.number.bg; border = colors.number.ink; }
            else if (rhymes && !isSel) { bg = colors.number.bg + '80'; border = colors.number.ink; }
            else if (!rhymes && isSel) { bg = '#FFE0E0'; border = colors.danger; }
          } else if (isSel) {
            bg = colors.word.bg; border = colors.word.ink;
          }
          return (
            <TouchableOpacity
              key={word}
              style={[s.option, { backgroundColor: bg, borderColor: border }]}
              onPress={() => handleToggle(word)}
              activeOpacity={0.8}
            >
              <Text style={s.optionText}>{word}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={[s.submitBtn, submitted && { opacity: 0.5 }]} onPress={handleSubmit} disabled={submitted} activeOpacity={0.8}>
        <Text style={s.submitBtnText}>Submit</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🎵' : '📖'}</Text>
            <Text style={s.modalTitle}>{won ? 'Rhyme Master!' : 'Practice More'}</Text>
            <Text style={s.modalSub}>Score: {score} / 5</Text>
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
              setRound(0); setScore(0); setSelected(new Set()); setSubmitted(false);
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
  instruction: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 12 },
  targetBox: { backgroundColor: colors.word.bg, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, marginBottom: 24 },
  targetWord: { fontFamily: fonts.black, fontSize: 32, color: colors.word.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 24 },
  option: { borderWidth: 2, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  optionText: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.ink },
  submitBtn: { backgroundColor: colors.ink, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 999 },
  submitBtnText: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.bg },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
