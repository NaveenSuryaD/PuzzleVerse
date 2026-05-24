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

// Last Letter: chain words where each word starts with the last letter of the previous
const STARTER_WORDS = ['APPLE','ORANGE','EAGLE','TIGER','RIVER','OCEAN','NIGHT','TOWER','EARTH'];

const WORD_LIST = new Set([
  'APPLE','EAGLE','ELM','EAST','EARTH','EEL','ELK','EAR','EGG','END',
  'ORANGE','ELBOW','EVERY','EVEN','EDGE','EXTRA','EXCEL','EPIC',
  'TIGER','RAIN','ROAD','RIDE','ROPE','RING','ROSE','RUBY','RUSH',
  'RIVER','RAFT','RACE','RATE','RUNE','RULE','ROLE','ROOF','ROCK',
  'OCEAN','NAIL','NAME','NEON','NODE','NOTE','NORM','NONE','NEWS',
  'NIGHT','TOWER','TIMBER','TRACK','TRAIN','TREAT','TRIAL','TRIBE',
  'EARTH','HELP','HORN','HOPE','HOME','HOSE','HOLE','HIVE','HERO',
  'ANT','ARC','ARM','ART','ACE','AGE','AID','AIM','AIR','ALE',
  'BAT','BAY','BEE','BIG','BIT','BOX','BUD','BUG','BUN','BUS',
  'CAP','CAR','CAT','COB','COD','COG','COP','COT','COW','CUP',
  'DAD','DIM','DIP','DOG','DOT','DUG','DUO','DYE',
  'EAT','EEL','EGG','ELK','ELM','EMU','ERR','EVE',
  'FAN','FAR','FAT','FED','FEW','FIG','FIN','FIT','FLY','FOX','FRY','FUN','FUR',
  'GAP','GAS','GEL','GEM','GIG','GIN','GNU','GOB','GOD','GOT','GUM','GUN','GUT','GUY',
  'HAD','HAM','HAT','HAY','HEM','HEN','HIM','HIP','HIT','HOP','HOT','HUB','HUG','HUM','HUT',
  'ICE','ILL','INN','ION','IRE','IVY',
  'JAB','JAG','JAM','JAR','JAW','JET','JIG','JOB','JOG','JOT','JOY','JUG','JUT',
  'KEG','KIT','LAB','LAD','LAP','LAW','LAX','LAY','LED','LEG','LET','LID','LIP','LIT','LOG','LOT','LOW',
  'MAP','MAR','MAT','MAW','MAY','MEN','MET','MID','MOB','MOD','MOP','MOW','MUD','MUG','MUM',
  'NAB','NAG','NAP','NET','NIB','NIP','NIT','NOB','NOD','NOT','NOW',
  'OAK','OAR','OAT','ODD','ODE','OFT','OHM','OIL','OLD','OPT','ORB','ORE','OWE','OWL','OWN',
  'PAD','PAL','PAM','PAP','PAR','PAT','PAW','PAY','PEA','PEG','PEN','PET','PEW','PIG','PIN','PIP','PIT','POD','POP','POT','POW','PUB','PUG','PUN','PUP','PUS','PUT',
  'RAG','RAM','RAN','RAP','RAW','RAY','RED','RIB','RID','RIG','RIM','RIP','ROB','ROD','ROT','ROW','RUB','RUG','RUN','RUT',
  'SAC','SAG','SAP','SAW','SAY','SET','SEW','SIP','SIR','SIT','SIX','SOB','SOD','SON','SOP','SOT','SOW','SOY','SUB','SUM','SUN','SUP',
  'TAB','TAG','TAN','TAP','TAR','TAT','TAW','TAX','TED','TEN','TIE','TIN','TIP','TOE','TOG','TON','TOO','TOP','TOT','TOW','TOY','TUB','TUG','TUN',
  'UDO','UGH','UMP','UNI','UPO','URN','USE',
  'VAN','VAR','VAT','VET','VIA','VIM','VIE','VOW',
  'WAN','WAR','WAX','WAY','WEB','WED','WET','WIG','WIN','WIT','WOE','WOK','WON','WOO',
  'YAK','YAM','YAP','YAW','YEA','YEP','YES','YET','YEW','YIN','YOB',
  'ZAP','ZED','ZEN','ZIT','ZOO',
]);

export function LastLetterGame({ onComplete, onBack, savedStateJSON }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => { try { return savedStateJSON ? JSON.parse(savedStateJSON) : null; } catch { return null; } }, []);
  const [starterIdx] = useState<number>(() => saved?.starterIdx ?? Math.floor(Math.random() * STARTER_WORDS.length));
  const starter = STARTER_WORDS[starterIdx];
  const [chain, setChain] = useState<string[]>(() => saved?.chain ?? [starter]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  useSaveGame('last-letter', () => ({ starterIdx, chain }), !done, [chain], elapsedRef);
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

  const lastWord = chain[chain.length - 1];
  const neededLetter = lastWord[lastWord.length - 1];

  const handleSubmit = useCallback(() => {
    const word = input.trim().toUpperCase();
    setInput('');
    if (word.length < 2) { setError('Too short'); return; }
    if (word[0] !== neededLetter) {
      setError(`Must start with "${neededLetter}"`);
      return;
    }
    if (!WORD_LIST.has(word)) { setError('Not a valid word'); return; }
    if (chain.includes(word)) { setError('Already used!'); return; }
    setError('');
    const newChain = [...chain, word];
    setChain(newChain);
    // Win after 10 words in chain
    if (newChain.length >= 10) finish(true);
  }, [input, chain, neededLetter, finish]);

  return (
    <View style={s.container}>
      <Text style={s.title}>Last Letter</Text>
      <Text style={s.subtitle}>Each word must start with the last letter of the previous</Text>
      <Text style={s.progress}>Chain: {chain.length} / 10 words</Text>

      <View style={s.promptBox}>
        <Text style={s.promptLabel}>Start with:</Text>
        <Text style={s.promptLetter}>{neededLetter}</Text>
      </View>

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={t => setInput(t.toUpperCase())}
          placeholder={`Starts with ${neededLetter}...`}
          placeholderTextColor={colors.inkMuted}
          autoCapitalize="characters"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
        <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
          <Text style={s.submitBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {!!error && <Text style={s.error}>{error}</Text>}

      <View style={s.chainList}>
        {chain.map((w, i) => (
          <View key={i} style={s.chainRow}>
            <Text style={s.chainIdx}>{i+1}.</Text>
            <Text style={s.chainWord}>{w}</Text>
            {i < chain.length - 1 && (
              <Text style={s.chainArrow}>→ <Text style={s.chainHighlight}>{w[w.length-1]}</Text></Text>
            )}
          </View>
        ))}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🔗' : '⛔'}</Text>
            <Text style={s.modalTitle}>{won ? 'Chain Master!' : 'Stuck!'}</Text>
            <Text style={s.modalSub}>{chain.length} word chain</Text>
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
              const newStarter = STARTER_WORDS[Math.floor(Math.random() * STARTER_WORDS.length)];
              setChain([newStarter]);
              setInput(''); setError('');
              elapsedRef.current = 0;
              timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
            }}>
              <Text style={s.modalBtnText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 24, paddingTop: 40 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginBottom: 8, textAlign: 'center' },
  progress: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted, marginBottom: 16 },
  promptBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.word.bg, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, marginBottom: 16 },
  promptLabel: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.word.ink },
  promptLetter: { fontFamily: fonts.black, fontSize: 36, color: colors.word.ink },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 8, width: '100%' },
  input: { flex: 1, fontFamily: fonts.bold, fontSize: 16, color: colors.ink, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.divider, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  submitBtn: { backgroundColor: colors.ink, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, justifyContent: 'center' },
  submitBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
  error: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.danger, marginBottom: 8 },
  chainList: { width: '100%', marginTop: 8 },
  chainRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  chainIdx: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, width: 20 },
  chainWord: { fontFamily: fonts.black, fontSize: 16, color: colors.ink, flex: 1 },
  chainArrow: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted },
  chainHighlight: { color: colors.word.ink, fontFamily: fonts.black },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
