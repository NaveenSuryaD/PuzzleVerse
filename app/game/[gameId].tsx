import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/useTheme';
import { fonts } from '../../src/theme/typography';
import { GAMES } from '../../src/constants/games';
import { SudokuGame } from '../../src/games/sudoku/SudokuGame';
import { WordGuessGame } from '../../src/games/wordguess/WordGuessGame';
import { useProgressStore } from '../../src/store/useProgressStore';
import { useGameStore } from '../../src/store/useGameStore';
import type { GameMode } from '../../src/games/wordguess/types';

const todayStr = () => new Date().toISOString().slice(0, 10);

const formatTime = (secs: number): string => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function GameScreen() {
  const { gameId, mode, date } = useLocalSearchParams<{ gameId: string; mode?: string; date?: string }>();
  const router = useRouter();
  const colors = useTheme();
  const { recordGame, recordDailyComplete } = useProgressStore();
  const { startGame, endGame } = useGameStore();

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const game = GAMES.find(g => g.id === gameId);

  useEffect(() => {
    if (gameId) startGame(gameId);
  }, [gameId]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handleComplete = useCallback((won: boolean, timeSeconds: number) => {
    if (!gameId) return;
    setRunning(false);
    recordGame(gameId, won, timeSeconds);
    endGame(won);
  }, [gameId, recordGame, endGame]);

  const handleDailyComplete = useCallback((won: boolean, timeSeconds: number, dailyDate: string) => {
    if (!gameId) return;
    setRunning(false);
    recordGame(gameId, won, timeSeconds);
    endGame(won);
    recordDailyComplete(gameId, dailyDate, won);
  }, [gameId, recordGame, endGame, recordDailyComplete]);

  const s = makeStyles(colors);

  if (!game) {
    return (
      <SafeAreaView style={s.container}>
        <Text style={s.error}>Game not found: {gameId}</Text>
      </SafeAreaView>
    );
  }

  const gameMode: GameMode = (mode === 'daily' || mode === 'unlimited') ? mode : 'unlimited';
  const dailyDate = date ?? todayStr();

  const subtitle = game.id === 'word-guess'
    ? (gameMode === 'daily' ? 'Daily Challenge' : 'Unlimited')
    : 'Medium';

  const renderGame = () => {
    if (game.id === 'sudoku') {
      return <SudokuGame onComplete={(_, t) => handleComplete(true, t)} />;
    }
    if (game.id === 'word-guess') {
      if (gameMode === 'daily') {
        return (
          <WordGuessGame
            mode={gameMode}
            dateOverride={date}
            onComplete={(won, attempts) => handleDailyComplete(won, attempts * 60, dailyDate)}
          />
        );
      }
      return (
        <WordGuessGame
          mode={gameMode}
          onComplete={(won, attempts) => handleComplete(won, attempts * 60)}
        />
      );
    }
    return (
      <View style={s.placeholder}>
        <Text style={s.placeholderEmoji}>{game.emoji}</Text>
        <Text style={s.placeholderText}>{game.name} coming soon</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>{game.name}</Text>
          <Text style={s.headerSub}>{subtitle}</Text>
        </View>

        <View style={s.timerPill}>
          <Ionicons name="time-outline" size={13} color={colors.inkSoft} />
          <Text style={s.timerText}>{formatTime(elapsed)}</Text>
        </View>

        <TouchableOpacity style={s.iconBtn} activeOpacity={0.7}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.inkSoft} />
        </TouchableOpacity>
      </View>

      <View style={s.gameArea}>
        {renderGame()}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.black,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.inkMuted,
    marginTop: 1,
  },
  timerPill: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  timerText: {
    fontSize: 13,
    fontFamily: fonts.extraBold,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  gameArea: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  placeholderText: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.inkSoft,
  },
  error: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.danger,
    padding: 20,
  },
});
