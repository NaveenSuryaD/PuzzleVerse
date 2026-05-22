import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { dark as colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { text as typography } from '../../src/theme/typography';
import { GAMES } from '../../src/constants/games';
import { SudokuGame } from '../../src/games/sudoku/SudokuGame';
import { useProgressStore } from '../../src/store/useProgressStore';
import { useGameStore } from '../../src/store/useGameStore';

export default function GameScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const router = useRouter();
  const { recordGame } = useProgressStore();
  const { startGame, endGame } = useGameStore();

  const game = GAMES.find(g => g.id === gameId);

  useEffect(() => {
    if (gameId) startGame(gameId);
  }, [gameId]);

  const handleComplete = useCallback((timeSeconds: number) => {
    if (gameId) {
      recordGame(gameId, true, timeSeconds);
      endGame(true);
    }
  }, [gameId, recordGame, endGame]);

  if (!game) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>Game not found: {gameId}</Text>
      </SafeAreaView>
    );
  }

  const renderGame = () => {
    if (game.id === 'sudoku') {
      return <SudokuGame onComplete={handleComplete} />;
    }
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderEmoji}>{game.emoji}</Text>
        <Text style={styles.placeholderText}>{game.name} coming soon</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{game.name}</Text>
        <View style={styles.backButton} />
      </View>
      {/* Game */}
      <View style={styles.gameArea}>
        {renderGame()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  gameArea: { flex: 1 },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: { fontSize: 64, marginBottom: spacing.lg },
  placeholderText: { ...typography.h1, color: colors.text.secondary },
  error: { ...typography.body, color: colors.error, padding: spacing.lg },
});
