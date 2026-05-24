import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';
import { useSaveGame } from '../../utils/gameSave';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  savedStateJSON?: string;
}

// Word Morph: change one letter at a time to reach the target word
const PUZZLES = [
  { start: 'CAT', target: 'DOG', maxSteps: 4 },
  { start: 'HOT', target: 'COD', maxSteps: 3 },
  { start: 'BIT', target: 'BAG', maxSteps: 3 },
  { start: 'FIG', target: 'FAD', maxSteps: 3 },
  { start: 'PAN', target: 'MAT', maxSteps: 3 },
];

// Simple word list for validation
const VALID_WORDS = new Set([
  'CAT','BAT','BAD','BAG','BIG','BIT','COD','COT','COG','DAD','DOG','DOT',
  'FAD','FIG','FIT','FIG','FOG','GOD','GOT','HAT','HOT','HOG','HOD',
  'MAD','MAN','MAT','MAG','MAT','PAT','PAN','PAD','RAT','SAT','SAP',
  'TAP','TAT','TAD','TAN','TIP','TOP','TAB','NAP','NAB','NAG',
  'CAP','CAN','CON','COP','CUP','CUT','DAM','DIM','DIP','DIT',
  'FAN','FAT','FED','FEW','FIN','FOX','FUN','GAG','GAP','GAS',
  'GET','GIN','GOB','GUM','GUN','GUT','HAD','HAM','HIM','HIP',
  'HIT','HOP','HUB','HUM','HUT','JAB','JAG','JAM','JAR','JAW',
  'JIG','JOB','JOT','JOY','JUG','LAB','LAD','LAP','LAW','LAX',
  'LAY','LED','LEG','LET','LID','LIP','LIT','LOB','LOG','LOT',
  'LOW','MAP','MOP','MOB','MOD','MUD','MUG','MUM','NAP','NET',
  'NIB','NIP','NIT','NOB','NOD','NOP','NOR','NOT','ODD','OPT',
  'PAL','PAM','PAP','PAR','PAW','PAY','PEA','PEG','PEN','PET',
  'PEW','PIG','PIN','PIP','PIT','POD','POP','POT','POW','PUB',
  'PUG','PUN','PUP','PUS','PUT','RAG','RAM','RAN','RAP','RAW',
  'RAY','RED','RIB','RID','RIG','RIM','RIP','ROB','ROD','ROT',
  'ROW','RUB','RUG','RUN','RUT','SAC','SAG','SAW','SAY','SEA',
  'SET','SEW','SIP','SIR','SIT','SIX','SOB','SOD','SON','SOP',
  'SOT','SOW','SOY','SPA','SPY','STY','SUB','SUM','SUN','SUP',
  'TAB','TAG','TAN','TAR','TAW','TAX','TED','TEN','THE','TIE',
  'TIN','TIP','TOD','TOE','TOG','TOM','TON','TOO','TOP','TOT',
  'TOW','TOY','TUB','TUG','TUN','TWO','URN','VAN','VAR','VAT',
  'VET','VIA','VIM','VIE','VOW','WAN','WAR','WAS','WAX','WAY',
  'WEB','WED','WET','WHO','WHY','WIG','WIN','WIT','WOE','WOG',
  'WOK','WON','WOO','WOP','WOT','YAK','YAM','YAP','YAW','YEA',
  'YEP','YES','YET','YEW','YIN','YOB','YOD','YOM','YON','YOW',
  'ZAG','ZAP','ZED','ZEK','ZEN','ZIT','ZOO',
]);

function isOneLetterChange(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diff++;
  }
  return diff === 1;
}

export function WordMorphGame({ onComplete, onBack, savedStateJSON }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => { try { return savedStateJSON ? JSON.parse(savedStateJSON) : null; } catch { return null; } }, []);
  const [puzIdx, setPuzIdx] = useState<number>(() => saved?.puzIdx ?? 0);
  const puz = PUZZLES[puzIdx];

  const [chain, setChain] = useState<string[]>(() => saved?.chain ?? [puz.start]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  useSaveGame('word-morph', () => ({ puzIdx, chain }), !done, [puzIdx, chain], elapsedRef);
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

  const handleSubmit = useCallback(() => {
    const word = input.trim().toUpperCase();
    setInput('');
    if (word.length !== puz.start.length) {
      setError(`Must be ${puz.start.length} letters`);
      return;
    }
    const last = chain[chain.length - 1];
    if (!isOneLetterChange(last, word)) {
      setError('Must change exactly 1 letter');
      return;
    }
    if (!VALID_WORDS.has(word)) {
      setError('Not a valid word');
      return;
    }
    if (chain.includes(word)) {
      setError('Already used that word');
      return;
    }
    setError('');
    const newChain = [...chain, word];
    setChain(newChain);
    if (word === puz.target) {
      finish(true);
    } else if (newChain.length > puz.maxSteps + 1) {
      finish(false);
    }
  }, [input, chain, puz, finish]);

  const stepsLeft = puz.maxSteps - (chain.length - 1);

  return (
    <View style={s.container}>
      <Text style={s.title}>Word Morph</Text>
      <Text style={s.subtitle}>Change one letter at a time · Reach the target</Text>

      <View style={s.headerRow}>
        <View style={s.wordBadge}>
          <Text style={s.wordBadgeLabel}>Start</Text>
          <Text style={s.wordBadgeWord}>{puz.start}</Text>
        </View>
        <Text style={s.arrow}>→</Text>
        <View style={[s.wordBadge, { backgroundColor: colors.number.bg }]}>
          <Text style={[s.wordBadgeLabel, { color: colors.number.ink }]}>Target</Text>
          <Text style={[s.wordBadgeWord, { color: colors.number.ink }]}>{puz.target}</Text>
        </View>
      </View>

      <Text style={s.stepsLeft}>Steps left: {stepsLeft}</Text>

      <View style={s.chain}>
        {chain.map((w, i) => (
          <View key={i} style={s.chainItem}>
            <Text style={s.chainWord}>{w}</Text>
            {i < chain.length - 1 && <Text style={s.chainArrow}>↓</Text>}
          </View>
        ))}
      </View>

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={t => setInput(t.toUpperCase())}
          placeholder="Enter word..."
          placeholderTextColor={colors.inkMuted}
          maxLength={puz.start.length}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
          <Text style={s.submitBtnText}>Go</Text>
        </TouchableOpacity>
      </View>

      {!!error && <Text style={s.error}>{error}</Text>}

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🔄' : '❌'}</Text>
            <Text style={s.modalTitle}>{won ? 'Morphed!' : 'Too many steps'}</Text>
            <Text style={s.modalSub}>{chain.join(' → ')}</Text>
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
              const next = (puzIdx + 1) % PUZZLES.length;
              setPuzIdx(next);
              setChain([PUZZLES[next].start]);
              setInput(''); setError('');
              elapsedRef.current = 0;
              timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
            }}>
              <Text style={s.modalBtnText}>Next Puzzle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 20, textAlign: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  wordBadge: { backgroundColor: colors.word.bg, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  wordBadgeLabel: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.word.ink, marginBottom: 4 },
  wordBadgeWord: { fontFamily: fonts.black, fontSize: 24, color: colors.word.ink },
  arrow: { fontFamily: fonts.black, fontSize: 22, color: colors.inkMuted },
  stepsLeft: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted, marginBottom: 16 },
  chain: { alignItems: 'center', marginBottom: 20 },
  chainItem: { alignItems: 'center' },
  chainWord: { fontFamily: fonts.black, fontSize: 20, color: colors.ink, backgroundColor: colors.surface2, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  chainArrow: { fontFamily: fonts.bold, fontSize: 16, color: colors.inkMuted, marginVertical: 2 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: { fontFamily: fonts.black, fontSize: 18, color: colors.ink, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.divider, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, width: 140, textAlign: 'center' },
  submitBtn: { backgroundColor: colors.ink, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, justifyContent: 'center' },
  submitBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
  error: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.danger, marginTop: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 24, textAlign: 'center' },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
