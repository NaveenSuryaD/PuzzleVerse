import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../src/theme/useTheme';
import { fonts } from '../../src/theme/typography';
import { useProgressStore } from '../../src/store/useProgressStore';
import { GAMES } from '../../src/constants/games';
import { GameGlyph } from '../../src/components/GameGlyph';

const { width: SCREEN_W } = Dimensions.get('window');

type CategoryKey = 'word' | 'number' | 'logic' | 'visual' | 'classic';

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

const ACHIEVEMENTS: {
  name: string;
  cat: CategoryKey;
  icon: string;
  check: (won: number, streak: number, played: number, wordWon: number, dailyWon: number) => boolean;
}[] = [
  {
    name: 'First Solve',
    cat: 'word',
    icon: 'star-outline',
    check: (won) => won >= 1,
  },
  {
    name: '10 Games',
    cat: 'number',
    icon: 'game-controller-outline',
    check: (_w, _s, played) => played >= 10,
  },
  {
    name: '7-Day Streak',
    cat: 'logic',
    icon: 'flame-outline',
    check: (_w, streak) => streak >= 7,
  },
  {
    name: 'Word Wizard',
    cat: 'word',
    icon: 'text-outline',
    check: (_w, _s, _p, wordWon) => wordWon >= 10,
  },
  {
    name: 'Speed Demon',
    cat: 'visual',
    icon: 'flash-outline',
    check: (_w, _s, played) => played >= 1, // unlocked by parent having bestTime < 120
  },
  {
    name: 'Daily Devotee',
    cat: 'classic',
    icon: 'calendar-outline',
    check: (_w, _s, _p, _ww, dailyWon) => dailyWon >= 7,
  },
  {
    name: '30 Day Streak',
    cat: 'logic',
    icon: 'bonfire-outline',
    check: (_w, streak) => streak >= 30,
  },
  {
    name: '50 Puzzles',
    cat: 'number',
    icon: 'trophy-outline',
    check: (_w, _s, played) => played >= 50,
  },
  {
    name: 'Centurion',
    cat: 'classic',
    icon: 'ribbon-outline',
    check: (_w, _s, played) => played >= 100,
  },
  {
    name: 'All Games',
    cat: 'visual',
    icon: 'apps-outline',
    check: (_w, _s, played) => played >= 200,
  },
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

  const playedGames = GAMES.filter(g => (progressGames[g.id]?.gamesPlayed ?? 0) > 0)
    .sort((a, b) => (progressGames[b.id]?.gamesPlayed ?? 0) - (progressGames[a.id]?.gamesPlayed ?? 0));

  const totalPlayed = Object.values(progressGames).reduce((acc, g) => acc + g.gamesPlayed, 0);
  const totalWon    = Object.values(progressGames).reduce((acc, g) => acc + g.gamesWon, 0);
  const maxStreak   = Math.max(0, ...Object.values(progressGames).map(g => g.currentStreak));
  const accuracy    = totalPlayed > 0 ? Math.round((totalWon / totalPlayed) * 100) : 0;
  const bestTime    = Object.values(progressGames).reduce(
    (best, g) => g.bestTimeSeconds !== null && (best === null || g.bestTimeSeconds < best) ? g.bestTimeSeconds : best,
    null as number | null,
  );

  // 30-day heatmap: build a daily activity map from lastPlayedDate across all games
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);

  // Build a set of ISO dates when ANY game was played (estimate from streak data)
  const playedDates = useMemo(() => {
    const dates = new Set<string>();
    Object.values(progressGames).forEach(g => {
      if (g.lastPlayedDate) dates.add(g.lastPlayedDate);
      (g.completedDailyDates ?? []).forEach(d => dates.add(d));
    });
    return dates;
  }, [progressGames]);

  const heatmapDays = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (29 - i));
      const iso = d.toISOString().slice(0, 10);
      const isToday = iso === todayISO;
      const hasActivity = playedDates.has(iso);
      return { iso, isToday, hasActivity, dow: d.getDay() };
    });
  }, [playedDates, todayISO]);

  const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const CELL_SIZE = Math.floor((SCREEN_W - 22 * 2 - 36) / 30);

  const totalWordWon = Object.values(progressGames)
    .filter(g => ['word-guess', 'word-search', 'group-it', 'hangman'].includes(g.gameId))
    .reduce((acc, g) => acc + g.gamesWon, 0);

  const totalDailyWon = Object.values(progressGames)
    .reduce((acc, g) => acc + (g.completedDailyDates?.length ?? 0), 0);

  const hasBestTimeUnder2Min = Object.values(progressGames)
    .some(g => g.bestTimeSeconds !== null && g.bestTimeSeconds < 120);

  const achievements = ACHIEVEMENTS.map(a => {
    let earned = a.check(totalWon, maxStreak, totalPlayed, totalWordWon, totalDailyWon);
    if (a.name === 'Speed Demon') earned = hasBestTimeUnder2Min;
    return { ...a, earned };
  });

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

        {/* 30-day activity heatmap */}
        <View style={s.chartCard}>
          <View style={s.chartHeader}>
            <Text style={s.chartTitle}>30-day activity</Text>
            <View style={s.streakPill}>
              <Ionicons name="flame" size={13} color="#E26A2C" />
              <Text style={s.streakPillText}>{maxStreak} day streak</Text>
            </View>
          </View>
          <View style={s.heatmapRow}>
            {heatmapDays.map((d, i) => (
              <View
                key={i}
                style={[
                  s.heatCell,
                  { width: CELL_SIZE, height: CELL_SIZE, borderRadius: Math.max(2, CELL_SIZE * 0.25) },
                  d.hasActivity
                    ? { backgroundColor: colors.number.ink + 'CC' }
                    : { backgroundColor: colors.rule },
                  d.isToday && { borderWidth: 2, borderColor: colors.ink },
                ]}
              />
            ))}
          </View>
          <View style={s.heatmapLegend}>
            <Text style={s.heatmapLegendText}>29 days ago</Text>
            <Text style={s.heatmapLegendText}>Today</Text>
          </View>
        </View>

        {/* By game — only games played at least once */}
        {playedGames.length > 0 && (
          <>
            <Text style={s.sectionEyebrow}>BY GAME</Text>
            <View style={s.gameList}>
              {playedGames.map((game, i) => {
                const p = progressGames[game.id];
                const cat = game.category as CategoryKey;
                const tone = colors[cat];
                return (
                  <View key={game.id} style={[s.gameRow, i < playedGames.length - 1 && s.gameRowBorder]}>
                    <View style={[s.gameWell, { backgroundColor: tone.bg }]}>
                      <GameGlyph id={game.id} color={tone.ink} />
                    </View>
                    <View style={s.gameInfo}>
                      <Text style={s.gameName}>{game.name}</Text>
                      <Text style={s.gameStats}>
                        {p?.gamesPlayed ?? 0} played · {p?.gamesWon ?? 0} won · best {formatTime(p?.bestTimeSeconds ?? null)}
                      </Text>
                    </View>
                    {(p?.currentStreak ?? 0) > 0 && (
                      <View style={s.streakBadge}>
                        <Ionicons name="flame" size={13} color="#E26A2C" />
                        <Text style={s.streakText}>{p!.currentStreak}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}

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
                    ? <Ionicons name={a.icon as any} size={22} color={tone.ink} />
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
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  chartTitle: { fontFamily: fonts.extraBold, fontSize: 14, color: colors.ink },
  streakPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.word.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  streakPillText: { fontFamily: fonts.extraBold, fontSize: 12, color: colors.word.ink },
  heatmapRow: {
    flexDirection: 'row', flexWrap: 'nowrap',
    justifyContent: 'space-between',
  },
  heatCell: { aspectRatio: 1 },
  heatmapLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  heatmapLegendText: { fontFamily: fonts.semiBold, fontSize: 10, color: colors.inkMuted },

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
