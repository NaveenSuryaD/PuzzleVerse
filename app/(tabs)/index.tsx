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
import { GameGlyph } from '../../src/components/GameGlyph';

const ALL_GAMES = getGamesByMVP(15);
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


function AnimatedTile({
  game, index, onPress, playsCount, streak, isFavorited, onFavorite, bestTime,
}: {
  game: GameDefinition;
  index: number;
  onPress: () => void;
  playsCount: number;
  streak: number;
  isFavorited: boolean;
  onFavorite: () => void;
  bestTime: number | null;
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
        <View style={s.tileTopRow}>
          <View style={[s.glyphWell, { backgroundColor: tone.bg }]}>
            <GameGlyph id={game.id} color={tone.ink} size={22} />
          </View>
          <TouchableOpacity
            style={s.heartBtn}
            onPress={onFavorite}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={15}
              color={isFavorited ? '#E26A2C' : colors.inkMuted}
            />
          </TouchableOpacity>
        </View>
        <View style={{ marginTop: 'auto' }}>
          <Text style={s.tileName} numberOfLines={1}>{game.name}</Text>
          <Text style={s.tileBlurb} numberOfLines={2}>{game.tagline}</Text>
        </View>
        <View style={s.tileFooter}>
          {streak > 0 && (
            <View style={s.tileStreak}>
              <Ionicons name="flame" size={12} color="#E26A2C" />
              <Text style={s.tileStreakText}>{streak}d</Text>
            </View>
          )}
          {bestTime !== null && (
            <View style={s.tilePB}>
              <Ionicons name="stopwatch-outline" size={11} color={tone.ink} />
              <Text style={[s.tilePBText, { color: tone.ink }]}>
                {Math.floor(bestTime / 60)}:{String(bestTime % 60).padStart(2, '0')}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const colors = useTheme();
  const { games: progressGames, overallStreak, favoritedGames, toggleFavorite } = useProgressStore();
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const s = useMemo(() => makeStyles(colors), [colors]);

  const filteredGames = activeCategory === 'all'
    ? ALL_GAMES
    : ALL_GAMES.filter(g => g.category === activeCategory);

  const mostPlayedGames = useMemo(() =>
    ALL_GAMES
      .filter(g => (progressGames[g.id]?.gamesPlayed ?? 0) > 0)
      .sort((a, b) => (progressGames[b.id]?.gamesPlayed ?? 0) - (progressGames[a.id]?.gamesPlayed ?? 0))
      .slice(0, 6),
    [progressGames]
  );

  const favoriteGamesList = useMemo(() =>
    favoritedGames
      .map(id => ALL_GAMES.find(g => g.id === id))
      .filter(Boolean) as typeof ALL_GAMES,
    [favoritedGames]
  );

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const todayISO = now.toISOString().slice(0, 10);
  const todayPlayed = useMemo(
    () => Object.values(progressGames).filter(g => g.lastPlayedDate === todayISO).length,
    [progressGames, todayISO],
  );

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

        {/* PuzzleVerse branded banner */}
        <View style={s.heroWrap}>
          <View style={s.brandBanner}>
            <View style={[s.bannerBlob1, { backgroundColor: colors.logic.soft }]} />
            <View style={[s.bannerBlob2, { backgroundColor: colors.word.soft }]} />
            <View style={[s.bannerBlob3, { backgroundColor: colors.classic.soft }]} />
            <View style={s.bannerContent}>
              <Text style={[s.bannerTitle, { color: colors.ink }]}>PuzzleVerse</Text>
              <Text style={[s.bannerTagline, { color: colors.inkSoft }]}>Every puzzle. Unlimited.</Text>
              {todayPlayed > 0 && (
                <View style={s.bannerStatRow}>
                  <Ionicons name="game-controller-outline" size={13} color={colors.inkMuted} />
                  <Text style={[s.bannerStat, { color: colors.inkMuted }]}>
                    {todayPlayed} game{todayPlayed !== 1 ? 's' : ''} played today
                  </Text>
                </View>
              )}
            </View>
            <View style={s.bannerQuadrant}>
              {(['word', 'number', 'logic', 'classic'] as const).map(cat => (
                <View key={cat} style={[s.bannerQuadCell, { backgroundColor: colors[cat].bg }]} />
              ))}
            </View>
          </View>
        </View>

        {/* Favorites / Most Played quick-access row */}
        {favoriteGamesList.length > 0 ? (
          <>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Favorites</Text>
              <Ionicons name="heart" size={14} color="#E26A2C" style={{ marginBottom: 2 }} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickRow}>
              {favoriteGamesList.map(game => {
                const tone = colors[game.category];
                return (
                  <TouchableOpacity
                    key={game.id}
                    style={[s.quickChip, { backgroundColor: colors.surface }]}
                    onPress={() => router.push(`/game/${game.id}`)}
                    activeOpacity={0.82}
                  >
                    <View style={[s.quickChipIcon, { backgroundColor: tone.bg }]}>
                      <GameGlyph id={game.id} color={tone.ink} size={18} />
                    </View>
                    <Text style={s.quickChipText} numberOfLines={1}>{game.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        ) : mostPlayedGames.length > 0 ? (
          <>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Most Played</Text>
              <Text style={s.sectionCount}>{mostPlayedGames.length} games</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickRow}>
              {mostPlayedGames.map(game => {
                const tone = colors[game.category];
                const plays = progressGames[game.id]?.gamesPlayed ?? 0;
                return (
                  <TouchableOpacity
                    key={game.id}
                    style={[s.quickChip, { backgroundColor: colors.surface }]}
                    onPress={() => router.push(`/game/${game.id}`)}
                    activeOpacity={0.82}
                  >
                    <View style={[s.quickChipIcon, { backgroundColor: tone.bg }]}>
                      <GameGlyph id={game.id} color={tone.ink} size={18} />
                    </View>
                    <Text style={s.quickChipText} numberOfLines={1}>{game.name}</Text>
                    <Text style={s.quickChipSub}>{plays}×</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        ) : null}

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
                <GameGlyph id="sudoku" color={colors.logic.ink} size={22} />
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
                isFavorited={favoritedGames.includes(game.id)}
                onFavorite={() => toggleFavorite(game.id)}
                bestTime={progress?.bestTimeSeconds ?? null}
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
  tileTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  glyphWell: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtn: {
    width: 28,
    height: 28,
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
  tileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  tileStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  tileStreakText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.inkSoft,
  },
  tilePB: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  tilePBText: {
    fontFamily: fonts.bold,
    fontSize: 11,
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
  brandBanner: {
    borderRadius: 28,
    padding: 22,
    minHeight: 128,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  bannerBlob1: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  bannerBlob2: {
    position: 'absolute',
    left: -10,
    bottom: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  bannerBlob3: {
    position: 'absolute',
    right: 80,
    bottom: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  bannerContent: {
    flex: 1,
    gap: 4,
  },
  bannerTitle: {
    fontFamily: fonts.black,
    fontSize: 28,
    letterSpacing: -0.8,
    lineHeight: 32,
  },
  bannerTagline: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  bannerStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  bannerStat: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  bannerQuadrant: {
    width: 56,
    height: 56,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginLeft: 16,
    flexShrink: 0,
  },
  bannerQuadCell: {
    width: 24,
    height: 24,
    borderRadius: 7,
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
  quickRow: {
    paddingHorizontal: 22,
    paddingBottom: 4,
    gap: 10,
    flexDirection: 'row',
  },
  quickChip: {
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    width: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quickChipIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 14,
  },
  quickChipSub: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: colors.inkMuted,
  },
  sectionRow: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
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
