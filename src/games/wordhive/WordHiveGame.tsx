import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { useSettingsStore } from '../../store/useSettingsStore';
import * as Haptics from 'expo-haptics';
import { playSound } from '../../audio/sounds';
import { useSaveGame } from '../../utils/gameSave';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  savedStateJSON?: string;
}

const { width: SCREEN_W } = Dimensions.get('window');

const HIVE_SETS = [
  { letters: ['A','T','R','E','S','N','I'], center: 'A', validWords: ['ante','area','are','earn','ear','era','nest','near','neat','rant','rain','rein','rate','rent','rise','rains','rates','rants','stern','star','stare','train','tear','tears','tare','tares','stein','arise','strain','trains','retain','retains'], panagram: 'retains' },
  { letters: ['O','L','P','E','C','K','D'], center: 'O', validWords: ['clod','code','coke','cold','cope','coped','pod','pole','poke','pool','lock','lode','loped','plod','doc','dock','dole','doped','plop','locked','polka','cloaked'], panagram: 'pollock' },
  { letters: ['S','T','A','R','E','N','D'], center: 'S', validWords: ['stead','reads','dense','stand','trade','tread','rants','dents','stare','snare','dates','rates','trend','dares','saner','stander','anders','strand','detrans'], panagram: 'stranded' },
  { letters: ['P','I','N','G','H','T','S'], center: 'P', validWords: ['pint','ping','pins','pigs','spit','spin','snip','ship','thin','tips','nips','pings','tings','spite','thins','spins','hints','ships','split','spight'], panagram: 'spitting' },
  { letters: ['C','O','R','A','T','L','E'], center: 'C', validWords: ['care','core','coat','coal','oral','orca','race','lace','lore','role','rote','tore','talc','carte','crate','trace','octal','cleat','coral','color','actor','corel','locale'], panagram: 'electoral' },
  { letters: ['B','U','N','D','E','R','I'], center: 'U', validWords: ['burn','ruin','dune','bind','bird','rude','brine','ruined','brined','under','bundie','rind','bund','brine','unripe','burden'], panagram: 'burdening' },
  { letters: ['F','L','O','W','E','R','S'], center: 'F', validWords: ['floe','flow','fore','fowl','foes','folk','frow','flews','flesh','flows','fowls','flores','flower','flowers','floors','lowfer','self','wolf'], panagram: 'flowers' },
  { letters: ['M','A','T','H','I','C','S'], center: 'M', validWords: ['math','mast','mats','mist','mica','mass','itch','itch','matic','matic','match','atch','mastic','antics','chasm','schism','chats'], panagram: 'machists' },
  { letters: ['G','R','A','P','E','S','N'], center: 'G', validWords: ['gran','gape','gear','reap','rang','pang','snap','nag','nags','gears','grapes','pares','rages','snag','grans','genre','pangs','grape','span','spar','parse'], panagram: 'paragens' },
  { letters: ['W','O','R','D','L','E','S'], center: 'W', validWords: ['word','wore','wore','weld','woes','dose','role','rode','wore','lore','owed','words','lords','lower','lowes','doles','lower','lowed','world','worse','sword','swore'], panagram: 'worseled' },
];

const RANKS = [
  { label: 'Beginner', threshold: 0 },
  { label: 'Good Start', threshold: 0.05 },
  { label: 'Moving Up', threshold: 0.12 },
  { label: 'Good', threshold: 0.20 },
  { label: 'Solid', threshold: 0.30 },
  { label: 'Nice', threshold: 0.40 },
  { label: 'Great', threshold: 0.50 },
  { label: 'Amazing', threshold: 0.65 },
  { label: 'Genius', threshold: 0.80 },
  { label: 'Queen Bee', threshold: 1.0 },
];

function getRank(score: number, maxScore: number): string {
  if (maxScore === 0) return 'Beginner';
  const ratio = score / maxScore;
  let rank = RANKS[0].label;
  for (const r of RANKS) {
    if (ratio >= r.threshold) rank = r.label;
  }
  return rank;
}

function computeMaxScore(words: string[]): number {
  return words.reduce((sum, w) => sum + (w.length <= 4 ? 1 : w.length), 0);
}

export function WordHiveGame({ onComplete, onBack, savedStateJSON }: Props) {
  const colors = useTheme();
  const hapticsEnabled = useSettingsStore(s => s.hapticsEnabled);
  const reducedMotion = useSettingsStore(s => s.reducedMotion);
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => { try { return savedStateJSON ? JSON.parse(savedStateJSON) : null; } catch { return null; } }, []);
  const [hiveIdx] = useState<number>(() => saved?.hiveIdx ?? Math.floor(Math.random() * HIVE_SETS.length));
  const hive = HIVE_SETS[hiveIdx];
  const maxScore = useMemo(() => computeMaxScore(hive.validWords), [hive]);

  const [input, setInput] = useState('');
  const [found, setFound] = useState<string[]>(() => saved?.found ?? []);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [isPangram, setIsPangram] = useState(false);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  useSaveGame('word-hive', () => ({ hiveIdx, found }), !done, [hiveIdx, found], elapsedRef);
  const [shuffledOuter, setShuffledOuter] = useState(() => {
    const outer = hive.letters.filter(l => l !== hive.center);
    return [...outer].sort(() => Math.random() - 0.5);
  });

  const s = useMemo(() => makeStyles(colors, SCREEN_W), [colors]);

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

  const showMsg = useCallback((msg: string, panagram = false) => {
    setMessage(msg);
    setIsPangram(panagram);
    setTimeout(() => { setMessage(''); setIsPangram(false); }, panagram ? 2000 : 1200);
  }, []);

  const handleSubmit = useCallback(() => {
    const word = input.toLowerCase().trim();
    if (word.length < 4) { showMsg('Too short'); return; }
    if (!word.includes(hive.center.toLowerCase())) { showMsg('Missing center letter'); return; }
    if (!word.split('').every(l => hive.letters.map(x => x.toLowerCase()).includes(l))) { showMsg('Bad letters'); return; }
    if (found.includes(word)) { showMsg('Already found!'); return; }
    if (!hive.validWords.includes(word)) { showMsg('Not in word list'); return; }

    const pts = word.length <= 4 ? 1 : word.length;
    const isp = word === hive.panagram.toLowerCase();
    const finalPts = isp ? pts + 7 : pts;

    if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    playSound('correct');

    const newScore = score + finalPts;
    const newFound = [...found, word];
    setScore(newScore);
    setFound(newFound);
    setInput('');

    if (isp) {
      playSound('win');
      showMsg(`🎉 PANGRAM! +${finalPts}`, true);
    } else {
      showMsg(`+${finalPts}`);
    }

    if (getRank(newScore, maxScore) === 'Queen Bee') finish(true);
    else if (newFound.length >= hive.validWords.length) finish(true);
  }, [input, hive, found, score, maxScore, finish, showMsg, hapticsEnabled]);

  const currentRank = getRank(score, maxScore);
  const nextRankThreshold = (() => {
    const ratio = score / maxScore;
    const nextRank = RANKS.find(r => r.threshold > ratio);
    return nextRank ? Math.ceil(nextRank.threshold * maxScore) : maxScore;
  })();
  const rankProgress = Math.min(score / Math.max(nextRankThreshold, 1), 1);

  const outerLetters = shuffledOuter;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Score + Rank */}
      <View style={s.scoreBar}>
        <View>
          <Text style={s.rankLabel}>{currentRank}</Text>
          <Text style={s.scoreText}>{score} pts</Text>
        </View>
        <View style={s.rankProgressWrap}>
          <View style={s.rankProgressTrack}>
            <View style={[s.rankProgressFill, { width: `${rankProgress * 100}%` as any }]} />
          </View>
          <Text style={s.nextRankText}>{nextRankThreshold} pts to next rank</Text>
        </View>
      </View>

      {/* Input display */}
      <View style={s.inputWrap}>
        {message ? (
          <Text style={[s.message, isPangram && s.pangramMessage]}>{message}</Text>
        ) : (
          <Text style={s.inputDisplay}>
            {input.split('').map((l, i) => (
              <Text key={i} style={[s.inputLetter, l === hive.center ? s.inputCenterLetter : undefined]}>{l}</Text>
            ))}
            {!input && <Text style={s.inputPlaceholder}>…</Text>}
          </Text>
        )}
      </View>

      {/* Honeycomb */}
      <View style={s.honeycomb}>
        <View style={s.hexRow}>
          {outerLetters.slice(0, 2).map(l => (
            <TouchableOpacity key={l} style={s.hex} onPress={() => { if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setInput(p => p + l); }} activeOpacity={0.7}>
              <Text style={s.hexLetter}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.hexRow}>
          <TouchableOpacity style={s.hex} onPress={() => { if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setInput(p => p + outerLetters[2]); }} activeOpacity={0.7}>
            <Text style={s.hexLetter}>{outerLetters[2]}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.hex, s.hexCenter]} onPress={() => { if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setInput(p => p + hive.center); }} activeOpacity={0.7}>
            <Text style={[s.hexLetter, { color: colors.word.ink }]}>{hive.center}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.hex} onPress={() => { if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setInput(p => p + outerLetters[3]); }} activeOpacity={0.7}>
            <Text style={s.hexLetter}>{outerLetters[3]}</Text>
          </TouchableOpacity>
        </View>
        <View style={s.hexRow}>
          {outerLetters.slice(4, 6).map(l => (
            <TouchableOpacity key={l} style={s.hex} onPress={() => { if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setInput(p => p + l); }} activeOpacity={0.7}>
              <Text style={s.hexLetter}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Controls */}
      <View style={s.controls}>
        <TouchableOpacity style={s.controlBtn} onPress={() => { if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setInput(p => p.slice(0, -1)); }} activeOpacity={0.7}>
          <Text style={s.controlBtnText}>⌫</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.controlBtn} onPress={() => { if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShuffledOuter(o => [...o].sort(() => Math.random() - 0.5)); }} activeOpacity={0.7}>
          <Text style={s.controlBtnText}>↻</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.controlBtn, s.submitBtn]} onPress={handleSubmit} activeOpacity={0.7}>
          <Text style={[s.controlBtnText, { color: colors.bg }]}>Enter</Text>
        </TouchableOpacity>
      </View>

      {/* Found words */}
      <View style={s.foundSection}>
        <Text style={s.foundHeader}>
          Found {found.length} of {hive.validWords.length} words
        </Text>
        <View style={s.foundList}>
          {[...found].sort().map(w => (
            <View key={w} style={[s.foundWord, w === hive.panagram.toLowerCase() && s.pangramWord]}>
              <Text style={[s.foundWordText, w === hive.panagram.toLowerCase() && s.pangramWordText]}>{w}</Text>
            </View>
          ))}
        </View>
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>🐝</Text>
            <Text style={s.modalTitle}>{getRank(score, maxScore)}</Text>
            <Text style={s.modalSub}>Score: {score} pts · {found.length} words found</Text>
            {onBack && (
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 8 }]} onPress={onBack}>
                <Text style={[s.modalBtnText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.modalBtn} onPress={() => {
              setDone(false); completedRef.current = false;
              setInput(''); setFound([]); setScore(0); setMessage('');
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

const makeStyles = (colors: ReturnType<typeof useTheme>, screenW: number) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { alignItems: 'center', paddingTop: 8, paddingBottom: 32, paddingHorizontal: 20 },

  scoreBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  rankLabel: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.ink },
  scoreText: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted },
  rankProgressWrap: { flex: 1, gap: 4 },
  rankProgressTrack: {
    height: 6, backgroundColor: colors.rule, borderRadius: 3, overflow: 'hidden',
  },
  rankProgressFill: {
    height: '100%', backgroundColor: colors.word.ink, borderRadius: 3,
  },
  nextRankText: { fontFamily: fonts.semiBold, fontSize: 10, color: colors.inkMuted },

  inputWrap: {
    height: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  inputDisplay: { fontFamily: fonts.black, fontSize: 26, letterSpacing: 3, color: colors.ink },
  inputLetter: { fontFamily: fonts.black, fontSize: 26, color: colors.ink },
  inputCenterLetter: { color: colors.word.ink },
  inputPlaceholder: { fontFamily: fonts.black, fontSize: 26, color: colors.inkMuted },
  message: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.ink },
  pangramMessage: { color: '#E26A2C', fontSize: 18 },

  honeycomb: { gap: 6, marginBottom: 14 },
  hexRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  hex: {
    width: 66, height: 66, borderRadius: 18,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  hexCenter: { backgroundColor: colors.word.bg },
  hexLetter: { fontFamily: fonts.black, fontSize: 24, color: colors.ink },

  controls: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  controlBtn: {
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider,
  },
  submitBtn: { backgroundColor: colors.ink, borderColor: colors.ink, flex: 1, alignItems: 'center' },
  controlBtnText: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.ink },

  foundSection: { width: '100%', marginTop: 4 },
  foundHeader: { fontFamily: fonts.bold, fontSize: 13, color: colors.inkMuted, marginBottom: 10, textAlign: 'center' },
  foundList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  foundWord: {
    backgroundColor: colors.number.bg,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  pangramWord: { backgroundColor: colors.word.bg },
  foundWordText: { fontFamily: fonts.bold, fontSize: 13, color: colors.number.ink },
  pangramWordText: { color: colors.word.ink },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999, width: '100%', alignItems: 'center' },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
