import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../src/theme/useTheme';
import { fonts } from '../../src/theme/typography';
import { GAMES, getGamesByMVP } from '../../src/constants/games';
import type { GameDefinition } from '../../src/constants/games';
import { useProgressStore } from '../../src/store/useProgressStore';

const ALL_GAMES = getGamesByMVP(7);
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TILE_WIDTH = (SCREEN_WIDTH - 22 * 2 - 12) / 2;

type Category = 'all' | 'word' | 'number' | 'logic' | 'visual' | 'classic';

const PILLS: { key: Category; label: string }[] = [
  { key: 'all',     label: 'All' },
  { key: 'word',    label: 'Word' },
  { key: 'number',  label: 'Number' },
  { key: 'logic',   label: 'Logic' },
  { key: 'visual',  label: 'Visual' },
  { key: 'classic', label: 'Classic' },
];

// Text-based glyphs for each category (no SVG needed)
function CategoryGlyph({ cat, color }: { cat: string; color: string }) {
  const s: Record<string, { text: string; size: number }> = {
    word:    { text: 'Aa', size: 24 },
    number:  { text: '7',  size: 26 },
    logic:   { text: '≡',  size: 26 },
    visual:  { text: '◆',  size: 22 },
    classic: { text: '♟',  size: 24 },
  };
  const g = s[cat] ?? { text: '?', size: 22 };
  return (
    <Text style={{ fontFamily: fonts.black, fontSize: g.size, color, lineHeight: g.size + 4 }}>
      {g.text}
    </Text>
  );
}

// Grid glyph for logic/sudoku
function GridGlyph({ color }: { color: string }) {
  return (
    <View style={{ width: 26, height: 26, flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <View key={i} style={{
          width: 7, height: 7, borderRadius: 1.5,
          backgroundColor: color, opacity: i % 2 === 0 ? 1 : 0.55,
        }} />
      ))}
    </View>
  );
}

function getGameGlyph(game: GameDefinition, color: string) {
  if (game.id === 'sudoku') return <GridGlyph color={color} />;
  if (game.id === 'word-search') {
    return <Ionicons name="search" size={24} color={color} />;
  }
  if (game.id === 'group-it') {
    return <Ionicons name="grid" size={24} color={color} />;
  }
  if (game.id === 'hangman') {
    return <Text style={{ fontFamily: fonts.black, fontSize: 22, color, lineHeight: 26 }}>_</Text>;
  }
  if (game.id === 'number-bonds') {
    return <Text style={{ fontFamily: fonts.black, fontSize: 22, color, lineHeight: 26 }}>+</Text>;
  }
  if (game.id === 'crossword-mini') {
    return <Ionicons name="pencil" size={22} color={color} />;
  }
  if (game.id === 'pattern-recog') {
    return <Ionicons name="eye-outline" size={22} color={color} />;
  }
  if (game.id === 'sequence-fill') {
    return <Text style={{ fontFamily: fonts.black, fontSize: 20, color, lineHeight: 24 }}>…</Text>;
  }
  if (game.id === 'math-sprint') {
    return <Ionicons name="flash" size={22} color={color} />;
  }
  return <CategoryGlyph cat={game.category} color={color} />;
}

function AnimatedTile({
  game, index, onPress, playsCount, streak,
}: {
  game: GameDefinition;
  index: number;
  onPress: () => void;
  playsCount: number;
  streak: number;
}) {
  const colors = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  React.useEffect(() => {
    const delay = Math.min(index * 40, 480);
    opacity.value = withDelay(delay, withTiming(1, { duration: 260 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 260 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const tone = colors[game.category];
  const s = useMemo(() => makeTileStyles(colors), [colors]);

  return (
    <Animated.View style={[animStyle, { width: TILE_WIDTH }]}>
      <TouchableOpacity style={s.tile} onPress={onPress} activeOpacity={0.82}>
        <View style={[s.glyphWell, { backgroundColor: tone.bg }]}>
          {getGameGlyph(game, tone.ink)}
        </View>
        <View style={{ marginTop: 'auto' }}>
          <Text style={s.tileName} numberOfLines={1}>{game.name}</Text>
          <Text style={s.tileBlurb} numberOfLines={2}>{game.tagline}</Text>
        </View>
        {streak > 0 && (
          <View style={s.tileStreak}>
            <Ionicons name="flame" size={12} color="#E26A2C" />
            <Text style={s.tileStreakText}>{streak} day streak</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const colors = useTheme();
  const { games: progressGames, overallStreak } = useProgressStore();
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const s = useMemo(() => makeStyles(colors), [colors]);

  const filteredGames = activeCategory === 'all'
    ? ALL_GAMES
    : ALL_GAMES.filter(g => g.category === activeCategory);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const wordGuessProgress = progressGames['word-guess'];

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{greeting}</Text>
            <Text style={s.userName}>PuzzleVerse</Text>
          </View>
          <View style={s.headerActions}>
            {overallStreak > 0 && (
              <View style={s.streakPill}>
                <Ionicons name="flame" size={14} color="#E26A2C" />
                <Text style={s.streakCount}>{overallStreak}</Text>
              </View>
            )}
            <TouchableOpacity style={s.iconButton} onPress={() => router.push('/search')} activeOpacity={0.7}>
              <Ionicons name="search-outline" size={20} color={colors.inkSoft} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero — Today's Puzzle */}
        <View style={s.heroWrap}>
          <TouchableOpacity
            style={[s.heroCard, { backgroundColor: colors.word.bg }]}
            onPress={() => router.push('/game/word-guess?mode=daily')}
            activeOpacity={0.88}
          >
            {/* Decorative blobs */}
            <View style={[s.heroBlob1, { backgroundColor: colors.word.soft }]} />
            <View style={[s.heroBlob2, { backgroundColor: colors.word.soft }]} />

            <View style={s.heroEyebrow}>
              <View style={[s.eyebrowDot, { backgroundColor: colors.word.ink }]} />
              <Text style={[s.eyebrowText, { color: colors.word.ink }]}>TODAY'S PUZZLE</Text>
            </View>
            <Text style={[s.heroTitle, { color: colors.word.ink }]}>Word Guess</Text>
            <Text style={[s.heroSub, { color: colors.word.ink }]}>Guess the 5-letter word · 6 tries</Text>

            <View style={s.heroFooter}>
              {wordGuessProgress && wordGuessProgress.gamesPlayed > 0 && (
                <View style={s.solvedRow}>
                  <Ionicons name="trophy-outline" size={12} color={colors.word.ink} />
                  <Text style={[s.solvedText, { color: colors.word.ink }]}>
                    {wordGuessProgress.gamesWon} solved
                  </Text>
                </View>
              )}
              <View style={[s.playButton, { backgroundColor: colors.ink }]}>
                <Ionicons name="play" size={13} color={colors.bg} />
                <Text style={[s.playButtonText, { color: colors.bg }]}>Play</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.pillsRow}
          style={s.pillsScroll}
        >
          {PILLS.map((pill, i) => {
            const active = activeCategory === pill.key;
            const catColor = pill.key !== 'all' ? colors[pill.key]?.bg : undefined;
            return (
              <TouchableOpacity
                key={pill.key}
                style={[s.pill, active && s.pillActive]}
                onPress={() => setActiveCategory(pill.key)}
                activeOpacity={0.75}
              >
                {catColor && !active && (
                  <View style={[s.pillDot, { backgroundColor: catColor }]} />
                )}
                <Text style={[s.pillText, active && s.pillTextActive]}>
                  {pill.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Continue */}
        {progressGames['sudoku']?.gamesPlayed > 0 && (
          <>
            <Text style={s.sectionEyebrow}>PICK UP WHERE YOU LEFT OFF</Text>
            <TouchableOpacity
              style={s.continueCard}
              onPress={() => router.push('/game/sudoku')}
              activeOpacity={0.82}
            >
              <View style={[s.continueWell, { backgroundColor: colors.logic.bg }]}>
                <GridGlyph color={colors.logic.ink} />
              </View>
              <View style={s.continueInfo}>
                <Text style={s.continueName}>Sudoku Classic</Text>
                <Text style={s.continueSub}>
                  {progressGames['sudoku']?.gamesPlayed ?? 0} games played
                </Text>
                <View style={s.progressBar}>
                  <View style={[s.progressFill, {
                    backgroundColor: colors.logic.ink,
                    width: `${Math.min(((progressGames['sudoku']?.gamesWon ?? 0) / Math.max(progressGames['sudoku']?.gamesPlayed ?? 1, 1)) * 100, 100)}%` as any,
                  }]} />
                </View>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.inkMuted} />
            </TouchableOpacity>
          </>
        )}

        {/* All puzzles */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>All puzzles</Text>
          <Text style={s.sectionCount}>{filteredGames.length} games</Text>
        </View>

        <View style={s.grid}>
          {filteredGames.map((game, index) => {
            const progress = progressGames[game.id];
            return (
              <AnimatedTile
                key={game.id}
                game={game}
                index={index}
                onPress={() => router.push(`/game/${game.id}`)}
                playsCount={progress?.gamesPlayed ?? 0}
                streak={progress?.currentStreak ?? 0}
              />
            );
          })}
        </View>

        {filteredGames.length === 0 && (
          <View style={s.emptyState}>
            <Text style={s.emptyText}>More coming soon</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeTileStyles = (colors: ThemeColors) => StyleSheet.create({
  tile: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 16,
    minHeight: 168,
    gap: 10,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  glyphWell: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileName: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    color: colors.ink,
    lineHeight: 20,
  },
  tileBlurb: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 3,
    lineHeight: 17,
  },
  tileStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tileStreakText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.inkSoft,
  },
});

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  header: {
    paddingTop: 14,
    paddingHorizontal: 22,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  greeting: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.inkMuted,
  },
  userName: {
    fontFamily: fonts.black,
    fontSize: 26,
    color: colors.ink,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakPill: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  streakCount: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: colors.ink,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroWrap: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 4,
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    minHeight: 168,
    overflow: 'hidden',
    gap: 0,
  },
  heroBlob1: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  heroBlob2: {
    position: 'absolute',
    right: 30,
    bottom: -40,
    width: 90,
    height: 90,
    borderRadius: 24,
    transform: [{ rotate: '20deg' }],
  },
  heroEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eyebrowText: {
    fontFamily: fonts.extraBold,
    fontSize: 12,
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontFamily: fonts.black,
    fontSize: 30,
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  heroSub: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    marginTop: 8,
    opacity: 0.8,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 14,
  },
  solvedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  solvedText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    opacity: 0.8,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  playButtonText: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  pillsScroll: {},
  pillsRow: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 6,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  pillActive: {
    backgroundColor: colors.ink,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.inkSoft,
  },
  pillTextActive: {
    color: colors.bg,
  },
  sectionEyebrow: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    color: colors.inkMuted,
    letterSpacing: 0.6,
    paddingHorizontal: 22,
    paddingBottom: 8,
  },
  continueCard: {
    marginHorizontal: 22,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  continueWell: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueInfo: {
    flex: 1,
    minWidth: 0,
  },
  continueName: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: colors.ink,
  },
  continueSub: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  progressBar: {
    height: 5,
    backgroundColor: colors.rule,
    borderRadius: 99,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },
  sectionRow: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fonts.black,
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  sectionCount: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.inkMuted,
  },
  grid: {
    paddingHorizontal: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.inkMuted,
  },
});
