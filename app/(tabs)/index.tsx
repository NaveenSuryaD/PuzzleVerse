import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { dark as colors } from '../../src/theme/colors';
import { spacing, radius } from '../../src/theme/spacing';
import { text as typography, fonts } from '../../src/theme/typography';
import { GameCard } from '../../src/components/GameCard';
import { GAMES, getGamesByMVP } from '../../src/constants/games';
import { useProgressStore } from '../../src/store/useProgressStore';

const MVP_GAMES = getGamesByMVP(1);

function AnimatedCard({ game, index, onPress, playsCount, streak }: {
  game: typeof GAMES[0];
  index: number;
  onPress: () => void;
  playsCount: number;
  streak: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);
  const scale = useSharedValue(0.92);

  React.useEffect(() => {
    const delay = Math.min(index * 35, 500);
    opacity.value = withDelay(delay, withTiming(1, { duration: 280 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 280 }));
    scale.value = withDelay(delay, withTiming(1, { duration: 280 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[animStyle, { flex: 1, margin: spacing.xs }]}>
      <GameCard game={game} onPress={onPress} playsCount={playsCount} streak={streak} />
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { games: progressGames } = useProgressStore();

  const renderItem = useCallback(({ item, index }: { item: typeof GAMES[0]; index: number }) => {
    const progress = progressGames[item.id];
    return (
      <AnimatedCard
        game={item}
        index={index}
        onPress={() => router.push(`/game/${item.id}`)}
        playsCount={progress?.gamesPlayed ?? 0}
        streak={progress?.currentStreak ?? 0}
      />
    );
  }, [progressGames, router]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>PuzzleVerse</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="search" size={22} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Featured Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>GAME OF THE DAY</Text>
        <Text style={styles.bannerTitle}>Sudoku Classic</Text>
        <Text style={styles.bannerSub}>Challenge yourself — 9x9 grid</Text>
        <TouchableOpacity
          style={styles.bannerButton}
          onPress={() => router.push('/game/sudoku')}
        >
          <Text style={styles.bannerButtonText}>Play Now</Text>
        </TouchableOpacity>
      </View>

      {/* Subtitle */}
      <Text style={styles.sectionTitle}>All Puzzles</Text>

      {/* Game Grid */}
      <FlatList
        data={MVP_GAMES}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  logo: {
    fontSize: 22,
    fontFamily: fonts.black,
    color: colors.brand.primary,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.lg,
    backgroundColor: colors.brand.primary,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  bannerLabel: {
    ...typography.label,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xs,
  },
  bannerTitle: {
    ...typography.h1,
    color: '#FFFFFF',
  },
  bannerSub: {
    ...typography.body,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.sm,
  },
  bannerButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  bannerButtonText: {
    ...typography.h3,
    color: '#FFFFFF',
  },
  sectionTitle: {
    ...typography.h1,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  grid: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
