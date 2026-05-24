import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

const ABBREVS = [
  { abbr: 'NASA', full: 'National Aeronautics and Space Administration' },
  { abbr: 'ASAP', full: 'As Soon As Possible' },
  { abbr: 'CEO', full: 'Chief Executive Officer' },
  { abbr: 'DIY', full: 'Do It Yourself' },
  { abbr: 'FAQ', full: 'Frequently Asked Questions' },
  { abbr: 'GPS', full: 'Global Positioning System' },
  { abbr: 'HTML', full: 'HyperText Markup Language' },
  { abbr: 'IQ', full: 'Intelligence Quotient' },
  { abbr: 'JPEG', full: 'Joint Photographic Experts Group' },
  { abbr: 'ATM', full: 'Automated Teller Machine' },
  { abbr: 'USB', full: 'Universal Serial Bus' },
  { abbr: 'WiFi', full: 'Wireless Fidelity' },
  { abbr: 'PDF', full: 'Portable Document Format' },
  { abbr: 'FBI', full: 'Federal Bureau of Investigation' },
  { abbr: 'RSVP', full: 'Répondez S\'il Vous Plaît' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function AbbreviationsGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const [questions] = useState(() => shuffle([...ABBREVS]).slice(0, 10));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

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
    const others = ABBREVS.filter(a => a.abbr !== current.abbr);
    const wrong = shuffle(others).slice(0, 3);
    return shuffle([current, ...wrong]);
  }, [current, round]);

  const handleChoice = useCallback((full: string) => {
    if (selected !== null || !current) return;
    setSelected(full);
    const correct = full === current.full;
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (round + 1 >= 10) {
        finish(score + (correct ? 1 : 0) >= 7);
      } else {
        setRound(r => r + 1);
        setSelected(null);
      }
    }, 800);
  }, [selected, current, round, score, finish]);

  if (!current) return null;

  return (
    <View style={s.container}>
      <Text style={s.round}>Round {round + 1} / 10  ·  Score: {score}</Text>
      <Text style={s.instruction}>What does this stand for?</Text>

      <View style={s.abbrBox}>
        <Text style={s.abbrText}>{current.abbr}</Text>
      </View>

      <View style={s.choices}>
        {choices.map(v => {
          let bg = colors.surface;
          let border = colors.divider;
          if (selected === v.full) {
            bg = v.full === current.full ? colors.number.bg : '#FFE0E0';
            border = v.full === current.full ? colors.number.ink : colors.danger;
          } else if (selected !== null && v.full === current.full) {
            bg = colors.number.bg;
            border = colors.number.ink;
          }
          return (
            <TouchableOpacity key={v.abbr} style={[s.choice, { backgroundColor: bg, borderColor: border }]} onPress={() => handleChoice(v.full)} activeOpacity={0.8}>
              <Text style={s.choiceText} numberOfLines={2}>{v.full}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🔤' : '📝'}</Text>
            <Text style={s.modalTitle}>{won ? 'Abbreviation Expert!' : 'Keep Practicing'}</Text>
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
  abbrBox: { backgroundColor: colors.classic.bg, paddingHorizontal: 40, paddingVertical: 20, borderRadius: 20, marginBottom: 24 },
  abbrText: { fontFamily: fonts.black, fontSize: 40, color: colors.classic.ink, letterSpacing: 3 },
  choices: { width: '100%', gap: 10 },
  choice: { borderWidth: 2, borderRadius: 12, padding: 14, alignItems: 'center' },
  choiceText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.ink, textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 8, textAlign: 'center' },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
