import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, Dimensions,
} from 'react-native';
import { useTheme, type ThemeColors } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { getRandomWord } from './wordbank';
import type { GameStatus, LetterStatus } from './types';

const MAX_WRONG = 6;
const { width: SCREEN_W } = Dimensions.get('window');
const KEY_W = Math.floor((SCREEN_W - 32 - 9 * 4) / 10);
const KEY_H = 42;

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
}

function HangmanDrawing({ wrongCount, colors }: { wrongCount: number; colors: ThemeColors }) {
  const stroke = colors.ink;
  return (
    <View style={{ width: 180, height: 200 }}>
      {/* Gallows — always visible */}
      <View style={[draw.bar, { bottom: 0, left: 0, right: 0, height: 5, backgroundColor: stroke }]} />
      <View style={[draw.bar, { top: 0, left: 28, width: 5, bottom: 0, backgroundColor: stroke }]} />
      <View style={[draw.bar, { top: 0, left: 28, right: 28, height: 5, backgroundColor: stroke }]} />
      <View style={[draw.bar, { top: 5, right: 28, width: 4, height: 25, backgroundColor: stroke }]} />
      {/* Head */}
      {wrongCount >= 1 && (
        <View style={[draw.bar, {
          top: 30, right: 12, width: 36, height: 36, borderRadius: 18,
          backgroundColor: 'transparent', borderWidth: 3, borderColor: stroke,
        }]} />
      )}
      {/* Body */}
      {wrongCount >= 2 && (
        <View style={[draw.bar, { top: 66, right: 28, width: 4, height: 52, backgroundColor: stroke }]} />
      )}
      {/* Left arm */}
      {wrongCount >= 3 && (
        <View style={[draw.bar, {
          top: 89, left: 124, width: 30, height: 4,
          backgroundColor: stroke, transform: [{ rotate: '-45deg' }],
        }]} />
      )}
      {/* Right arm */}
      {wrongCount >= 4 && (
        <View style={[draw.bar, {
          top: 89, left: 146, width: 30, height: 4,
          backgroundColor: stroke, transform: [{ rotate: '45deg' }],
        }]} />
      )}
      {/* Left leg */}
      {wrongCount >= 5 && (
        <View style={[draw.bar, {
          top: 127, left: 124, width: 30, height: 4,
          backgroundColor: stroke, transform: [{ rotate: '-45deg' }],
        }]} />
      )}
      {/* Right leg */}
      {wrongCount >= 6 && (
        <View style={[draw.bar, {
          top: 127, left: 146, width: 30, height: 4,
          backgroundColor: stroke, transform: [{ rotate: '45deg' }],
        }]} />
      )}
    </View>
  );
}

const draw = StyleSheet.create({
  bar: { position: 'absolute', borderRadius: 3 },
});

export function HangmanGame({ onComplete }: Props) {
  const colors = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const isDark = colors.bg === '#16110A';

  const [word, setWord] = useState(getRandomWord);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');

  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  const wrongCount = useMemo(
    () => [...guessed].filter(l => !word.includes(l)).length,
    [guessed, word],
  );

  const allRevealed = useMemo(
    () => word.split('').every(l => guessed.has(l)),
    [guessed, word],
  );

  const finish = useCallback((won: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setGameStatus(won ? 'won' : 'lost');
    onComplete(won, elapsedRef.current);
  }, [onComplete]);

  useEffect(() => {
    if (gameStatus !== 'playing') return;
    if (allRevealed) finish(true);
    else if (wrongCount >= MAX_WRONG) finish(false);
  }, [allRevealed, wrongCount, gameStatus, finish]);

  const guess = useCallback((letter: string) => {
    if (gameStatus !== 'playing' || guessed.has(letter)) return;
    setGuessed(prev => new Set([...prev, letter]));
  }, [gameStatus, guessed]);

  const letterStatus = useCallback((l: string): LetterStatus => {
    if (!guessed.has(l)) return 'idle';
    return word.includes(l) ? 'correct' : 'wrong';
  }, [guessed, word]);

  const wrongLetters = useMemo(
    () => [...guessed].filter(l => !word.includes(l)).join('  '),
    [guessed, word],
  );

  const restart = useCallback(() => {
    setWord(getRandomWord());
    setGuessed(new Set());
    setGameStatus('playing');
    elapsedRef.current = 0;
    completedRef.current = false;
    startTimer();
  }, [startTimer]);

  const blankW = word.length > 7 ? 24 : 30;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Drawing */}
      <View style={s.drawingWrap}>
        <HangmanDrawing wrongCount={wrongCount} colors={colors} />
      </View>

      {/* Mistake dots */}
      <View style={s.mistakeRow}>
        {Array.from({ length: MAX_WRONG }).map((_, i) => (
          <View
            key={i}
            style={[
              s.mistakeDot,
              { backgroundColor: i < wrongCount ? colors.danger : colors.rule },
            ]}
          />
        ))}
      </View>

      {/* Word tiles */}
      <View style={s.wordRow}>
        {word.split('').map((letter, i) => (
          <View key={i} style={[s.blank, { width: blankW }]}>
            <Text style={[s.blankLetter, { color: colors.ink }]}>
              {guessed.has(letter) ? letter : ''}
            </Text>
            <View style={[s.blankLine, { backgroundColor: colors.inkMuted }]} />
          </View>
        ))}
      </View>

      {/* Wrong letters strip */}
      <Text style={s.wrongLetters}>{wrongLetters || ' '}</Text>

      {/* QWERTY keyboard */}
      <View style={s.keyboard}>
        {ROWS.map((row, ri) => (
          <View key={ri} style={s.keyRow}>
            {row.map(letter => {
              const status = letterStatus(letter);
              return (
                <TouchableOpacity
                  key={letter}
                  onPress={() => guess(letter)}
                  activeOpacity={0.7}
                  disabled={status !== 'idle'}
                >
                  <View style={[
                    s.key,
                    status === 'correct' && { backgroundColor: colors.success },
                    status === 'wrong' && {
                      backgroundColor: isDark ? '#3A3530' : '#C8BFB0',
                    },
                  ]}>
                    <Text style={[
                      s.keyText,
                      status === 'correct' && { color: isDark ? colors.bg : '#FFFFFF' },
                      status === 'wrong' && { color: colors.inkMuted },
                    ]}>{letter}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Complete Modal */}
      <Modal visible={gameStatus !== 'playing'} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={[
              s.trophyCircle,
              { backgroundColor: gameStatus === 'won' ? colors.logic.bg : colors.word.bg },
            ]}>
              <Text style={s.trophyEmoji}>{gameStatus === 'won' ? '🎉' : '💀'}</Text>
            </View>

            <Text style={s.modalTitle}>
              {gameStatus === 'won' ? 'You Got It!' : 'Game Over'}
            </Text>

            <View style={[s.wordReveal, { backgroundColor: colors.surface2 }]}>
              {word.split('').map((letter, i) => (
                <Text
                  key={i}
                  style={[
                    s.revealLetter,
                    { color: gameStatus === 'won' ? colors.success : colors.danger },
                  ]}
                >{letter}</Text>
              ))}
            </View>

            <Text style={s.modalSub}>
              {gameStatus === 'won'
                ? `Solved with ${wrongCount} wrong guess${wrongCount === 1 ? '' : 'es'}`
                : 'Better luck next time!'}
            </Text>

            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.ink }]}
              onPress={restart}
              activeOpacity={0.8}
            >
              <Text style={[s.btnText, { color: colors.bg }]}>Play Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { alignItems: 'center', paddingTop: 12, paddingBottom: 32 },

  drawingWrap: {
    width: 180, height: 200, alignItems: 'center', justifyContent: 'center',
  },

  mistakeRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  mistakeDot: { width: 10, height: 10, borderRadius: 5 },

  wordRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 5, marginTop: 18,
    paddingHorizontal: 16, maxWidth: SCREEN_W,
  },
  blank: { alignItems: 'center', paddingBottom: 2 },
  blankLetter: { fontFamily: fonts.black, fontSize: 22 },
  blankLine: { height: 2, width: '100%', borderRadius: 1, marginTop: 4 },

  wrongLetters: {
    fontFamily: fonts.bold, fontSize: 13, color: colors.danger,
    letterSpacing: 2, marginTop: 10, minHeight: 20,
  },

  keyboard: {
    marginTop: 14, alignItems: 'center', gap: 5, paddingHorizontal: 16,
  },
  keyRow: { flexDirection: 'row', gap: 4 },
  key: {
    width: KEY_W, height: KEY_H, borderRadius: 10,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.ink, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 2, elevation: 2,
  },
  keyText: { fontFamily: fonts.extraBold, fontSize: 14, color: colors.ink },

  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modal: {
    width: '100%', backgroundColor: colors.surface,
    borderRadius: 28, padding: 28, alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 24, elevation: 10,
  },
  trophyCircle: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  trophyEmoji: { fontSize: 36 },
  modalTitle: {
    fontFamily: fonts.black, fontSize: 26, color: colors.ink, letterSpacing: -0.5,
  },
  wordReveal: {
    flexDirection: 'row', gap: 4, paddingVertical: 10,
    paddingHorizontal: 14, borderRadius: 14,
  },
  revealLetter: { fontFamily: fonts.black, fontSize: 20, letterSpacing: 1 },
  modalSub: {
    fontFamily: fonts.semiBold, fontSize: 14, color: colors.inkMuted, textAlign: 'center',
  },
  btn: {
    width: '100%', height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  btnText: { fontFamily: fonts.extraBold, fontSize: 16 },
});
