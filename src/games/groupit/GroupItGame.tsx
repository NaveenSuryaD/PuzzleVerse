import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Share,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../theme/useTheme';
import { useSettingsStore } from '../../store/useSettingsStore';
import { fonts } from '../../theme/typography';
import { playSound } from '../../audio/sounds';
import { useSaveGame } from '../../utils/gameSave';
import { getDailyPuzzle, getRandomPuzzle } from './puzzles';
import type { Puzzle, PuzzleGroup, GameStatus, Tier } from './types';

const { width: SCREEN_W } = Dimensions.get('window');
const TILE_COLS = 4;
const TILE_GAP = 8;
const TILE_HPAD = 16;
const TILE_W = Math.floor((SCREEN_W - TILE_HPAD * 2 - TILE_GAP * (TILE_COLS - 1)) / TILE_COLS);
const TILE_H = 54;
const MAX_MISTAKES = 4;

// Stagger + flip duration: 4 tiles × 150ms stagger + 320ms flip + 80ms buffer
const FLIP_TOTAL_MS = 4 * 150 + 320 + 80;

const TIER_EMOJI: Record<Tier, string> = { 1: '🟨', 2: '🟩', 3: '🟦', 4: '🟪' };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TIER_COLORS = (colors: ThemeColors): Record<Tier, { bg: string; text: string }> => ({
  1: { bg: colors.logic.bg,    text: colors.logic.ink },
  2: { bg: colors.number.bg,   text: colors.number.ink },
  3: { bg: colors.classic.bg,  text: colors.classic.ink },
  4: { bg: colors.visual.bg,   text: colors.visual.ink },
});

// ─── Flip Tile ────────────────────────────────────────────────────────────────

interface FlipTileProps {
  word: string;
  isSelected: boolean;
  isFlipping: boolean;
  flipIndex: number;
  tileColor: { bg: string; text: string };
  colors: ThemeColors;
  onPress: () => void;
  disabled: boolean;
  reducedMotion: boolean;
}

const FlipTile: React.FC<FlipTileProps> = ({
  word,
  isSelected,
  isFlipping,
  flipIndex,
  tileColor,
  colors,
  onPress,
  disabled,
  reducedMotion,
}) => {
  const flip = useSharedValue(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (isFlipping) {
      if (reducedMotion) {
        setRevealed(true);
        return;
      }
      setRevealed(false);
      flip.value = 0;
      flip.value = withDelay(
        flipIndex * 150,
        withTiming(1, { duration: 320, easing: Easing.linear }),
      );
    } else {
      flip.value = 0;
      setRevealed(false);
    }
  }, [isFlipping, flipIndex, reducedMotion]);

  useAnimatedReaction(
    () => flip.value,
    (curr, prev) => {
      if (prev !== null && prev < 0.5 && curr >= 0.5) {
        runOnJS(setRevealed)(true);
      }
    },
  );

  const flipStyle = useAnimatedStyle(() => {
    const angle = interpolate(flip.value, [0, 0.5, 1], [0, 90, 0]);
    return {
      transform: [{ perspective: 700 }, { rotateX: `${angle}deg` }],
    };
  });

  const isDark = colors.bg === '#16110A';
  const bg = revealed
    ? tileColor.bg
    : isSelected
    ? (isDark ? colors.surface2 : colors.rule)
    : colors.surface;
  const textCol = revealed ? tileColor.text : colors.ink;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.82} disabled={disabled}>
      <Animated.View
        style={[
          {
            width: TILE_W,
            height: TILE_H,
            borderRadius: 12,
            backgroundColor: bg,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
            borderWidth: isSelected && !revealed ? 2.5 : 0,
            borderColor: isSelected && !revealed ? colors.ink : 'transparent',
            shadowColor: colors.ink,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: revealed ? 0 : 0.05,
            shadowRadius: 4,
            elevation: revealed ? 0 : 2,
          },
          flipStyle,
        ]}
      >
        <Text
          style={{
            fontFamily: fonts.extraBold,
            fontSize: 13,
            color: textCol,
            letterSpacing: 0.3,
            textAlign: 'center',
            includeFontPadding: false,
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {word}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Main Game ────────────────────────────────────────────────────────────────

interface GroupItGameProps {
  onComplete?: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  savedStateJSON?: string;
}

export const GroupItGame: React.FC<GroupItGameProps> = ({ onComplete, onBack, savedStateJSON }) => {
  const colors = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const tierColors = useMemo(() => TIER_COLORS(colors), [colors]);
  const hapticsEnabled = useSettingsStore(st => st.hapticsEnabled);
  const reducedMotion = useSettingsStore(st => st.reducedMotion);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => { try { return savedStateJSON ? JSON.parse(savedStateJSON) : null; } catch { return null; } }, []);
  const [puzzle, setPuzzle] = useState<Puzzle>(() => saved?.puzzle ?? getDailyPuzzle());
  const [displayWords, setDisplayWords] = useState<string[]>(() =>
    shuffle(puzzle.groups.flatMap(g => [...g.words]))
  );
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [foundGroups, setFoundGroups] = useState<PuzzleGroup[]>(() => saved?.foundGroups ?? []);
  const [pendingGroup, setPendingGroup] = useState<PuzzleGroup | null>(null);
  const [mistakes, setMistakes] = useState<number>(() => saved?.mistakes ?? 0);
  const [gameStatus, setGameStatus] = useState<GameStatus>(() => (saved?.gameStatus ?? 'playing') as GameStatus);
  const [oneAway, setOneAway] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Each entry is tier for a correct guess, null for wrong
  const [guessHistory, setGuessHistory] = useState<Array<Tier | null>>([]);

  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useSaveGame('group-it', () => ({ puzzle, foundGroups, mistakes, gameStatus }), gameStatus === 'playing', [foundGroups, mistakes], elapsedRef);

  // Shake animation for wrong guess
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  // Scale for selected tile pop
  const tileScale = useSharedValue(1);
  const tileScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tileScale.value }],
  }));

  useEffect(() => {
    elapsedRef.current = 0;
    timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [puzzle]);

  const toggleSelect = useCallback((word: string) => {
    if (gameStatus !== 'playing' || isSubmitting || pendingGroup !== null) return;
    setSelectedWords(prev => {
      if (prev.includes(word)) return prev.filter(w => w !== word);
      if (prev.length >= 4) return prev;
      if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      tileScale.value = withSequence(
        withTiming(0.94, { duration: 60 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
      return [...prev, word];
    });
  }, [gameStatus, isSubmitting, pendingGroup, hapticsEnabled, tileScale]);

  const handleShuffle = useCallback(() => {
    setDisplayWords(prev => shuffle(prev));
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [hapticsEnabled]);

  const handleSubmit = useCallback(() => {
    if (selectedWords.length !== 4 || isSubmitting || gameStatus !== 'playing' || pendingGroup !== null) return;

    const matchingGroup = puzzle.groups.find(
      g => selectedWords.every(w => g.words.includes(w)) &&
           !foundGroups.some(f => f.category === g.category)
    );

    if (matchingGroup) {
      setIsSubmitting(true);
      if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSound('correct');

      // Record this guess in history
      setGuessHistory(prev => [...prev, matchingGroup.tier]);

      // Start flip animation
      setPendingGroup(matchingGroup);
      const wordsToRemove = [...selectedWords];

      const finalizeFn = () => {
        setFoundGroups(prev => {
          const newFoundGroups = [...prev, matchingGroup];

          if (newFoundGroups.length === 4) {
            if (timerRef.current) clearInterval(timerRef.current);
            setGameStatus('won');
            playSound('win');
            if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => setShowComplete(true), 300);
            onComplete?.(true, elapsedRef.current);
          }

          return newFoundGroups;
        });
        setDisplayWords(prev => prev.filter(w => !wordsToRemove.includes(w)));
        setSelectedWords([]);
        setPendingGroup(null);
        setIsSubmitting(false);
      };

      if (reducedMotion) {
        // No animation — instant reveal
        setTimeout(finalizeFn, 100);
      } else {
        setTimeout(finalizeFn, FLIP_TOTAL_MS);
      }
    } else {
      // Wrong guess
      setIsSubmitting(true);
      setGuessHistory(prev => [...prev, null]);

      // Check one-away
      const maxMatch = Math.max(...puzzle.groups.map(g =>
        selectedWords.filter(w => g.words.includes(w)).length
      ));
      if (maxMatch === 3) {
        setOneAway(true);
        setTimeout(() => setOneAway(false), 2000);
      }

      if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeX.value = withSequence(
        withTiming(-10, { duration: 55 }),
        withTiming(10, { duration: 55 }),
        withTiming(-8, { duration: 55 }),
        withTiming(8, { duration: 55 }),
        withTiming(-5, { duration: 55 }),
        withTiming(5, { duration: 55 }),
        withTiming(0, { duration: 55 }),
      );

      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);

      setTimeout(() => {
        setSelectedWords([]);
        setIsSubmitting(false);

        if (newMistakes >= MAX_MISTAKES) {
          if (timerRef.current) clearInterval(timerRef.current);
          setFoundGroups(puzzle.groups.slice());
          setDisplayWords([]);
          setGameStatus('lost');
          setTimeout(() => setShowComplete(true), 400);
          onComplete?.(false, elapsedRef.current);
        }
      }, 500);
    }
  }, [selectedWords, isSubmitting, gameStatus, pendingGroup, puzzle, foundGroups, mistakes, hapticsEnabled, reducedMotion, shakeX, onComplete]);

  const startNewGame = useCallback(() => {
    const next = getRandomPuzzle(puzzle.id);
    setPuzzle(next);
    setDisplayWords(shuffle(next.groups.flatMap(g => [...g.words])));
    setSelectedWords([]);
    setFoundGroups([]);
    setPendingGroup(null);
    setMistakes(0);
    setGameStatus('playing');
    setShowComplete(false);
    setIsSubmitting(false);
    setOneAway(false);
    setGuessHistory([]);
    elapsedRef.current = 0;
  }, [puzzle.id]);

  const handleShare = useCallback(async () => {
    const rows = guessHistory.map(tier => {
      if (tier === null) return '⬛⬛⬛⬛';
      const e = TIER_EMOJI[tier];
      return `${e}${e}${e}${e}`;
    });
    const mistakesLeft = MAX_MISTAKES - mistakes;
    const resultLine = gameStatus === 'won'
      ? `✅ ${mistakesLeft} mistake${mistakesLeft !== 1 ? 's' : ''} to spare`
      : '❌ Did not finish';
    const text = `PuzzleVerse Group It #${puzzle.id}\n${resultLine}\n\n${rows.join('\n')}`;
    try {
      await Share.share({ message: text });
    } catch {
      // User cancelled share
    }
  }, [guessHistory, mistakes, gameStatus, puzzle.id]);

  const isDark = colors.bg === '#16110A';

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Found groups */}
      {foundGroups
        .slice()
        .sort((a, b) => a.tier - b.tier)
        .map(group => (
          <View
            key={group.category}
            style={[s.foundBar, { backgroundColor: tierColors[group.tier].bg }]}
          >
            <Text style={[s.foundCategory, { color: tierColors[group.tier].text }]}>
              {group.category.toUpperCase()}
            </Text>
            <Text style={[s.foundWords, { color: tierColors[group.tier].text }]}>
              {group.words.join('  ·  ')}
            </Text>
          </View>
        ))}

      {/* Word grid */}
      {displayWords.length > 0 && (
        <Animated.View style={[s.grid, shakeStyle]}>
          {displayWords.map(word => {
            const isSelected = selectedWords.includes(word);
            const pendingIdx = pendingGroup ? pendingGroup.words.indexOf(word as any) : -1;
            const isFlipping = pendingIdx !== -1;
            const tileColor = isFlipping ? tierColors[pendingGroup!.tier] : { bg: colors.surface, text: colors.ink };

            return (
              <FlipTile
                key={word}
                word={word}
                isSelected={isSelected}
                isFlipping={isFlipping}
                flipIndex={pendingIdx >= 0 ? pendingIdx : 0}
                tileColor={tileColor}
                colors={colors}
                onPress={() => toggleSelect(word)}
                disabled={gameStatus !== 'playing' || isSubmitting || pendingGroup !== null}
                reducedMotion={reducedMotion}
              />
            );
          })}
        </Animated.View>
      )}

      {/* One-away hint */}
      {oneAway && (
        <View style={s.oneAwayBanner}>
          <Text style={s.oneAwayText}>One away…</Text>
        </View>
      )}

      {/* Mistakes row */}
      <View style={s.mistakesRow}>
        <Text style={s.mistakesLabel}>Mistakes remaining</Text>
        <View style={s.mistakeDots}>
          {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                i >= mistakes ? s.dotActive : s.dotUsed,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Action buttons */}
      <View style={s.actions}>
        <TouchableOpacity
          style={s.actionBtn}
          onPress={handleShuffle}
          disabled={gameStatus !== 'playing' || pendingGroup !== null}
          activeOpacity={0.75}
        >
          <Text style={s.actionBtnText}>Shuffle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.actionBtn}
          onPress={() => setSelectedWords([])}
          disabled={selectedWords.length === 0 || gameStatus !== 'playing' || pendingGroup !== null}
          activeOpacity={0.75}
        >
          <Text style={s.actionBtnText}>Deselect</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.submitBtn,
            selectedWords.length === 4 && gameStatus === 'playing' && pendingGroup === null
              ? { backgroundColor: colors.ink }
              : { backgroundColor: colors.rule },
          ]}
          onPress={handleSubmit}
          disabled={selectedWords.length !== 4 || gameStatus !== 'playing' || isSubmitting || pendingGroup !== null}
          activeOpacity={0.82}
        >
          <Text
            style={[
              s.submitBtnText,
              {
                color: selectedWords.length === 4 && gameStatus === 'playing' && pendingGroup === null
                  ? colors.bg
                  : colors.inkMuted,
              },
            ]}
          >
            Submit
          </Text>
        </TouchableOpacity>
      </View>

      {/* Complete modal */}
      <Modal visible={showComplete} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={[
              s.trophyCircle,
              { backgroundColor: gameStatus === 'won' ? colors.number.bg : colors.word.bg },
            ]}>
              <Text style={s.trophyEmoji}>{gameStatus === 'won' ? '🏆' : '💡'}</Text>
            </View>

            <Text style={s.completeTitle}>
              {gameStatus === 'won' ? 'Brilliant!' : 'Better luck next time'}
            </Text>
            <Text style={s.completeSub}>
              {gameStatus === 'won'
                ? `${MAX_MISTAKES - mistakes} mistake${MAX_MISTAKES - mistakes !== 1 ? 's' : ''} to spare`
                : `${mistakes} mistake${mistakes !== 1 ? 's' : ''} made`}
            </Text>

            {/* Share grid */}
            <View style={s.shareGrid}>
              {guessHistory.map((tier, i) => (
                <View key={i} style={s.shareRow}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <View
                      key={j}
                      style={[
                        s.shareSquare,
                        {
                          backgroundColor: tier !== null
                            ? tierColors[tier].bg
                            : (isDark ? '#4A4540' : '#C8BFB0'),
                        },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>

            {/* Share button */}
            <TouchableOpacity
              style={[s.shareBtn, { backgroundColor: colors.surface2, borderColor: colors.divider }]}
              onPress={handleShare}
              activeOpacity={0.75}
            >
              <Ionicons name="share-outline" size={16} color={colors.ink} />
              <Text style={[s.shareBtnText, { color: colors.ink }]}>Share Result</Text>
            </TouchableOpacity>

            {/* Show all groups in result */}
            <View style={s.resultGroups}>
              {puzzle.groups
                .slice()
                .sort((a, b) => a.tier - b.tier)
                .map(group => (
                  <View
                    key={group.category}
                    style={[s.resultGroup, { backgroundColor: tierColors[group.tier].bg }]}
                  >
                    <Text style={[s.resultGroupCategory, { color: tierColors[group.tier].text }]}>
                      {group.category}
                    </Text>
                    <Text style={[s.resultGroupWords, { color: tierColors[group.tier].text }]}>
                      {group.words.join(', ')}
                    </Text>
                  </View>
                ))}
            </View>

            <TouchableOpacity
              style={[s.playAgainBtn, { backgroundColor: colors.ink }]}
              onPress={startNewGame}
              activeOpacity={0.82}
            >
              <Ionicons name="refresh" size={16} color={colors.bg} />
              <Text style={[s.playAgainText, { color: colors.bg }]}>Next Puzzle</Text>
            </TouchableOpacity>
            {onBack && (
              <TouchableOpacity
                style={[s.playAgainBtn, {
                  backgroundColor: 'transparent',
                  borderWidth: 1.5,
                  borderColor: colors.rule,
                  marginTop: 10,
                }]}
                onPress={onBack}
                activeOpacity={0.82}
              >
                <Text style={[s.playAgainText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: TILE_HPAD,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 8,
  },

  // Found group bars
  foundBar: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 4,
  },
  foundCategory: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    letterSpacing: 0.6,
  },
  foundWords: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },

  // Word grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
    marginVertical: 4,
  },

  // One-away
  oneAwayBanner: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  oneAwayText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.inkSoft,
  },

  // Mistakes
  mistakesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  mistakesLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.inkMuted,
  },
  mistakeDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dotActive: {
    backgroundColor: colors.inkSoft,
  },
  dotUsed: {
    backgroundColor: colors.rule,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  actionBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  submitBtn: {
    flex: 1.4,
    height: 46,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },

  // Complete modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 56,
    paddingBottom: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  trophyCircle: {
    position: 'absolute',
    top: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  trophyEmoji: { fontSize: 36 },
  completeTitle: {
    fontFamily: fonts.black,
    fontSize: 24,
    color: colors.ink,
    letterSpacing: -0.4,
    marginBottom: 4,
    textAlign: 'center',
  },
  completeSub: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.inkMuted,
    marginBottom: 14,
  },

  // Share grid
  shareGrid: {
    gap: 4,
    marginBottom: 12,
  },
  shareRow: {
    flexDirection: 'row',
    gap: 4,
  },
  shareSquare: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },

  // Share button
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  shareBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },

  resultGroups: {
    width: '100%',
    gap: 6,
    marginBottom: 20,
  },
  resultGroup: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  resultGroupCategory: {
    fontFamily: fonts.extraBold,
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  resultGroupWords: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  playAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
    width: '100%',
    justifyContent: 'center',
  },
  playAgainText: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
});
