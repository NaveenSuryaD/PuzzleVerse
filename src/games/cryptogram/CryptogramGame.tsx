import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { STATIC_PUZZLES } from './puzzles';
import * as Haptics from 'expo-haptics';
import { useSaveGame } from '../../utils/gameSave';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  savedStateJSON?: string;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function CryptogramGame({ onComplete, onBack, savedStateJSON }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => { try { return savedStateJSON ? JSON.parse(savedStateJSON) : null; } catch { return null; } }, []);
  const [puzzleIdx] = useState<number>(() => saved?.puzzleIdx ?? Math.floor(Math.random() * STATIC_PUZZLES.length));
  const puzzle = STATIC_PUZZLES[puzzleIdx];

  // User's guesses: encoded letter -> user's decoded letter
  const [guesses, setGuesses] = useState<Record<string, string>>(() => saved?.guesses ?? {});
  const [selectedEncoded, setSelectedEncoded] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  useSaveGame('cryptogram', () => ({ puzzleIdx, guesses }), !done, [puzzleIdx, guesses], elapsedRef);

  const s = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const finish = useCallback((w: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setWon(w);
    setDone(true);
    onComplete(w, elapsedRef.current);
  }, [onComplete]);

  const checkSolved = useCallback((g: Record<string, string>) => {
    const encoded = puzzle.encoded.replace(/ /g, '');
    const decoded = puzzle.decoded.replace(/ /g, '');
    const allCorrect = encoded.split('').every((ec, i) => {
      if (ec === ' ') return true;
      return g[ec] === decoded[i];
    });
    if (allCorrect) finish(true);
  }, [puzzle, finish]);

  const handleAlphabetTap = useCallback((letter: string) => {
    if (!selectedEncoded) return;
    setGuesses(prev => {
      const next = { ...prev, [selectedEncoded]: letter };
      // Auto-fill all same encoded letters
      checkSolved(next);
      return next;
    });
    setSelectedEncoded(null);
  }, [selectedEncoded, checkSolved]);

  const words = puzzle.encoded.split(' ');
  const decodedWords = puzzle.decoded.split(' ');

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.title}>Cryptogram</Text>
      <Text style={s.subtitle}>Decode the quote by tapping encoded letters</Text>
      <Text style={s.author}>— {puzzle.author}</Text>

      <View style={s.quoteWrap}>
        {words.map((word, wi) => (
          <View key={wi} style={s.wordGroup}>
            {word.split('').map((encodedChar, ci) => {
              const guess = guesses[encodedChar];
              const correctChar = decodedWords[wi]?.[ci];
              const isSelected = selectedEncoded === encodedChar;
              return (
                <TouchableOpacity
                  key={ci}
                  style={[s.letterBox, isSelected && s.letterBoxSelected]}
                  onPress={() => setSelectedEncoded(encodedChar)}
                  activeOpacity={0.7}
                >
                  <Text style={s.guessLetter}>{guess ?? ' '}</Text>
                  <View style={s.separator} />
                  <Text style={s.encodedLetter}>{encodedChar}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Alphabet keyboard */}
      <View style={s.keyboard}>
        {ALPHABET.map(l => (
          <TouchableOpacity
            key={l}
            style={[s.key, Object.values(guesses).includes(l) && s.keyUsed]}
            onPress={() => handleAlphabetTap(l)}
            activeOpacity={0.7}
          >
            <Text style={s.keyText}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🔓' : '🔒'}</Text>
            <Text style={s.modalTitle}>{won ? 'Decoded!' : 'Keep Trying'}</Text>
            <Text style={s.modalQuote} numberOfLines={3}>"{puzzle.decoded}"</Text>
            {onBack && (
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 8 }]}
                onPress={onBack}
              >
                <Text style={[s.modalBtnText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.modalBtn} onPress={() => {
              setDone(false); completedRef.current = false;
              setGuesses({}); setSelectedEncoded(null);
              elapsedRef.current = 0;
              timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
            }}>
              <Text style={s.modalBtnText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { alignItems: 'center', padding: 20, paddingBottom: 40 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 4 },
  author: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft, marginBottom: 20 },
  quoteWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 24 },
  wordGroup: { flexDirection: 'row', gap: 3 },
  letterBox: { width: 24, alignItems: 'center', paddingBottom: 2, backgroundColor: colors.surface, borderRadius: 4 },
  letterBoxSelected: { backgroundColor: colors.logic.bg, borderWidth: 1, borderColor: colors.logic.ink },
  guessLetter: { fontFamily: fonts.black, fontSize: 14, color: colors.ink, height: 18 },
  separator: { height: 1, width: '100%', backgroundColor: colors.ink, marginVertical: 2 },
  encodedLetter: { fontFamily: fonts.regular, fontSize: 10, color: colors.inkMuted },
  keyboard: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 340 },
  key: { width: 36, height: 36, backgroundColor: colors.surface, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.divider },
  keyUsed: { backgroundColor: colors.rule, opacity: 0.5 },
  keyText: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 320 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalQuote: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.inkMuted, marginBottom: 24, textAlign: 'center', fontStyle: 'italic' },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
