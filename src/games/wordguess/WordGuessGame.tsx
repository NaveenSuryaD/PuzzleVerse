import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../theme/useTheme';
import { useSettingsStore } from '../../store/useSettingsStore';
import { fonts } from '../../theme/typography';
import { easings } from '../../theme/animations';
import { GuessGrid } from './GuessGrid';
import { WordKeyboard } from './WordKeyboard';
import {
  pickDailyWord,
  pickRandomWord,
  isValidWord,
  evaluateGuess,
  generateShareText,
} from './generator';
import type { LetterState, KeyState, GameMode, GameStatus } from './types';

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;
const FLIP_DURATION = 750;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const WIN_MESSAGES = [
  'Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!',
];

interface WordGuessGameProps {
  mode?: GameMode;
  dateOverride?: string;
  onComplete?: (won: boolean, attempts: number) => void;
}

export const WordGuessGame: React.FC<WordGuessGameProps> = ({
  mode = 'unlimited',
  dateOverride,
  onComplete,
}) => {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const hapticsEnabled = useSettingsStore(s => s.hapticsEnabled);

  const initGame = () => ({
    answer: mode === 'daily' ? pickDailyWord(dateOverride) : pickRandomWord(),
    guesses: [] as string[],
    evaluations: [] as LetterState[][],
    currentGuess: '',
    gameStatus: 'playing' as GameStatus,
  });

  const [state, setState] = useState(initGame);
  const [letterStates, setLetterStates] = useState<Record<string, KeyState>>({});
  const [flipRowIndex, setFlipRowIndex] = useState(-1);
  const [bounceRowIndex, setBounceRowIndex] = useState(-1);
  const [shakeRowIndex, setShakeRowIndex] = useState(-1);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const flipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Toast animation
  const toastY = useSharedValue(-60);
  const toastOpacity = useSharedValue(0);
  const toastStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: toastY.value }],
    opacity: toastOpacity.value,
  }));

  // Complete sheet slide-up
  const sheetY = useSharedValue(SCREEN_HEIGHT);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.value }] }));

  const showError = useCallback((msg: string) => {
    setErrorMessage(msg);
    toastY.value = withSpring(0, easings.spring);
    toastOpacity.value = withTiming(1, { duration: 150 });
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => {
      toastY.value = withTiming(-60, { duration: 200 });
      toastOpacity.value = withTiming(0, { duration: 200 });
    }, 1800);
  }, []);

  const triggerShake = useCallback((rowIdx: number) => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShakeRowIndex(-1);
    setTimeout(() => setShakeRowIndex(rowIdx), 0);
    setTimeout(() => setShakeRowIndex(-1), 500);
  }, [hapticsEnabled]);

  const updateLetterStates = useCallback((guessLetters: string[], evaluation: LetterState[]) => {
    setLetterStates(prev => {
      const next = { ...prev };
      const priority: Record<string, number> = { correct: 3, present: 2, absent: 1, unused: 0 };
      guessLetters.forEach((letter, i) => {
        const key = letter.toUpperCase();
        const current = next[key] ?? 'unused';
        const incoming = evaluation[i] as KeyState;
        if ((priority[incoming] ?? 0) > (priority[current] ?? 0)) next[key] = incoming;
      });
      return next;
    });
  }, []);

  const openCompleteSheet = useCallback(() => {
    setShowComplete(true);
    sheetY.value = SCREEN_HEIGHT;
    sheetY.value = withDelay(100, withSpring(0, easings.spring));
  }, []);

  const handleKey = useCallback((key: string) => {
    if (state.gameStatus !== 'playing') return;
    if (flipRowIndex !== -1) return;

    setState(prev => {
      if (key === '⌫' || key === 'BACKSPACE') {
        return { ...prev, currentGuess: prev.currentGuess.slice(0, -1) };
      }

      if (key === 'ENTER') {
        const guess = prev.currentGuess.toLowerCase();
        if (guess.length < WORD_LENGTH) {
          showError('Not enough letters');
          triggerShake(prev.guesses.length);
          return prev;
        }
        if (!isValidWord(guess)) {
          showError('Not in word list');
          triggerShake(prev.guesses.length);
          return prev;
        }

        const evaluation = evaluateGuess(guess, prev.answer);
        const newGuesses = [...prev.guesses, guess];
        const newEvaluations = [...prev.evaluations, evaluation];
        const won = evaluation.every(s => s === 'correct');
        const lost = !won && newGuesses.length >= MAX_GUESSES;
        const newStatus: GameStatus = won ? 'won' : lost ? 'lost' : 'playing';

        const rowIdx = prev.guesses.length;
        setFlipRowIndex(rowIdx);
        updateLetterStates(guess.split(''), evaluation);

        if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
        flipTimerRef.current = setTimeout(() => {
          setFlipRowIndex(-1);
          if (won) {
            if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setBounceRowIndex(rowIdx);
            setTimeout(() => {
              setBounceRowIndex(-1);
              openCompleteSheet();
              onComplete?.(true, newGuesses.length);
            }, 600);
          } else if (lost) {
            if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setTimeout(() => {
              openCompleteSheet();
              onComplete?.(false, newGuesses.length);
            }, 300);
          }
        }, FLIP_DURATION);

        return { ...prev, guesses: newGuesses, evaluations: newEvaluations, currentGuess: '', gameStatus: newStatus };
      }

      if (prev.currentGuess.length >= WORD_LENGTH) return prev;
      if (!/^[A-Za-z]$/.test(key)) return prev;
      return { ...prev, currentGuess: prev.currentGuess + key.toUpperCase() };
    });
  }, [state.gameStatus, flipRowIndex, showError, triggerShake, updateLetterStates, hapticsEnabled, openCompleteSheet, onComplete]);

  const handleNewGame = useCallback(() => {
    if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    setFlipRowIndex(-1);
    setBounceRowIndex(-1);
    setShakeRowIndex(-1);
    setLetterStates({});
    setShowComplete(false);
    sheetY.value = SCREEN_HEIGHT;
    setState(initGame);
  }, [mode]);

  const handleShare = useCallback(async () => {
    const text = generateShareText(state.guesses.length, MAX_GUESSES, state.evaluations, state.gameStatus === 'won');
    try { await Share.share({ message: text }); } catch {}
  }, [state]);

  useEffect(() => () => {
    if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
  }, []);

  const winMessage = WIN_MESSAGES[Math.min(state.guesses.length - 1, WIN_MESSAGES.length - 1)] ?? 'Solved!';
  const accuracy = state.guesses.length > 0
    ? Math.round((state.evaluations.flat().filter(s => s === 'correct').length / (state.guesses.length * 5)) * 100)
    : 0;

  return (
    <View style={styles.container}>
      {/* Error toast */}
      <Animated.View style={[styles.toast, toastStyle]} pointerEvents="none">
        <Text style={styles.toastText}>{errorMessage}</Text>
      </Animated.View>

      {/* Mode + help row */}
      <View style={styles.topBar}>
        <View style={[styles.modeBadge, { backgroundColor: colors.word.bg }]}>
          <Text style={[styles.modeBadgeText, { color: colors.word.ink }]}>
            {mode === 'daily' ? 'DAILY' : 'UNLIMITED'}
          </Text>
        </View>
        <TouchableOpacity style={styles.helpButton} onPress={() => setShowHowToPlay(true)}>
          <Ionicons name="help-circle-outline" size={24} color={colors.inkMuted} />
        </TouchableOpacity>
      </View>

      {/* Grid */}
      <View style={styles.gridContainer}>
        <GuessGrid
          guesses={state.guesses}
          evaluations={state.evaluations}
          currentGuess={state.currentGuess}
          flipRowIndex={flipRowIndex}
          bounceRowIndex={bounceRowIndex}
          shakeRowIndex={shakeRowIndex}
        />
      </View>

      {/* Keyboard */}
      <WordKeyboard
        letterStates={letterStates}
        onKey={handleKey}
        disabled={state.gameStatus !== 'playing' || flipRowIndex !== -1}
      />

      {/* ── How to Play Modal ── */}
      <Modal visible={showHowToPlay} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowHowToPlay(false)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>How to Play</Text>
            <TouchableOpacity onPress={() => setShowHowToPlay(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.htpText}>Guess the <Text style={styles.htpBold}>WORD</Text> in 6 tries.</Text>
            <Text style={styles.htpText}>Each guess must be a valid 5-letter word.</Text>
            <View style={styles.htpDivider} />
            <Text style={[styles.htpText, { fontFamily: fonts.semiBold, color: colors.ink, marginBottom: 8 }]}>
              Tile colors reveal how close you were:
            </Text>

            {/* Correct example */}
            <View style={styles.htpRow}>
              <View style={[styles.htpTile, { backgroundColor: colors.success }]}>
                <Text style={[styles.htpLetter, { color: '#fff' }]}>W</Text>
              </View>
              {['E','A','R','Y'].map(l => (
                <View key={l} style={[styles.htpTile, { backgroundColor: colors.surface, borderColor: colors.divider, borderWidth: 2 }]}>
                  <Text style={[styles.htpLetter, { color: colors.ink }]}>{l}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.htpHint}><Text style={styles.htpBold}>W</Text> is in the correct spot.</Text>

            {/* Present example */}
            <View style={styles.htpRow}>
              {['P'].map(l => (
                <View key={l} style={[styles.htpTile, { backgroundColor: colors.surface, borderColor: colors.divider, borderWidth: 2 }]}>
                  <Text style={[styles.htpLetter, { color: colors.ink }]}>{l}</Text>
                </View>
              ))}
              <View style={[styles.htpTile, { backgroundColor: colors.logic.bg }]}>
                <Text style={[styles.htpLetter, { color: colors.logic.ink }]}>I</Text>
              </View>
              {['L','L','S'].map(l => (
                <View key={l} style={[styles.htpTile, { backgroundColor: colors.surface, borderColor: colors.divider, borderWidth: 2 }]}>
                  <Text style={[styles.htpLetter, { color: colors.ink }]}>{l}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.htpHint}><Text style={styles.htpBold}>I</Text> is in the word but wrong spot.</Text>

            {/* Absent example */}
            <View style={styles.htpRow}>
              {['V','A','G'].map(l => (
                <View key={l} style={[styles.htpTile, { backgroundColor: colors.surface, borderColor: colors.divider, borderWidth: 2 }]}>
                  <Text style={[styles.htpLetter, { color: colors.ink }]}>{l}</Text>
                </View>
              ))}
              <View style={[styles.htpTile, { backgroundColor: colors.bg === '#16110A' ? '#3A2E22' : '#C8BFB0' }]}>
                <Text style={[styles.htpLetter, { color: colors.ink }]}>U</Text>
              </View>
              {['E'].map(l => (
                <View key={l} style={[styles.htpTile, { backgroundColor: colors.surface, borderColor: colors.divider, borderWidth: 2 }]}>
                  <Text style={[styles.htpLetter, { color: colors.ink }]}>{l}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.htpHint}><Text style={styles.htpBold}>U</Text> is not in the word.</Text>

            <View style={styles.htpDivider} />
            <Text style={styles.htpText}>
              {mode === 'daily'
                ? 'A new puzzle is available each day at midnight.'
                : 'Play as many puzzles as you like — unlimited mode picks a new word every game.'}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Game Complete Bottom Sheet ── */}
      {showComplete && (
        <View style={styles.overlay}>
          <Animated.View style={[styles.sheet, sheetStyle]}>
            {/* Drag handle */}
            <View style={styles.handle} />

            {/* Trophy */}
            <View style={[styles.trophyCircle, { backgroundColor: colors.word.bg }]}>
              <Ionicons name="trophy" size={28} color={colors.word.ink} />
            </View>

            <Text style={styles.completeTitle}>
              {state.gameStatus === 'won' ? winMessage : 'Game Over'}
            </Text>
            <Text style={styles.completeSub}>
              {state.gameStatus === 'won'
                ? `Solved in ${state.guesses.length}/${MAX_GUESSES}`
                : `The word was ${state.answer.toUpperCase()}`}
            </Text>

            {/* Stat tiles */}
            <View style={styles.statTiles}>
              {[
                { label: 'Guesses', value: `${state.guesses.length}/${MAX_GUESSES}`, tint: colors.word },
                { label: 'Accuracy', value: `${accuracy}%`, tint: colors.number },
                { label: 'Mode', value: mode === 'daily' ? 'Daily' : '∞', tint: colors.logic },
              ].map(t => (
                <View key={t.label} style={[styles.statTile, { backgroundColor: t.tint.bg }]}>
                  <Text style={[styles.statTileValue, { color: t.tint.ink }]}>{t.value}</Text>
                  <Text style={[styles.statTileLabel, { color: t.tint.ink }]}>{t.label}</Text>
                </View>
              ))}
            </View>

            {/* Emoji share grid */}
            <View style={styles.emojiGrid}>
              {state.evaluations.map((row, ri) => (
                <Text key={ri} style={styles.emojiRow}>
                  {row.map(s => s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬛').join('')}
                </Text>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                <Ionicons name="share-outline" size={20} color={colors.ink} />
              </TouchableOpacity>
              {mode === 'unlimited' ? (
                <>
                  <TouchableOpacity style={styles.actionSecondary} onPress={handleNewGame}>
                    <Text style={[styles.actionSecondaryText, { color: colors.ink }]}>Play Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionPrimary, { backgroundColor: colors.ink }]} onPress={handleNewGame}>
                    <Text style={[styles.actionPrimaryText, { color: colors.bg }]}>Next Word</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.bg} />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={[styles.actionPrimary, { flex: 1, backgroundColor: colors.rule }]}>
                  <Ionicons name="calendar-outline" size={16} color={colors.inkSoft} />
                  <Text style={[styles.actionSecondaryText, { color: colors.inkSoft }]}>New puzzle tomorrow</Text>
                </View>
              )}
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  toast: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    backgroundColor: colors.ink,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    zIndex: 100,
  },
  toastText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.bg,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  modeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  modeBadgeText: {
    fontFamily: fonts.extraBold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  helpButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  gridContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── How to Play ──
  modal: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  modalTitle: {
    fontFamily: fonts.black,
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 22,
    gap: 10,
  },
  htpText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.inkSoft,
    lineHeight: 22,
  },
  htpBold: {
    fontFamily: fonts.extraBold,
    color: colors.ink,
  },
  htpDivider: {
    height: 1,
    backgroundColor: colors.rule,
    marginVertical: 6,
  },
  htpRow: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 4,
  },
  htpTile: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  htpLetter: {
    fontFamily: fonts.black,
    fontSize: 18,
  },
  htpHint: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.inkSoft,
    marginBottom: 8,
  },

  // ── Complete Sheet ──
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(30,26,20,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 14,
    alignItems: 'center',
    gap: 14,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.10,
    shadowRadius: 28,
    elevation: 24,
  },
  handle: {
    width: 38,
    height: 5,
    borderRadius: 99,
    backgroundColor: colors.rule,
    marginBottom: 4,
  },
  trophyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -46,
    shadowColor: colors.bg,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 0,
    borderWidth: 6,
    borderColor: colors.surface,
  },
  completeTitle: {
    fontFamily: fonts.black,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.6,
    marginTop: 6,
  },
  completeSub: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  statTiles: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  statTile: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
  },
  statTileValue: {
    fontFamily: fonts.black,
    fontSize: 20,
    letterSpacing: -0.4,
  },
  statTileLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  emojiGrid: {
    gap: 2,
    alignItems: 'center',
  },
  emojiRow: {
    fontSize: 22,
    letterSpacing: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  shareBtn: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSecondary: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSecondaryText: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  actionPrimary: {
    flex: 1.4,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  actionPrimaryText: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
});
