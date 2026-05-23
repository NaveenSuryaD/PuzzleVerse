import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../theme/useTheme';
import { useSettingsStore } from '../../store/useSettingsStore';
import { fonts } from '../../theme/typography';
import { playSound } from '../../audio/sounds';
import { getDailyPuzzle, getRandomPuzzle } from './puzzles';
import type { Puzzle, PuzzleGroup, GameStatus, Tier } from './types';

const { width: SCREEN_W } = Dimensions.get('window');
const TILE_COLS = 4;
const TILE_GAP = 8;
const TILE_HPAD = 16;
const TILE_W = Math.floor((SCREEN_W - TILE_HPAD * 2 - TILE_GAP * (TILE_COLS - 1)) / TILE_COLS);
const TILE_H = 54;
const MAX_MISTAKES = 4;

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

interface GroupItGameProps {
  onComplete?: (won: boolean, timeSeconds: number) => void;
}

export const GroupItGame: React.FC<GroupItGameProps> = ({ onComplete }) => {
  const colors = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const tierColors = useMemo(() => TIER_COLORS(colors), [colors]);
  const hapticsEnabled = useSettingsStore(st => st.hapticsEnabled);

  const [puzzle, setPuzzle] = useState<Puzzle>(() => getDailyPuzzle());
  const [displayWords, setDisplayWords] = useState<string[]>(() =>
    shuffle(puzzle.groups.flatMap(g => [...g.words]))
  );
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [foundGroups, setFoundGroups] = useState<PuzzleGroup[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [oneAway, setOneAway] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedTimeRef = useRef(0);

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
    if (gameStatus !== 'playing' || isSubmitting) return;
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
  }, [gameStatus, isSubmitting, hapticsEnabled, tileScale]);

  const handleShuffle = useCallback(() => {
    setDisplayWords(prev => shuffle(prev));
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [hapticsEnabled]);

  const handleSubmit = useCallback(() => {
    if (selectedWords.length !== 4 || isSubmitting || gameStatus !== 'playing') return;

    const matchingGroup = puzzle.groups.find(
      g => selectedWords.every(w => g.words.includes(w)) &&
           !foundGroups.some(f => f.category === g.category)
    );

    if (matchingGroup) {
      setIsSubmitting(true);
      if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSound('correct');

      const newFoundGroups = [...foundGroups, matchingGroup];
      setFoundGroups(newFoundGroups);
      setDisplayWords(prev => prev.filter(w => !selectedWords.includes(w)));
      setSelectedWords([]);
      setIsSubmitting(false);

      if (newFoundGroups.length === 4) {
        if (timerRef.current) clearInterval(timerRef.current);
        completedTimeRef.current = elapsedRef.current;
        setGameStatus('won');
        playSound('win');
        if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => setShowComplete(true), 600);
        onComplete?.(true, elapsedRef.current);
      }
    } else {
      // Wrong guess
      setIsSubmitting(true);

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
          completedTimeRef.current = elapsedRef.current;
          // Reveal all remaining groups
          setFoundGroups(puzzle.groups.slice());
          setDisplayWords([]);
          setGameStatus('lost');
          setTimeout(() => setShowComplete(true), 400);
          onComplete?.(false, elapsedRef.current);
        }
      }, 500);
    }
  }, [selectedWords, isSubmitting, gameStatus, puzzle, foundGroups, mistakes, hapticsEnabled, shakeX, onComplete]);

  const startNewGame = useCallback(() => {
    const next = getRandomPuzzle(puzzle.id);
    setPuzzle(next);
    setDisplayWords(shuffle(next.groups.flatMap(g => [...g.words])));
    setSelectedWords([]);
    setFoundGroups([]);
    setMistakes(0);
    setGameStatus('playing');
    setShowComplete(false);
    setIsSubmitting(false);
    setOneAway(false);
    elapsedRef.current = 0;
  }, [puzzle.id]);

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
            return (
              <TouchableOpacity
                key={word}
                onPress={() => toggleSelect(word)}
                activeOpacity={0.82}
              >
                <Animated.View
                  style={[
                    s.tile,
                    isSelected && { backgroundColor: isDark ? colors.surface2 : colors.rule },
                    isSelected && s.tileSelected,
                    isSelected ? tileScaleStyle : undefined,
                  ]}
                >
                  <Text
                    style={[s.tileText, isSelected && s.tileTextSelected]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {word}
                  </Text>
                </Animated.View>
              </TouchableOpacity>
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
          disabled={gameStatus !== 'playing'}
          activeOpacity={0.75}
        >
          <Text style={s.actionBtnText}>Shuffle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.actionBtn}
          onPress={() => setSelectedWords([])}
          disabled={selectedWords.length === 0 || gameStatus !== 'playing'}
          activeOpacity={0.75}
        >
          <Text style={s.actionBtnText}>Deselect</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.submitBtn,
            selectedWords.length === 4 && gameStatus === 'playing'
              ? { backgroundColor: colors.ink }
              : { backgroundColor: colors.rule },
          ]}
          onPress={handleSubmit}
          disabled={selectedWords.length !== 4 || gameStatus !== 'playing' || isSubmitting}
          activeOpacity={0.82}
        >
          <Text
            style={[
              s.submitBtnText,
              { color: selectedWords.length === 4 && gameStatus === 'playing' ? colors.bg : colors.inkMuted },
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
  tile: {
    width: TILE_W,
    height: TILE_H,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tileSelected: {
    borderWidth: 2.5,
    borderColor: colors.ink,
    shadowOpacity: 0,
    elevation: 0,
  },
  tileText: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    color: colors.ink,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  tileTextSelected: {
    color: colors.ink,
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
    marginBottom: 18,
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
