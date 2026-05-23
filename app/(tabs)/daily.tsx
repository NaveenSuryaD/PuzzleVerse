import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../src/theme/useTheme';
import { fonts } from '../../src/theme/typography';
import { useProgressStore } from '../../src/store/useProgressStore';

// ISO week order: Mon=0 … Sun=6
const ISO_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getDateStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function useCountdown() {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setRemaining(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return remaining;
}

type ChallengeState = 'done' | 'playing' | 'todo';

interface Challenge {
  id: string;
  name: string;
  cat: 'word' | 'logic';
  glyph: string;
  diff: string;
  time: string;
  state: ChallengeState;
  streak: number;
  route: string;
}

function GridGlyph({ color }: { color: string }) {
  return (
    <View style={{ width: 26, height: 26, flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <View key={i} style={{ width: 7, height: 7, borderRadius: 1.5, backgroundColor: color, opacity: i % 2 === 0 ? 1 : 0.55 }} />
      ))}
    </View>
  );
}

export default function DailyScreen() {
  const router = useRouter();
  const colors = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const { games: progressGames } = useProgressStore();
  const countdown = useCountdown();

  const todayDate = getDateStr(0);
  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Word Guess daily state
  const wgDone = (progressGames['word-guess']?.completedDailyDates ?? []).includes(todayDate);
  const wgStreak = progressGames['word-guess']?.currentStreak ?? 0;

  // Sudoku state — done if played today
  const skDone = progressGames['sudoku']?.lastPlayedDate === todayDate;
  const skStreak = progressGames['sudoku']?.currentStreak ?? 0;

  const doneCount = (wgDone ? 1 : 0) + (skDone ? 1 : 0);

  const challenges: Challenge[] = [
    {
      id: 'word-guess',
      name: 'Word Guess',
      cat: 'word',
      glyph: 'Aa',
      diff: 'Daily',
      time: '~3 min',
      state: wgDone ? 'done' : 'playing',
      streak: wgStreak,
      route: '/game/word-guess?mode=daily',
    },
    {
      id: 'sudoku',
      name: 'Sudoku',
      cat: 'logic',
      glyph: '≡',
      diff: 'Medium',
      time: '~8 min',
      state: skDone ? 'done' : 'todo',
      streak: skStreak,
      route: '/game/sudoku',
    },
  ];

  // 7-day week strip: Mon–Sun of current ISO week
  const todayDow = now.getDay(); // 0=Sun, 1=Mon … 6=Sat
  const distFromMon = todayDow === 0 ? 6 : todayDow - 1; // days since Monday
  const weekDays = ISO_DAYS.map((label, i) => {
    // i=0→Mon … i=6→Sun; offset relative to today
    const offset = i - distFromMon;
    const dateStr = getDateStr(offset);
    const d = new Date(dateStr + 'T00:00:00');
    const isToday = offset === 0;
    const isFuture = offset > 0;
    const isDone = (progressGames['word-guess']?.completedDailyDates ?? []).includes(dateStr);
    return { label, day: d.getDate(), isToday, isFuture, isDone };
  });

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.dateEyebrow}>{dateLabel}</Text>
          <Text style={s.title}>Daily Challenges</Text>
        </View>

        {/* Countdown */}
        <View style={s.countdownWrap}>
          <View style={s.countdownCard}>
            <View style={s.countdownLeft}>
              <Ionicons name="time-outline" size={16} color={colors.inkSoft} />
              <Text style={s.countdownLabel}>New puzzles in</Text>
            </View>
            <Text style={s.countdownTime}>{countdown}</Text>
          </View>
        </View>

        {/* Week strip */}
        <View style={s.weekCard}>
          {weekDays.map((d, i) => (
            <View key={i} style={s.weekDay}>
              <Text style={[s.weekLabel, d.isToday && s.weekLabelToday]}>{d.label}</Text>
              <View style={[
                s.weekCircle,
                d.isDone && { backgroundColor: colors.number.bg },
                d.isToday && !d.isDone && { backgroundColor: colors.ink },
                !d.isDone && !d.isToday && { backgroundColor: colors.rule },
              ]}>
                {d.isDone ? (
                  <Ionicons name="checkmark" size={14} color={colors.number.ink} />
                ) : d.isFuture ? (
                  <View style={[s.weekDot, { backgroundColor: colors.inkMuted }]} />
                ) : (
                  <Text style={[s.weekDayNum, d.isToday ? { color: colors.bg } : { color: colors.inkMuted }]}>
                    {d.day}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Today's set */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Today's set</Text>
          <Text style={s.sectionSub}>{doneCount} of {challenges.length} done</Text>
        </View>

        {/* Challenge cards */}
        <View style={s.challengeList}>
          {challenges.map(ch => {
            const tone = colors[ch.cat];
            const done = ch.state === 'done';
            const playing = ch.state === 'playing';
            return (
              <TouchableOpacity
                key={ch.id}
                style={[s.challengeCard, done && s.challengeDone]}
                onPress={() => router.push(ch.route as any)}
                activeOpacity={0.82}
              >
                {/* Glyph well */}
                <View style={[s.challengeWell, { backgroundColor: tone.bg }]}>
                  {ch.id === 'sudoku'
                    ? <GridGlyph color={tone.ink} />
                    : <Text style={[s.challengeGlyph, { color: tone.ink }]}>{ch.glyph}</Text>
                  }
                  {done && (
                    <View style={s.doneOverlay}>
                      <Ionicons name="checkmark" size={22} color="#fff" />
                    </View>
                  )}
                </View>

                {/* Info */}
                <View style={s.challengeInfo}>
                  <Text style={s.challengeName}>{ch.name}</Text>
                  <View style={s.challengeMeta}>
                    <View style={[s.diffBadge, { backgroundColor: tone.bg }]}>
                      <Text style={[s.diffText, { color: tone.ink }]}>{ch.diff.toUpperCase()}</Text>
                    </View>
                    <Text style={s.metaDot}>·</Text>
                    <Text style={s.metaText}>{ch.time}</Text>
                    {ch.streak > 0 && (
                      <>
                        <Text style={s.metaDot}>·</Text>
                        <Ionicons name="flame" size={11} color="#E26A2C" />
                        <Text style={s.metaText}>{ch.streak}</Text>
                      </>
                    )}
                  </View>
                </View>

                {/* Action button */}
                <View style={[
                  s.actionBtn,
                  done  && s.actionBtnDone,
                  playing && !done && s.actionBtnPlay,
                  !done && !playing && s.actionBtnTodo,
                ]}>
                  {done ? (
                    <Text style={[s.actionBtnText, { color: colors.success }]}>Done</Text>
                  ) : playing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="play" size={11} color={colors.bg} />
                      <Text style={[s.actionBtnText, { color: colors.bg }]}>Resume</Text>
                    </View>
                  ) : (
                    <Text style={[s.actionBtnText, { color: colors.ink }]}>Start</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 110 },

  header: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 4 },
  dateEyebrow: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.inkMuted },
  title: { fontFamily: fonts.black, fontSize: 30, color: colors.ink, marginTop: 2, letterSpacing: -0.8 },

  countdownWrap: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 4 },
  countdownCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  countdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countdownLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.inkSoft },
  countdownTime: {
    fontFamily: fonts.black, fontSize: 18, color: colors.ink, letterSpacing: 0.5,
  },

  weekCard: {
    marginHorizontal: 22,
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  weekDay: { alignItems: 'center', gap: 8, width: 36 },
  weekLabel: { fontFamily: fonts.bold, fontSize: 11, color: colors.inkMuted },
  weekLabelToday: { color: colors.ink },
  weekCircle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  weekDot: { width: 5, height: 5, borderRadius: 2.5 },
  weekDayNum: { fontFamily: fonts.extraBold, fontSize: 13 },

  sectionRow: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 2,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontFamily: fonts.black, fontSize: 20, color: colors.ink, letterSpacing: -0.4 },
  sectionSub: { fontFamily: fonts.bold, fontSize: 13, color: colors.inkMuted },

  challengeList: { paddingHorizontal: 22, paddingTop: 10, gap: 12 },

  challengeCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  challengeDone: { opacity: 0.6 },

  challengeWell: {
    width: 54, height: 54, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, position: 'relative',
  },
  challengeGlyph: { fontFamily: fonts.black, fontSize: 22 },
  doneOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 18,
    backgroundColor: 'rgba(58,138,74,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },

  challengeInfo: { flex: 1, minWidth: 0 },
  challengeName: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.ink },
  challengeMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  diffText: { fontFamily: fonts.extraBold, fontSize: 10, letterSpacing: 0.4 },
  metaDot: { fontFamily: fonts.regular, fontSize: 12, color: colors.inkMuted },
  metaText: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted },

  actionBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnDone: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.success,
  },
  actionBtnPlay: { backgroundColor: colors.ink },
  actionBtnTodo: { backgroundColor: colors.bg },
  actionBtnText: { fontFamily: fonts.extraBold, fontSize: 13 },
});
