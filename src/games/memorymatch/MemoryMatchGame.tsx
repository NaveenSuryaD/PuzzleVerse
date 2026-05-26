import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { useProgressStore } from '../../store/useProgressStore';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useGameTimer } from '../../hooks/useGameTimer';
import { usePersistentGameState } from '../../hooks/usePersistentGameState';
import { ResumeGameModal } from '../../components/ResumeGameModal';

interface MemoryMatchSaveState {
  cards: string[];
  matched: number[];
  moves: number;
}

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  paused?: boolean;
}

const ALL_EMOJIS = ['🐶','🐱','🐭','🐹','🦊','🐻','🐼','🦁','🐸','🦄','🐯','🦋','🐧','🦜','🐠','🦕'];
const { width: SCREEN_W } = Dimensions.get('window');

const LEVEL_CONFIG = [
  { pairs: 8,  cols: 4, label: '4×4' },
  { pairs: 10, cols: 5, label: '4×5' },
  { pairs: 12, cols: 6, label: '4×6' },
  { pairs: 16, cols: 4, label: '4×8' },
];

const PREVIEW_SECONDS = 2;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function starThreshold(pairs: number, moves: number): number {
  if (moves <= pairs * 1.4) return 3;
  if (moves <= pairs * 2) return 2;
  return 1;
}

export function MemoryMatchGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const hapticsEnabled = useSettingsStore(st => st.hapticsEnabled);
  const { levels, setGameLevel } = useProgressStore();

  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<MemoryMatchSaveState>('memory-match');
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<MemoryMatchSaveState | null>(null);

  const [level, setLevel] = useState(() => Math.min(levels['memory-match'] ?? 1, LEVEL_CONFIG.length));
  const [gameKey, setGameKey] = useState(0);

  const cfg = LEVEL_CONFIG[Math.min(level - 1, LEVEL_CONFIG.length - 1)];
  const CELL = Math.min(Math.floor((SCREEN_W - 48) / cfg.cols), 72);

  const [cards, setCards] = useState<string[]>(() => {
    const emojis = ALL_EMOJIS.slice(0, cfg.pairs);
    return shuffle([...emojis, ...emojis]);
  });

  const [preview, setPreview] = useState(true);
  const [countdown, setCountdown] = useState(PREVIEW_SECONDS);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState<number>(0);
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState(false);
  const [finalMoves, setFinalMoves] = useState(0);

  const s = useMemo(() => makeStyles(colors, CELL, cfg.cols), [colors, CELL, cfg.cols]);

  const initNewGame = useCallback((lv: number) => {
    const c = LEVEL_CONFIG[Math.min(lv - 1, LEVEL_CONFIG.length - 1)];
    const emojis = ALL_EMOJIS.slice(0, c.pairs);
    const newCards = shuffle([...emojis, ...emojis]);
    setCards(newCards);
    setFlipped(new Set());
    setMatched(new Set());
    setMoves(0);
    setFinalMoves(0);
    setDone(false);
    setGameKey(k => k + 1);
  }, []);

  useEffect(() => {
    const checkSaved = async () => {
      const result = await load();
      if (result.found && result.gameState) {
        setPendingSavedState(result.gameState);
        setResumeElapsed(result.elapsedSeconds);
        setShowResumeModal(true);
      } else {
        initNewGame(levels['memory-match'] ?? 1);
      }
    };
    checkSaved();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (done) { clear(); return; }
    save({ cards, matched: [...matched], moves }, timer.elapsedSeconds);
  }, [matched, moves]);

  const handleResume = useCallback(() => {
    setShowResumeModal(false);
    if (pendingSavedState) {
      setCards(pendingSavedState.cards);
      setMatched(new Set(pendingSavedState.matched));
      setMoves(pendingSavedState.moves);
    }
    timer.restoreAndResume(resumeElapsed);
    setPendingSavedState(null);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    setShowResumeModal(false);
    clear();
    initNewGame(levels['memory-match'] ?? 1);
    setPendingSavedState(null);
  }, [clear, initNewGame, levels]);

  useEffect(() => {
    setPreview(true);
    setCountdown(PREVIEW_SECONDS);

    const countInterval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(countInterval);
          setPreview(false);
          timer.start();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countInterval);
    };
  }, [gameKey]);

  const finish = useCallback((w: boolean, finalMovesCount: number) => {
    setFinalMoves(finalMovesCount);
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, timer]);

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

  const startNextLevel = useCallback(() => {
    const nextLevel = Math.min(level + 1, LEVEL_CONFIG.length);
    setLevel(nextLevel);
    setGameLevel('memory-match', nextLevel);
    initNewGame(nextLevel);
  }, [level, setGameLevel, initNewGame]);

  const playAgain = useCallback(() => {
    initNewGame(level);
  }, [level, initNewGame]);

  const stars = starThreshold(cfg.pairs, finalMoves);
  const isMaxLevel = level >= LEVEL_CONFIG.length;

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="🧠"
        gameName="Memory Match"
        elapsedSeconds={resumeElapsed}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.moveCount}>Moves: {moves}</Text>
        <View style={[s.levelBadge, { backgroundColor: colors.visual.bg }]}>
          <Text style={[s.levelText, { color: colors.visual.ink }]}>Level {level} · {cfg.label}</Text>
        </View>
        {preview && (
          <View style={[s.previewBadge, { backgroundColor: colors.logic.bg }]}>
            <Text style={[s.previewText, { color: colors.logic.ink }]}>
              {countdown > 0 ? `${countdown}s` : 'Go!'}
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
              <Text style={[s.cardEmoji, { fontSize: CELL * 0.45, lineHeight: CELL * 0.65 }]}>
                {isFlipped ? emoji : '?'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>🎴</Text>
            <Text style={s.modalTitle}>All Matched!</Text>

            <View style={s.starsRow}>
              {[1, 2, 3].map(n => (
                <Text key={n} style={[s.star, n <= stars && s.starFilled]}>★</Text>
              ))}
            </View>

            <Text style={s.modalSub}>{finalMoves} moves · {timer.elapsedSeconds}s</Text>
            <Text style={s.ratingLabel}>
              {stars === 3 ? 'Perfect memory!' : stars === 2 ? 'Well done!' : 'Keep practicing!'}
            </Text>

            {!isMaxLevel && (
              <TouchableOpacity style={s.modalBtn} onPress={startNextLevel}>
                <Text style={s.modalBtnText}>Next Level ({LEVEL_CONFIG[level]?.label})</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[s.modalBtn, !isMaxLevel && { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule }]} onPress={playAgain}>
              <Text style={[s.modalBtnText, !isMaxLevel && { color: colors.inkSoft }]}>Play Again</Text>
            </TouchableOpacity>
            {onBack && (
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule }]}
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

const makeStyles = (colors: ReturnType<typeof useTheme>, CELL: number, cols: number) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: CELL * cols + 8 * (cols - 1) + 2,
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 6,
  },
  moveCount: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.ink },
  levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  levelText: { fontFamily: fonts.extraBold, fontSize: 12 },
  previewBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  previewText: { fontFamily: fonts.bold, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', width: CELL * cols + 8 * (cols - 1) + 2 },
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
  cardEmoji: {},
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
