import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

const ELEMENTS = [
  { symbol: 'H', name: 'Hydrogen' }, { symbol: 'He', name: 'Helium' },
  { symbol: 'Li', name: 'Lithium' }, { symbol: 'C', name: 'Carbon' },
  { symbol: 'N', name: 'Nitrogen' }, { symbol: 'O', name: 'Oxygen' },
  { symbol: 'Na', name: 'Sodium' }, { symbol: 'Mg', name: 'Magnesium' },
  { symbol: 'Al', name: 'Aluminium' }, { symbol: 'Si', name: 'Silicon' },
  { symbol: 'P', name: 'Phosphorus' }, { symbol: 'S', name: 'Sulfur' },
  { symbol: 'Cl', name: 'Chlorine' }, { symbol: 'K', name: 'Potassium' },
  { symbol: 'Ca', name: 'Calcium' }, { symbol: 'Fe', name: 'Iron' },
  { symbol: 'Cu', name: 'Copper' }, { symbol: 'Zn', name: 'Zinc' },
  { symbol: 'Ag', name: 'Silver' }, { symbol: 'Au', name: 'Gold' },
  { symbol: 'Hg', name: 'Mercury' }, { symbol: 'Pb', name: 'Lead' },
  { symbol: 'U', name: 'Uranium' }, { symbol: 'Pt', name: 'Platinum' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ScienceSymbolsGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const [questions] = useState(() => shuffle([...ELEMENTS]).slice(0, 10));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);
  const [showSymbol, setShowSymbol] = useState(true); // toggle symbol/name quiz

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

  const current = questions[round];
  const choices = useMemo(() => {
    if (!current) return [];
    const others = ELEMENTS.filter(e => e.symbol !== current.symbol);
    const wrong = shuffle(others).slice(0, 3);
    return shuffle([current, ...wrong]);
  }, [current, round]);

  const handleChoice = useCallback((name: string) => {
    if (selected !== null || !current) return;
    setSelected(name);
    const correct = name === current.name;
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (round + 1 >= 10) {
        finish(score + (correct ? 1 : 0) >= 7);
      } else {
        setRound(r => r + 1);
        setSelected(null);
      }
    }, 700);
  }, [selected, current, round, score, finish]);

  if (!current) return null;

  return (
    <View style={s.container}>
      <Text style={s.round}>Round {round + 1} / 10  ·  Score: {score}</Text>
      <Text style={s.instruction}>What element has the symbol:</Text>

      <View style={s.symbolBox}>
        <Text style={s.symbol}>{current.symbol}</Text>
      </View>

      <View style={s.choices}>
        {choices.map(el => {
          let bg = colors.surface;
          let border = colors.divider;
          if (selected === el.name) {
            bg = el.name === current.name ? colors.number.bg : '#FFE0E0';
            border = el.name === current.name ? colors.number.ink : colors.danger;
          } else if (selected !== null && el.name === current.name) {
            bg = colors.number.bg;
            border = colors.number.ink;
          }
          return (
            <TouchableOpacity
              key={el.symbol}
              style={[s.choice, { backgroundColor: bg, borderColor: border }]}
              onPress={() => handleChoice(el.name)}
              activeOpacity={0.8}
            >
              <Text style={s.choiceText}>{el.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '⚗️' : '🔬'}</Text>
            <Text style={s.modalTitle}>{won ? 'Chemistry Pro!' : 'Keep Learning'}</Text>
            <Text style={s.modalSub}>Score: {score} / 10</Text>
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
              setRound(0); setScore(0); setSelected(null);
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  round: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted, marginBottom: 12 },
  instruction: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 16 },
  symbolBox: { width: 120, height: 120, borderRadius: 20, backgroundColor: colors.number.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 2, borderColor: colors.number.ink },
  symbol: { fontFamily: fonts.black, fontSize: 52, color: colors.number.ink },
  choices: { width: '100%', gap: 10 },
  choice: { borderWidth: 2, borderRadius: 12, padding: 14, alignItems: 'center' },
  choiceText: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 24, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
