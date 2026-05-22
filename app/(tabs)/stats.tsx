import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { dark as colors } from '../../src/theme/colors';
import { spacing, radius } from '../../src/theme/spacing';
import { text as typography } from '../../src/theme/typography';
import { useProgressStore } from '../../src/store/useProgressStore';
import { GAMES } from '../../src/constants/games';

export default function StatsScreen() {
  const { games: progressGames, overallStreak } = useProgressStore();

  const totalPlayed = Object.values(progressGames).reduce((s, g) => s + g.gamesPlayed, 0);
  const totalWon = Object.values(progressGames).reduce((s, g) => s + g.gamesWon, 0);
  const accuracy = totalPlayed > 0 ? Math.round((totalWon / totalPlayed) * 100) : 0;

  const formatTime = (s: number | null) => {
    if (s === null) return '--:--';
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stats</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{overallStreak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statValue}>{totalWon}</Text>
            <Text style={styles.statLabel}>Solved</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statValue}>{accuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statIcon}>🎮</Text>
            <Text style={styles.statValue}>{totalPlayed}</Text>
            <Text style={styles.statLabel}>Played</Text>
          </View>
        </View>

        {/* Per-game breakdown */}
        {GAMES.filter(g => (progressGames[g.id]?.gamesPlayed ?? 0) > 0).map(game => {
          const p = progressGames[game.id];
          return (
            <View key={game.id} style={styles.gameRow}>
              <Text style={styles.gameEmoji}>{game.emoji}</Text>
              <View style={styles.gameInfo}>
                <Text style={styles.gameName}>{game.name}</Text>
                <Text style={styles.gameStats}>
                  {p.gamesPlayed} played · {p.gamesWon} won · Best: {formatTime(p.bestTimeSeconds)}
                </Text>
              </View>
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {p.currentStreak}</Text>
              </View>
            </View>
          );
        })}

        {totalPlayed === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyText}>Play some games to see your stats!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: { padding: spacing.lg },
  title: { ...typography.hero, color: colors.text.primary },
  content: { padding: spacing.lg },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  statBadge: {
    width: 76,
    height: 76,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  statIcon: { fontSize: 18 },
  statValue: { ...typography.h2, color: colors.text.primary, marginTop: 2 },
  statLabel: { ...typography.small, color: colors.text.tertiary },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  gameEmoji: { fontSize: 24, marginRight: spacing.md },
  gameInfo: { flex: 1 },
  gameName: { ...typography.h3, color: colors.text.primary },
  gameStats: { ...typography.small, color: colors.text.secondary, marginTop: 2 },
  streakBadge: {
    backgroundColor: colors.brand.secondary + '22',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  streakText: { ...typography.small, color: colors.brand.secondary },
  empty: { alignItems: 'center', paddingTop: spacing.xxl },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.lg },
  emptyText: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
});
