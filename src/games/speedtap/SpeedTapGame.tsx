import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';
import { useSaveGame } from '../../utils/gameSave';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  savedStateJSON?: string;
}

type Phase = 'idle' | 'wait' | 'tap' | 'tapped' | 'done';

const NUM_ROUNDS = 5;
const WIN_AVG_MS = 500; // win if avg reaction < 500ms

export function SpeedTapGame({ onComplete, onBack, savedStateJSON }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => { try { return savedStateJSON ? JSON.parse(savedStateJSON) : null; } catch { return null; } }, []);
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState<number>(() => saved?.round ?? 0);
  const [reactions, setReactions] = useState<number[]>(() => saved?.reactions ?? []);
  const [currentReaction, setCurrentReaction] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);
  const [tooEarly, setTooEarly] = useState(false);

  useSaveGame('speed-tap', () => ({ round, reactions }), !done, [round, reactions], elapsedRef);

  const tapStartRef = useRef(0);
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const s = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
    };
  }, []);

  const finish = useCallback((w: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setWon(w);
    setDone(true);
    onComplete(w, elapsedRef.current);
  }, [onComplete]);

  const startRound = useCallback(() => {
    setPhase('wait');
    setTooEarly(false);
    setCurrentReaction(null);
    const delay = 1500 + Math.random() * 2500;
    waitTimerRef.current = setTimeout(() => {
      tapStartRef.current = Date.now();
      setPhase('tap');
    }, delay);
  }, []);

  const handleTap = useCallback(() => {
    if (phase === 'idle') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      startRound();
    } else if (phase === 'wait') {
      if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTooEarly(true);
      setPhase('tapped');
      setTimeout(() => startRound(), 1500);
    } else if (phase === 'tap') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const reaction = Date.now() - tapStartRef.current;
      setCurrentReaction(reaction);
      const newReactions = [...reactions, reaction];
      setReactions(newReactions);
      setPhase('tapped');
      if (newReactions.length >= NUM_ROUNDS) {
        const avg = newReactions.reduce((a,b) => a+b, 0) / newReactions.length;
        setTimeout(() => finish(avg < WIN_AVG_MS), 800);
      } else {
        setTimeout(() => {
          setRound(r => r + 1);
          startRound();
        }, 800);
      }
    }
  }, [phase, reactions, startRound, finish]);

  const avg = reactions.length > 0 ? Math.round(reactions.reduce((a,b)=>a+b,0)/reactions.length) : null;

  const bgColor = phase === 'tap' ? colors.success + 'CC' :
    phase === 'wait' ? colors.danger + '44' : colors.surface;

  return (
    <View style={s.container}>
      <Text style={s.title}>Speed Tap</Text>
      <Text style={s.subtitle}>Tap when the screen turns green!</Text>
      <Text style={s.progress}>Round {Math.min(round + 1, NUM_ROUNDS)} / {NUM_ROUNDS}</Text>

      {reactions.length > 0 && (
        <Text style={s.avgText}>Avg: {avg}ms  (best: {Math.min(...reactions)}ms)</Text>
      )}

      <TouchableOpacity
        style={[s.tapArea, { backgroundColor: bgColor }]}
        onPress={handleTap}
        activeOpacity={0.95}
      >
        {phase === 'idle' && <Text style={s.tapPrompt}>Tap to Start</Text>}
        {phase === 'wait' && !tooEarly && <Text style={s.tapPrompt}>Wait...</Text>}
        {phase === 'wait' && tooEarly && <Text style={[s.tapPrompt, { color: colors.danger }]}>Too early!</Text>}
        {phase === 'tap' && <Text style={[s.tapPrompt, { color: colors.bg }]}>TAP!</Text>}
        {phase === 'tapped' && currentReaction !== null && (
          <View style={{ alignItems: 'center' }}>
            <Text style={s.reactionTime}>{currentReaction}ms</Text>
            <Text style={s.reactionLabel}>
              {currentReaction < 250 ? 'Incredible!' :
               currentReaction < 400 ? 'Fast!' :
               currentReaction < 600 ? 'Good' : 'Slow'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {reactions.length > 0 && (
        <View style={s.history}>
          {reactions.map((r, i) => (
            <View key={i} style={[s.historyBar, { width: Math.min(r/8, 200) }]}>
              <Text style={s.historyLabel}>{i+1}: {r}ms</Text>
            </View>
          ))}
        </View>
      )}

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '⚡' : '🐢'}</Text>
            <Text style={s.modalTitle}>{won ? 'Lightning Fast!' : 'Keep Practicing'}</Text>
            <Text style={s.modalSub}>Average: {avg}ms</Text>
            <Text style={s.modalSub2}>Best: {Math.min(...reactions)}ms</Text>
            {onBack && (
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 8 }]}
                onPress={onBack}
              >
                <Text style={[s.modalBtnText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.modalBtn} onPress={() => {
              setDone(false); completedRef.current = false;
              setPhase('idle'); setRound(0); setReactions([]);
              setCurrentReaction(null); setTooEarly(false);
              elapsedRef.current = 0;
              timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
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
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 8, textAlign: 'center' },
  progress: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted, marginBottom: 4 },
  avgText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkSoft, marginBottom: 16 },
  tapArea: { width: 240, height: 240, borderRadius: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 3, borderColor: colors.divider },
  tapPrompt: { fontFamily: fonts.black, fontSize: 28, color: colors.ink },
  reactionTime: { fontFamily: fonts.black, fontSize: 40, color: colors.ink },
  reactionLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.inkSoft, marginTop: 4 },
  history: { width: '100%', gap: 4 },
  historyBar: { backgroundColor: colors.logic.bg, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, minWidth: 60 },
  historyLabel: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.logic.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 4 },
  modalSub2: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
