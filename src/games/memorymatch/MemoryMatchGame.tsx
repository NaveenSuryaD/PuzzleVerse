import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../../store/useSettingsStore';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

const EMOJIS = ['🐶','🐱','🐭','🐹','🦊','🐻','🐼','🦁'];
const { width: SCREEN_W } = Dimensions.get('window');
const CELL = Math.min(Math.floor((SCREEN_W - 48) / 4), 72);

const PREVIEW_SECONDS = 2;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getStars(moves: number): number {
  if (moves <= 16) return 3;
  if (moves <= 24) return 2;
  return 1;
}

export function MemoryMatchGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const hapticsEnabled = useSettingsStore(st => st.hapticsEnabled);
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const [gameKey, setGameKey] = useState(0);
  const cards = useMemo(
    () => shuffle([...EMOJIS, ...EMOJIS]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameKey],
  );

  const [preview, setPreview] = useState(true);
  const [countdown, setCountdown] = useState(PREVIEW_SECONDS);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState(false);
  const [finalMoves, setFinalMoves] = useState(0);

  const s = useMemo(() => makeStyles(colors), [colors]);

  // Preview countdown then start game
  useEffect(() => {
    setPreview(true);
    setCountdown(PREVIEW_SECONDS);

    const countInterval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(countInterval);
          setPreview(false);
          // Start game timer after preview
          timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countInterval);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameKey]);

  const finish = useCallback((w: boolean, finalMovesCount: number) => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setFinalMoves(finalMovesCount);
    setDone(true);
    onComplete(w, elapsedRef.current);
  }, [onComplete]);

  const handleTap = useCallback((idx: number) => {
    if (preview || checking || flipped.has(idx) || matched.has(idx)) return;
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newFlipped = new Set(flipped);
    newFlipped.add(idx);
    setFlipped(newFlipped);

    const flippedArr = Array.from(newFlipped).filter(i => !matched.has(i));
    if (flippedArr.length === 2) {
      const newMoves = moves + 1;
      setMoves(newMoves);
      setChecking(true);
      const [a, b] = flippedArr;
      if (cards[a] === cards[b]) {
        if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const newMatched = new Set(matched);
        newMatched.add(a);
        newMatched.add(b);
        setMatched(newMatched);
        setFlipped(new Set());
        setChecking(false);
        if (newMatched.size === cards.length) finish(true, newMoves);
      } else {
        if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setTimeout(() => {
          setFlipped(new Set());
          setChecking(false);
        }, 800);
      }
    }
  }, [preview, checking, flipped, matched, cards, moves, finish, hapticsEnabled]);

  const playAgain = useCallback(() => {
    setDone(false);
    completedRef.current = false;
    setFlipped(new Set());
    setMatched(new Set());
    setMoves(0);
    setFinalMoves(0);
    elapsedRef.current = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    setGameKey(k => k + 1);
  }, []);

  const stars = getStars(finalMoves);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.moveCount}>Moves: {moves}</Text>
        {preview && (
          <View style={[s.previewBadge, { backgroundColor: colors.logic.bg }]}>
            <Text style={[s.previewText, { color: colors.logic.ink }]}>
              Memorize! {countdown > 0 ? `${countdown}s` : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={s.grid}>
        {cards.map((emoji, i) => {
          const isFlipped = preview || flipped.has(i) || matched.has(i);
          const isMatched = matched.has(i);
          return (
            <TouchableOpacity
              key={i}
              style={[
                s.card,
                { width: CELL, height: CELL },
                isFlipped && !preview && s.cardFlipped,
                preview && s.cardPreview,
                isMatched && s.cardMatched,
              ]}
              onPress={() => handleTap(i)}
              activeOpacity={preview ? 1 : 0.8}
              disabled={preview || isFlipped}
            >
              <Text style={s.cardEmoji}>{isFlipped ? emoji : '?'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>🎴</Text>
            <Text style={s.modalTitle}>All Matched!</Text>

            {/* Star rating */}
            <View style={s.starsRow}>
              {[1, 2, 3].map(n => (
                <Text key={n} style={[s.star, n <= stars && s.starFilled]}>★</Text>
              ))}
            </View>

            <Text style={s.modalSub}>{finalMoves} moves · {elapsedRef.current}s</Text>
            <Text style={s.ratingLabel}>
              {stars === 3 ? 'Perfect memory!' : stars === 2 ? 'Well done!' : 'Keep practicing!'}
            </Text>

            <TouchableOpacity style={s.modalBtn} onPress={playAgain}>
              <Text style={s.modalBtnText}>Play Again</Text>
            </TouchableOpacity>
            {onBack && (
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 8 }]}
                onPress={onBack}
              >
                <Text style={[s.modalBtnText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: CELL * 4 + 8 * 3 + 2,
    marginBottom: 16,
  },
  moveCount: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.ink },
  previewBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  previewText: { fontFamily: fonts.bold, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', width: CELL * 4 + 8 * 3 + 2 },
  card: {
    borderRadius: 14,
    backgroundColor: colors.visual.bg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPreview: { backgroundColor: colors.surface },
  cardFlipped: { backgroundColor: colors.surface },
  cardMatched: { backgroundColor: colors.number.bg },
  cardEmoji: { fontSize: CELL * 0.5, lineHeight: CELL * 0.65 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300, gap: 4 },
  modalEmoji: { fontSize: 52, marginBottom: 8 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 4 },
  starsRow: { flexDirection: 'row', gap: 4, marginVertical: 8 },
  star: { fontSize: 32, color: colors.rule },
  starFilled: { color: '#F5C518' },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted },
  ratingLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft, marginBottom: 16 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999, width: '100%', alignItems: 'center' },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
