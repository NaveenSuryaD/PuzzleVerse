import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

const LETTER_SETS = [
  { letters: 'STARNELP'.split(''), words: ['rant','rant','snap','plan','star','raps','slap','earn','pals','tars','laps','rats','naps','span','arcs','near','lean','pans','rants','plans','earns','snaps','claps','slaps','pants','pleas','leans','earns','slant','plant','plants','planet'] },
  { letters: 'BOARDMIKE'.split(''), words: ['bored','board','bore','bark','bare','biker','bike','dorm','drab','idea','made','mike','mired','roam','robe','rode','road'] },
];

const VALID = new Set(['rant','snap','plan','star','raps','slap','earn','pals','tars','laps','rats','naps','span','near','lean','pans','rants','plans','earns','snaps','slaps','pants','leans','slant','plant','plants','planet','bored','board','bore','bark','bare','biker','bike','dorm','drab','idea','made','mike','mired','roam','robe','rode','road']);

interface SaveState {
  setIdx: number;
  found: string[];
}

export function LetterSoupGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('letter-soup');
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [setIdx] = useState<number>(() => Math.floor(Math.random() * LETTER_SETS.length));
  const letterSet = LETTER_SETS[setIdx];
  const [selected, setSelected] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('');

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SaveState | null>(null);

  const s = useMemo(() => makeStyles(colors), [colors]);

  const startCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

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
        startCountdown();
      }
    })();
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Finish when countdown hits zero
  useEffect(() => {
    if (timeLeft === 0 && !done && !showResumeModal) {
      finish(score > 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // Save effect
  useEffect(() => {
    if (!done && !showResumeModal) {
      save({ setIdx, found }, timer.elapsedSeconds);
    }
  }, [setIdx, found, timer.elapsedSeconds, done, showResumeModal, save]);

  const handleResume = useCallback(() => {
    if (pendingSavedState) {
      setFound(pendingSavedState.found);
    }
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
    startCountdown();
  }, [pendingSavedState, resumeElapsed, timer, startCountdown]);

  const handleStartFresh = useCallback(() => {
    clear();
    setFound([]);
    setScore(0);
    setTimeLeft(90);
    setSelected([]);
    setMessage('');
    setShowResumeModal(false);
    timer.start();
    startCountdown();
  }, [clear, timer, startCountdown]);

  const finish = useCallback((w: boolean) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    timer.pause();
    clear();
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, timer, clear]);

  const currentWord = selected.map(i => letterSet.letters[i]).join('').toLowerCase();

  const handleTap = useCallback((idx: number) => {
    if (selected.includes(idx)) {
      // Submit
      if (VALID.has(currentWord) && !found.includes(currentWord) && currentWord.length >= 3) {
        const pts = currentWord.length;
        setScore(s => s + pts);
        setFound(prev => [...prev, currentWord]);
        setMessage('+' + pts);
        setTimeout(() => setMessage(''), 800);
      } else {
        setMessage('Not valid');
        setTimeout(() => setMessage(''), 800);
      }
      setSelected([]);
    } else {
      setSelected(prev => [...prev, idx]);
    }
  }, [selected, currentWord, found]);

  // Circular layout
  const R = 90;
  const n = letterSet.letters.length;

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="🍜"
        gameName="Letter Soup"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `${pendingSavedState.found.length} words found` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <View style={s.topRow}>
        <Text style={s.timer}>{timeLeft}s</Text>
        <Text style={s.scoreText}>Score: {score}</Text>
      </View>
      <Text style={s.title}>Letter Soup</Text>

      <Text style={s.word}>{currentWord.toUpperCase() || '...'}</Text>
      {message ? <Text style={s.message}>{message}</Text> : null}

      <View style={[s.circle, { width: R * 2 + 60, height: R * 2 + 60 }]}>
        {letterSet.letters.map((l, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
          const x = R + R * Math.cos(angle);
          const y = R + R * Math.sin(angle);
          const isSel = selected.includes(i);
          return (
            <TouchableOpacity
              key={i}
              style={[s.letterBtn, { left: x, top: y }, isSel && s.letterBtnSel]}
              onPress={() => handleTap(i)}
              activeOpacity={0.7}
            >
              <Text style={[s.letterText, isSel && { color: colors.word.ink }]}>{l}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={s.clearBtn} onPress={() => setSelected([])} activeOpacity={0.8}>
        <Text style={s.clearBtnText}>Clear</Text>
      </TouchableOpacity>

      <ScrollView horizontal style={s.foundList}>
        {found.map(w => (
          <View key={w} style={s.foundWord}>
            <Text style={s.foundText}>{w}</Text>
          </View>
        ))}
      </ScrollView>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>🍜</Text>
            <Text style={s.modalTitle}>Time's Up!</Text>
            <Text style={s.modalSub}>Score: {score} · Words: {found.length}</Text>
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
              setSelected([]); setFound([]); setScore(0); setTimeLeft(90); setMessage('');
              timer.start();
              startCountdown();
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
  container: { flex: 1, alignItems: 'center', padding: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 8 },
  timer: { fontFamily: fonts.black, fontSize: 24, color: colors.danger },
  scoreText: { fontFamily: fonts.extraBold, fontSize: 20, color: colors.ink },
  title: { fontFamily: fonts.black, fontSize: 20, color: colors.ink, marginBottom: 8 },
  word: { fontFamily: fonts.black, fontSize: 28, color: colors.ink, letterSpacing: 4, marginBottom: 4, minHeight: 36 },
  message: { fontFamily: fonts.bold, fontSize: 14, color: colors.word.ink, marginBottom: 4 },
  circle: { position: 'relative', marginVertical: 12 },
  letterBtn: { position: 'absolute', width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', transform: [{ translateX: -24 }, { translateY: -24 }], shadowColor: colors.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  letterBtnSel: { backgroundColor: colors.word.bg },
  letterText: { fontFamily: fonts.black, fontSize: 20, color: colors.ink },
  clearBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999, marginBottom: 8 },
  clearBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft },
  foundList: { maxHeight: 36 },
  foundWord: { backgroundColor: colors.number.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginRight: 6 },
  foundText: { fontFamily: fonts.bold, fontSize: 13, color: colors.number.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
