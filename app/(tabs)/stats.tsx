import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../src/theme/useTheme';
import { fonts } from '../../src/theme/typography';
import { useProgressStore } from '../../src/store/useProgressStore';
import { GAMES } from '../../src/constants/games';

type CategoryKey = 'word' | 'number' | 'logic' | 'visual' | 'classic';

function GridGlyph({ color, size = 22 }: { color: string; size?: number }) {
  const dot = Math.floor((size - 4) / 3);
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <View key={i} style={{
          width: dot, height: dot, borderRadius: 1,
          backgroundColor: color, opacity: i % 2 === 0 ? 1 : 0.55,
        }} />
      ))}
    </View>
  );
}

function StatBig({
  icon, value, label, tileBg,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  tileBg: string;
}) {
  const colors = useTheme();
  return (
    <View style={[bigStat.card, { backgroundColor: colors.surface, shadowColor: colors.ink }]}>
      <View style={[bigStat.well, { backgroundColor: tileBg }]}>{icon}</View>
      <Text style={[bigStat.value, { color: colors.ink }]}>{value}</Text>
      <Text style={[bigStat.label, { color: colors.inkMuted }]}>{label}</Text>
    </View>
  );
}

const bigStat = StyleSheet.create({
  card: {
    flex: 1, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 10,
    alignItems: 'center', gap: 6,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  well: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  value: { fontFamily: fonts.black, fontSize: 22, letterSpacing: -0.6, lineHeight: 26 },
  label: { fontFamily: fonts.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
});

const ACHIEVEMENTS = [
  { name: 'First Solve',  cat: 'word'    as CategoryKey, check: (won: number) => won >= 1 },
  { name: '7-day Streak', cat: 'logic'   as CategoryKey, check: (_: number, streak: number) => streak >= 7 },
  { name: '10 Games',     cat: 'number'  as CategoryKey, check: (won: number, _: number, played: number) => played >= 10 },
  { name: 'No Hints',     cat: 'visual'  as CategoryKey, check: () => false },
  { name: '100 Puzzles',  cat: 'classic' as CategoryKey, check: (won: number, _: number, played: number) => played >= 100 },
];

const formatTime = (s: number | null): string => {
  if (s === null) return '--';
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

export default function StatsScreen() {
  const colors = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const { games: progressGames } = useProgressStore();

  const totalPlayed = Object.values(progressGames).reduce((acc, g) => acc + g.gamesPlayed, 0);
  const totalWon    = Object.values(progressGames).reduce((acc, g) => acc + g.gamesWon, 0);
  const maxStreak   = Math.max(0, ...Object.values(progressGames).map(g => g.currentStreak));
  const accuracy    = totalPlayed > 0 ? Math.round((totalWon / totalPlayed) * 100) : 0;
  const bestTime    = Object.values(progressGames).reduce(
    (best, g) => g.bestTimeSeconds !== null && (best === null || g.bestTimeSeconds < best) ? g.bestTimeSeconds : best,
    null as number | null,
  );

  // Bar chart: last 7 days ending today, chronological left→right
  const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i)); // 6 days ago … today
    const isToday = i === 6;
    const daysAgo = 6 - i;
    // Estimate: today = total played, streak days = partial count, others = 0
    const val = isToday ? totalPlayed
      : daysAgo < maxStreak ? Math.max(1, Math.floor(totalPlayed * 0.35))
      : 0;
    return { label: DOW_SHORT[d.getDay()], val, isToday };
  });
  const maxBar = Math.max(...last7.map(d => d.val), 1);

  const achievements = ACHIEVEMENTS.map(a => ({
    ...a,
    earned: a.check(totalWon, maxStreak, totalPlayed),
  }));

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.eyebrow}>Your progress</Text>
          <Text style={s.title}>Stats</Text>
        </View>

        {/* 4 stat tiles */}
        <View style={s.statsRow}>
          <StatBig
            icon={<Ionicons name="flame" size={16} color="#E26A2C" />}
            value={String(maxStreak)}
            label="Streak"
            tileBg={colors.word.bg}
          />
          <StatBig
            icon={<Ionicons name="trophy-outline" size={18} color={colors.logic.ink} />}
            value={String(totalWon)}
            label="Solved"
            tileBg={colors.logic.bg}
          />
          <StatBig
            icon={<Text style={{ fontFamily: fonts.black, fontSize: 14, color: colors.number.ink }}>%</Text>}
            value={String(accuracy)}
            label="Accuracy"
            tileBg={colors.number.bg}
          />
          <StatBig
            icon={<Ionicons name="time-outline" size={16} color={colors.visual.ink} />}
            value={formatTime(bestTime)}
            label="Best"
            tileBg={colors.visual.bg}
          />
        </View>

        {/* Activity chart */}
        <View style={s.chartCard}>
          <View style={s.chartHeader}>
            <Text style={s.chartTitle}>This week</Text>
            <Text style={s.chartSub}>{totalPlayed} solved</Text>
          </View>
          <View style={s.barsRow}>
            {last7.map((d, i) => (
              <View key={i} style={s.barCol}>
                <View style={[
                  s.barFill,
                  {
                    height: Math.max((d.val / maxBar) * 72, 4),
                    backgroundColor: d.isToday ? colors.ink : colors.logic.bg,
                  },
                ]} />
                <Text style={[s.barLabel, { color: d.isToday ? colors.ink : colors.inkMuted }]}>
                  {d.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* By game — always show all games */}
        <Text style={s.sectionEyebrow}>BY GAME</Text>
        <View style={s.gameList}>
          {GAMES.map((game, i) => {
            const p = progressGames[game.id];
            const cat = game.category as CategoryKey;
            const tone = colors[cat];
            return (
              <View key={game.id} style={[s.gameRow, i < GAMES.length - 1 && s.gameRowBorder]}>
                <View style={[s.gameWell, { backgroundColor: tone.bg }]}>
                  {game.id === 'sudoku'
                    ? <GridGlyph color={tone.ink} />
                    : <Text style={{ fontFamily: fonts.black, fontSize: 18, color: tone.ink }}>Aa</Text>
                  }
                </View>
                <View style={s.gameInfo}>
                  <Text style={s.gameName}>{game.name}</Text>
                  <Text style={s.gameStats}>
                    {p?.gamesPlayed ?? 0} games · best {formatTime(p?.bestTimeSeconds ?? null)}
                  </Text>
                </View>
                {(p?.currentStreak ?? 0) > 0 && (
                  <View style={s.streakBadge}>
                    <Ionicons name="flame" size={13} color="#E26A2C" />
                    <Text style={s.streakText}>{p!.currentStreak}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={14} color={colors.inkMuted} />
              </View>
            );
          })}
        </View>

        {/* Achievements */}
        <Text style={s.sectionEyebrow}>ACHIEVEMENTS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.achieveRow}
        >
          {achievements.map(a => {
            const tone = colors[a.cat];
            return (
              <View key={a.name} style={[s.achieveCard, !a.earned && s.achieveLocked]}>
                <View style={[s.achieveCircle, { backgroundColor: a.earned ? tone.bg : colors.rule }]}>
                  {a.earned
                    ? <Ionicons name="trophy-outline" size={22} color={tone.ink} />
                    : <Text style={[s.achieveQ, { color: colors.inkMuted }]}>?</Text>
                  }
                </View>
                <Text style={[s.achieveName, { color: colors.ink }]}>{a.name}</Text>
              </View>
            );
          })}
        </ScrollView>

        {totalPlayed === 0 && (
          <View style={s.empty}>
            <Ionicons name="game-controller-outline" size={48} color={colors.inkMuted} />
            <Text style={s.emptyText}>Play some games to see your stats!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 110 },
  header: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 4 },
  eyebrow: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.inkMuted },
  title: { fontFamily: fonts.black, fontSize: 30, color: colors.ink, marginTop: 2, letterSpacing: -0.8 },

  statsRow: {
    paddingHorizontal: 22, paddingTop: 14, flexDirection: 'row', gap: 8,
  },

  chartCard: {
    marginHorizontal: 22, marginTop: 18,
    backgroundColor: colors.surface, borderRadius: 22, padding: 18,
    shadowColor: colors.ink, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'space-between', marginBottom: 14,
  },
  chartTitle: { fontFamily: fonts.extraBold, fontSize: 14, color: colors.ink },
  chartSub: { fontFamily: fonts.bold, fontSize: 12, color: colors.inkMuted },
  barsRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', gap: 6, height: 88,
  },
  barCol: { flex: 1, alignItems: 'center', gap: 6, justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 8 },
  barLabel: { fontFamily: fonts.bold, fontSize: 11 },

  sectionEyebrow: {
    fontFamily: fonts.extraBold, fontSize: 13, color: colors.inkMuted,
    letterSpacing: 0.6, paddingHorizontal: 22, paddingTop: 22, paddingBottom: 10,
  },
  gameList: {
    marginHorizontal: 22, backgroundColor: colors.surface,
    borderRadius: 18, overflow: 'hidden',
    shadowColor: colors.ink, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  gameRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  gameRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.rule },
  gameWell: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  gameInfo: { flex: 1, minWidth: 0 },
  gameName: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.ink },
  gameStats: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  streakText: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.ink },

  achieveRow: {
    paddingHorizontal: 22, paddingBottom: 12, gap: 10,
    flexDirection: 'row', alignItems: 'stretch',
  },
  achieveCard: {
    width: 104, backgroundColor: colors.surface, borderRadius: 18,
    padding: 14, alignItems: 'center', gap: 6,
    shadowColor: colors.ink, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  achieveLocked: { opacity: 0.55 },
  achieveCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  achieveQ: { fontFamily: fonts.black, fontSize: 20 },
  achieveName: { fontFamily: fonts.extraBold, fontSize: 12, textAlign: 'center', lineHeight: 16 },

  empty: { alignItems: 'center', paddingVertical: 40, gap: 16 },
  emptyText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.inkMuted },
});
