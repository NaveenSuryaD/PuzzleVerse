import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

const { width: SCREEN_W } = Dimensions.get('window');
const CELL = Math.min(Math.floor((SCREEN_W - 48) / 4), 72);

const LETTER_SETS = [
  ['C','A','T','S','D','O','G','E','R','I','N','B','L','P','M','U'],
  ['W','O','R','D','S','P','E','A','K','L','I','N','T','H','G','F'],
  ['B','L','U','E','S','K','Y','F','L','I','G','H','T','O','P','E'],
  ['T','R','A','V','E','L','W','O','R','L','D','C','U','P','S','I'],
];

const VALID_WORDS = new Set([
  'cat','dog','sat','set','dot','red','bed','led','bet','get','net','pet','met',
  'sad','bad','mad','dad','lad','pad','had','cap','map','tap','nap','rap','lap',
  'sod','sob','cob','mob','rob','cod','bod','pod','rod','god','nod','mod',
  'rib','bid','did','hid','kid','lid','rid','mid','gin','bin','din','fin','kin','pin',
  'win','tin','sin','run','gun','fun','sun','bun','nun','pun','ton','son','don',
  'ear','car','bar','far','jar','par','tar','war','oar','are','ore','age','ace',
  'ice','ire','use','aim','air','ail','aid','ask','arm','art','amp','apt',
  'word','work','worm','worn','word','wore','wood','wool','wolf','walk','wall',
  'sale','tale','pale','male','gale','bale','dale','wale','vale','rate','late',
  'fate','gate','hate','mate','date','kate','mode','node','code','rode','bode',
  'some','home','dome','come','tome','bone','cone','done','gone','lone','tone',
  'zone','gore','bore','core','fore','more','sore','wore','lore','pore',
  'tile','mile','rile','file','pile','bile','vile','time','dime','lime','mime',
  'blue','glue','true','clue','rule','mule','duel','fuel','dupe','tube','cube',
  'pets','nets','gets','sets','bets','lets','mets','jets','met','bet','get','set',
  'trip','drip','grip','ship','chip','whip','skip','slip','clip','flip','snip',
  'star','spar','scar','soar','roar','boar','gear','dear','fear','hear','near',
  'pear','rear','sear','tear','wear','year','clear','spear',
  'spin','skin','grin','grin','twin','thin','shin','chin','rain','gain','main',
  'pain','vain','wain','lain','bain','fain','sain','rein','vein','loin','coin',
  'brim','grim','prim','trim','swim','slim','skim','slid','grid','grit','spit',
]);

function adjacentIdx(r: number, c: number): number[] {
  const result: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < 4 && nc >= 0 && nc < 4) result.push(nr * 4 + nc);
    }
  }
  return result;
}

export function BoggleGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [letters] = useState(() => LETTER_SETS[Math.floor(Math.random() * LETTER_SETS.length)]);
  const [selected, setSelected] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [done, setDone] = useState(false);

  const s = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
    countdownRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          finish(score > 0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const finish = useCallback((w: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setDone(true);
    onComplete(w, elapsedRef.current);
  }, [onComplete]);

  const handleCellTap = useCallback((idx: number) => {
    if (selected.includes(idx)) {
      // Submit word
      const word = selected.map(i => letters[i]).join('').toLowerCase();
      if (word.length >= 3 && VALID_WORDS.has(word) && !found.includes(word)) {
        const pts = word.length >= 5 ? 3 : word.length >= 4 ? 2 : 1;
        setScore(s => s + pts);
        setFound(prev => [...prev, word]);
      }
      setSelected([]);
      return;
    }
    if (selected.length === 0) {
      setSelected([idx]);
      return;
    }
    const last = selected[selected.length - 1];
    const lastR = Math.floor(last / 4), lastC = last % 4;
    const idxR = Math.floor(idx / 4), idxC = idx % 4;
    if (adjacentIdx(lastR, lastC).includes(idx) && !selected.includes(idx)) {
      setSelected(prev => [...prev, idx]);
    }
  }, [selected, letters, found]);

  const currentWord = selected.map(i => letters[i]).join('');

  return (
    <View style={s.container}>
      <View style={s.topRow}>
        <Text style={s.timer}>{timeLeft}s</Text>
        <Text style={s.scoreText}>Score: {score}</Text>
      </View>

      <View style={s.grid}>
        {Array.from({ length: 4 }, (_, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {Array.from({ length: 4 }, (_, ci) => {
              const idx = ri * 4 + ci;
              const isSel = selected.includes(idx);
              const isLast = selected[selected.length - 1] === idx;
              return (
                <TouchableOpacity
                  key={ci}
                  style={[s.cell, { width: CELL, height: CELL }, isSel && s.cellSelected, isLast && s.cellLast]}
                  onPress={() => handleCellTap(idx)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.letter, isSel && { color: colors.word.ink }]}>{letters[idx]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <Text style={s.current}>{currentWord || 'Select letters...'}</Text>

      <TouchableOpacity style={s.clearBtn} onPress={() => setSelected([])} activeOpacity={0.8}>
        <Text style={s.clearBtnText}>Clear</Text>
      </TouchableOpacity>

      <ScrollView style={s.foundList} horizontal showsHorizontalScrollIndicator={false}>
        {found.map(w => (
          <View key={w} style={s.foundWord}>
            <Text style={s.foundWordText}>{w}</Text>
          </View>
        ))}
      </ScrollView>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>🔤</Text>
            <Text style={s.modalTitle}>Time's Up!</Text>
            <Text style={s.modalSub}>Score: {score} · Words: {found.length}</Text>
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
              setSelected([]); setFound([]); setScore(0); setTimeLeft(90);
              elapsedRef.current = 0;
              timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
              countdownRef.current = setInterval(() => {
                setTimeLeft(t => { if (t <= 1) { if (countdownRef.current) clearInterval(countdownRef.current); finish(score > 0); return 0; } return t - 1; });
              }, 1000);
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
  container: { flex: 1, alignItems: 'center', padding: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12, paddingHorizontal: 8 },
  timer: { fontFamily: fonts.black, fontSize: 24, color: colors.danger },
  scoreText: { fontFamily: fonts.extraBold, fontSize: 20, color: colors.ink },
  grid: { marginBottom: 16, gap: 4 },
  cell: { margin: 2, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center', shadowColor: colors.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cellSelected: { backgroundColor: colors.word.bg, borderColor: colors.word.ink },
  cellLast: { backgroundColor: colors.word.ink },
  letter: { fontFamily: fonts.black, fontSize: 22, color: colors.ink },
  current: { fontFamily: fonts.black, fontSize: 24, color: colors.ink, marginBottom: 8, letterSpacing: 4 },
  clearBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999, marginBottom: 12 },
  clearBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft },
  foundList: { maxHeight: 40 },
  foundWord: { backgroundColor: colors.number.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginRight: 6 },
  foundWordText: { fontFamily: fonts.bold, fontSize: 13, color: colors.number.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
