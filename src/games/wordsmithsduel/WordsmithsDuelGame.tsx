import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

// Wordsmiths Duel: player vs AI - take turns forming words from a shared letter pool
// Each turn pick letters from the pool to form a word
const LETTER_POOLS = [
  'ABCDEFGHIJKLM',
  'NOPQRSTUVWXYZ',
  'AEIOUBCDFGHJK',
  'LMNPQRSTVWXYZ',
];

const VALID_WORDS_DUEL = new Set([
  'ACE','AGE','AID','AIM','AIR','ALE','AND','ANT','APE','ARC','ARE','ARK','ARM','ART',
  'BED','BIG','BIT','BOX','BUD','BUG','BUN','BUS','CAN','CAP','CAR','CAT','COB',
  'COD','COG','COP','COT','DAD','DIG','DIM','DOG','DUG','DUO','EAR','EEL','EGG',
  'ELK','FAD','FAN','FAR','FIG','FIN','FIT','GEM','GIN','GOD','GOT','GUM','GUN',
  'GUT','HAM','HAT','HAY','HIM','HIP','HIT','HOT','HUB','HUM','HUT','ICE','ILL',
  'INN','JAB','JAG','JAM','JAR','JIG','JOB','KEG','KIT','LAD','LAP','LAW','LED',
  'LEG','LID','LIT','LOG','LOT','MAP','MAT','MEN','MOB','MOP','MUD','MUG','NAB',
  'NAG','NAP','NET','NIP','NOD','OAK','OAR','ODD','OIL','PAD','PAL','PAP','PAT',
  'PEG','PEN','PET','PIG','PIN','PIT','POD','POP','POT','PUB','PUN','PUT','RAG',
  'RAM','RAP','RAW','RED','RIB','RIG','RIM','ROB','ROD','ROT','RUG','RUN','SAP',
  'SAW','SET','SEW','SIP','SIT','SOB','SOD','SON','SUB','SUM','SUN','TAG','TAN',
  'TAP','TAR','TED','TEN','TIN','TIP','TOE','TON','TOP','TOT','TOW','TUB','TUG',
  'VAN','VET','VIA','VIM','WAN','WAR','WAX','WEB','WED','WIG','WIN','WIT','WOE',
  'YAK','YAM','YAP','YEA','ZAP','ZED','ZEN','ZIT',
  // 4-letter words
  'ABLE','ACID','AGED','ALSO','ARCH','AREA','ARMY','ARMY','ATOM',
  'BACK','BAKE','BALL','BAND','BARN','BASE','BATH','BEAR','BEAT','BELL',
  'BILL','BIRD','BITE','BLOW','BLUE','BOLD','BOND','BONE','BOOK','BOOM',
  'BORN','CALL','CALM','CAMP','CARD','CARE','CART','CASE','CAST','CAVE',
  'CENT','CHEF','CHIN','CHIP','CHOP','CITY','CLAM','CLAN','CLAW','CLAY',
  'CLUB','COAL','COAT','CODE','COIL','COIN','COLD','COME','COOK','COPE',
  'COPY','CORD','CORE','CORN','COST','COUP','CRAM','CROP','CROW','CUBE',
  'CURE','CURL','CUTE','DAME','DAMP','DARE','DARK','DART','DASH','DATA',
  'DATE','DAWN','DEAL','DEAR','DEBT','DECK','DEED','DEEP','DEEM','DEER',
  'DENT','DIET','DIME','DINE','DIRE','DIRT','DISC','DISK','DIVE','DOCK',
  'DOME','DONE','DOOM','DOOR','DOSE','DOVE','DOWN','DRAB','DRAG','DRAW',
  'DRIP','DROP','DRUM','DULL','DUMP','DUNE','DUSK','DUST','EACH','EARL',
  'EARN','EASE','EAST','EDGE','EMIT','EPIC','EVEN','EVER','EVIL','EXAM',
  'FACE','FACT','FAIL','FAIR','FAKE','FAME','FARM','FAST','FATE','FAWN',
  'FEAR','FEAT','FEED','FEEL','FEET','FILE','FILL','FILM','FIND','FIRE',
  'FIRM','FISH','FIST','FIZZ','FLAW','FLEA','FLEW','FLEX','FLIP','FLIT',
  'FLOG','FLOO','FLOW','FOAM','FOLD','FOLK','FOND','FONT','FOOL','FORD',
  'FORK','FORM','FORT','FOUL','FRAY','FREE','FROG','FROM','FUEL','FULL',
  'FUND','FUSE','GAIN','GAME','GAPE','GASP','GATE','GAVE','GEAR','GIFT',
  'GILD','GIST','GIVE','GLAD','GLOB','GLOW','GLUE','GOAD','GOAL','GOAT',
  'GOLD','GOLF','GONE','GONG','GOON','GORE','GOWN','GRAB','GRAD','GRAM',
  'GREW','GREY','GRIN','GRIP','GRIT','GROW','GULF','GURU','GUST','HAIL',
  'HAIR','HALF','HALL','HALT','HAND','HANG','HARD','HARM','HARP','HASH',
  'HATE','HAVE','HAZE','HEAD','HEAL','HEAP','HEAR','HEAT','HEEL','HEED',
  'HELD','HELM','HELP','HERD','HERE','HERO','HIGH','HILL','HINT','HOLE',
  'HOPE','HORN','HOST','HOWL','HUGE','HULL','HUMP','HUNG','HUNT','HURL',
]);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function canFormWord(word: string, pool: string): boolean {
  const poolCopy = pool.split('');
  for (const ch of word) {
    const idx = poolCopy.indexOf(ch);
    if (idx < 0) return false;
    poolCopy.splice(idx, 1);
  }
  return true;
}

function removeLetters(pool: string, word: string): string {
  let p = pool;
  for (const ch of word) p = p.replace(ch, '');
  return p;
}

function getAIWord(pool: string): string | null {
  // Find all valid words from pool
  const valid = Array.from(VALID_WORDS_DUEL).filter(w => canFormWord(w, pool));
  if (valid.length === 0) return null;
  // Pick longest
  valid.sort((a,b) => b.length - a.length);
  return valid[0];
}

export function WordsmithsDuelGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const [pool, setPool] = useState(() => shuffle(LETTER_POOLS[0].split('')).join(''));
  const [playerWords, setPlayerWords] = useState<string[]>([]);
  const [aiWords, setAiWords] = useState<string[]>([]);
  const [selected, setSelected] = useState<number[]>([]); // indices in pool
  const [error, setError] = useState('');
  const [turn, setTurn] = useState<'player'|'ai'>('player');
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

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

  const doAITurn = useCallback((currentPool: string, pWords: string[], aWords: string[]) => {
    setAiThinking(true);
    setTimeout(() => {
      const aiWord = getAIWord(currentPool);
      if (!aiWord || currentPool.length < 3) {
        // AI can't play, player wins
        const playerScore = pWords.reduce((s,w) => s+w.length, 0);
        const aiScore = aWords.reduce((s,w) => s+w.length, 0);
        finish(playerScore >= aiScore);
        setAiThinking(false);
        return;
      }
      const newPool = removeLetters(currentPool, aiWord);
      const newAiWords = [...aWords, aiWord];
      setAiWords(newAiWords);
      setPool(newPool);
      setTurn('player');
      setAiThinking(false);
      // Check if pool is empty
      if (newPool.length < 3) {
        const playerScore = pWords.reduce((s,w) => s+w.length, 0);
        const aiScore = newAiWords.reduce((s,w) => s+w.length, 0);
        setTimeout(() => finish(playerScore >= aiScore), 500);
      }
    }, 800);
  }, [finish]);

  const handleLetterTap = useCallback((idx: number) => {
    if (turn !== 'player') return;
    setSelected(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx);
      return [...prev, idx];
    });
  }, [turn]);

  const handleSubmit = useCallback(() => {
    if (selected.length < 2) { setError('Select at least 2 letters'); return; }
    const word = selected.map(i => pool[i]).join('');
    if (!VALID_WORDS_DUEL.has(word)) { setError(`"${word}" is not valid`); return; }
    setError('');
    const newPool = pool.split('').filter((_, i) => !selected.includes(i)).join('');
    const newPlayerWords = [...playerWords, word];
    setPlayerWords(newPlayerWords);
    setPool(newPool);
    setSelected([]);
    setTurn('ai');

    if (newPool.length < 3) {
      const aiScore = aiWords.reduce((s,w) => s+w.length, 0);
      const playerScore = newPlayerWords.reduce((s,w) => s+w.length, 0);
      setTimeout(() => finish(playerScore >= aiScore), 300);
      return;
    }
    doAITurn(newPool, newPlayerWords, aiWords);
  }, [selected, pool, playerWords, aiWords, doAITurn, finish]);

  const currentWord = selected.map(i => pool[i]).join('');
  const playerScore = playerWords.reduce((s,w) => s+w.length, 0);
  const aiScore = aiWords.reduce((s,w) => s+w.length, 0);

  return (
    <View style={s.container}>
      <Text style={s.title}>Wordsmiths Duel</Text>
      <Text style={s.subtitle}>Form words from the pool · Most letters wins</Text>

      <View style={s.scoreRow}>
        <View style={s.scoreCard}>
          <Text style={s.scoreLabel}>You</Text>
          <Text style={s.scoreNum}>{playerScore}</Text>
          <Text style={s.scoreWords}>{playerWords.join(', ')}</Text>
        </View>
        <Text style={s.vs}>VS</Text>
        <View style={s.scoreCard}>
          <Text style={s.scoreLabel}>AI</Text>
          <Text style={s.scoreNum}>{aiScore}</Text>
          <Text style={s.scoreWords}>{aiWords.join(', ')}</Text>
        </View>
      </View>

      <Text style={s.poolLabel}>Letter Pool ({pool.length} left)</Text>
      <View style={s.pool}>
        {pool.split('').map((ch, i) => (
          <TouchableOpacity
            key={i}
            style={[s.poolLetter, selected.includes(i) && s.poolLetterSelected]}
            onPress={() => handleLetterTap(i)}
            activeOpacity={0.7}
          >
            <Text style={[s.poolLetterText, selected.includes(i) && s.poolLetterTextSelected]}>{ch}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.currentRow}>
        <Text style={[s.currentWord, VALID_WORDS_DUEL.has(currentWord) && s.currentWordValid]}>
          {currentWord || '—'}
        </Text>
      </View>

      {!!error && <Text style={s.error}>{error}</Text>}

      <View style={s.btnRow}>
        <TouchableOpacity style={s.clearBtn} onPress={() => setSelected([])} activeOpacity={0.8}>
          <Text style={s.clearBtnText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.submitBtn, (turn !== 'player' || aiThinking) && s.submitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={s.submitBtnText}>
            {aiThinking ? 'AI thinking...' : turn === 'ai' ? 'AI turn' : 'Play Word'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🏆' : '🤖'}</Text>
            <Text style={s.modalTitle}>{won ? 'You Win!' : 'AI Wins'}</Text>
            <Text style={s.modalSub}>You: {playerScore}  ·  AI: {aiScore}</Text>
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
              setPool(shuffle(LETTER_POOLS[Math.floor(Math.random()*LETTER_POOLS.length)].split('')).join(''));
              setPlayerWords([]); setAiWords([]); setSelected([]); setTurn('player'); setAiThinking(false);
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginBottom: 16, textAlign: 'center' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16, width: '100%' },
  scoreCard: { flex: 1, backgroundColor: colors.surface2, borderRadius: 12, padding: 10, alignItems: 'center' },
  scoreLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.inkMuted },
  scoreNum: { fontFamily: fonts.black, fontSize: 28, color: colors.ink },
  scoreWords: { fontFamily: fonts.semiBold, fontSize: 10, color: colors.inkMuted, textAlign: 'center' },
  vs: { fontFamily: fonts.black, fontSize: 18, color: colors.inkMuted },
  poolLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.inkMuted, marginBottom: 8 },
  pool: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 12 },
  poolLetter: { width: 40, height: 44, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  poolLetterSelected: { backgroundColor: colors.classic.bg, borderColor: colors.classic.ink, borderWidth: 2 },
  poolLetterText: { fontFamily: fonts.black, fontSize: 18, color: colors.ink },
  poolLetterTextSelected: { color: colors.classic.ink },
  currentRow: { height: 44, justifyContent: 'center', marginBottom: 4 },
  currentWord: { fontFamily: fonts.black, fontSize: 24, color: colors.ink },
  currentWordValid: { color: colors.success },
  error: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.danger, marginBottom: 4 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  clearBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  clearBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft },
  submitBtn: { backgroundColor: colors.ink, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontFamily: fonts.extraBold, fontSize: 14, color: colors.bg },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
