import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';
import { useSaveGame } from '../../utils/gameSave';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  savedStateJSON?: string;
}

// Each entry has: the abbreviation, the correct full form, and plausible wrong options
// Wrong options share same domain or starting word to avoid obviously unrelated choices
const ABBREVS: { abbr: string; full: string; distractors: string[] }[] = [
  {
    abbr: 'NASA',
    full: 'National Aeronautics and Space Administration',
    distractors: [
      'National Aviation and Safety Authority',
      'North American Space Agency',
      'National Aerospace and Science Administration',
    ],
  },
  {
    abbr: 'ASAP',
    full: 'As Soon As Possible',
    distractors: [
      'As Stated And Planned',
      'Automated System Alert Protocol',
      'As Safe As Practicable',
    ],
  },
  {
    abbr: 'CEO',
    full: 'Chief Executive Officer',
    distractors: [
      'Central Executive Operations',
      'Chief Engagement Officer',
      'Corporate Executive Oversight',
    ],
  },
  {
    abbr: 'DIY',
    full: 'Do It Yourself',
    distractors: [
      'Design It Yourself',
      'Document It Yourself',
      'Develop It Yourself',
    ],
  },
  {
    abbr: 'FAQ',
    full: 'Frequently Asked Questions',
    distractors: [
      'Formal Answer Queue',
      'Frequently Applied Queries',
      'Full Answer Questionnaire',
    ],
  },
  {
    abbr: 'GPS',
    full: 'Global Positioning System',
    distractors: [
      'General Proximity Sensor',
      'Guided Pathway Service',
      'Geographic Precision Signal',
    ],
  },
  {
    abbr: 'HTML',
    full: 'HyperText Markup Language',
    distractors: [
      'High-Tech Media Layer',
      'HyperText Management Layout',
      'Hyperlinked Text Module Language',
    ],
  },
  {
    abbr: 'IQ',
    full: 'Intelligence Quotient',
    distractors: [
      'Individual Quality',
      'Intellectual Query',
      'Integrated Quota',
    ],
  },
  {
    abbr: 'JPEG',
    full: 'Joint Photographic Experts Group',
    distractors: [
      'Joint Picture Encoding Group',
      'Joint Photographic Encoding Guidelines',
      'Java Picture Experts Group',
    ],
  },
  {
    abbr: 'ATM',
    full: 'Automated Teller Machine',
    distractors: [
      'Automatic Transaction Module',
      'Advanced Teller Management',
      'Authenticated Terminal Machine',
    ],
  },
  {
    abbr: 'USB',
    full: 'Universal Serial Bus',
    distractors: [
      'Universal Signal Bridge',
      'Unified Storage Board',
      'Ultra Speed Bus',
    ],
  },
  {
    abbr: 'WiFi',
    full: 'Wireless Fidelity',
    distractors: [
      'Wide-band Frequency Interface',
      'Wireless File Integration',
      'Wide Fidelity',
    ],
  },
  {
    abbr: 'PDF',
    full: 'Portable Document Format',
    distractors: [
      'Printable Data File',
      'Portable Data Framework',
      'Processed Document File',
    ],
  },
  {
    abbr: 'FBI',
    full: 'Federal Bureau of Investigation',
    distractors: [
      'Federal Board of Intelligence',
      'Federal Bureau of Information',
      'Field Bureau of Investigation',
    ],
  },
  {
    abbr: 'VPN',
    full: 'Virtual Private Network',
    distractors: [
      'Virtual Protocol Node',
      'Verified Private Network',
      'Virtual Packet Network',
    ],
  },
  {
    abbr: 'RAM',
    full: 'Random Access Memory',
    distractors: [
      'Read-only Access Module',
      'Rapid Application Memory',
      'Random Allocation Module',
    ],
  },
  {
    abbr: 'CPU',
    full: 'Central Processing Unit',
    distractors: [
      'Core Processing Utility',
      'Central Program Unit',
      'Compute Processing Unit',
    ],
  },
  {
    abbr: 'URL',
    full: 'Uniform Resource Locator',
    distractors: [
      'Universal Resource Link',
      'Uniform Route Locator',
      'User Resource Locator',
    ],
  },
  {
    abbr: 'API',
    full: 'Application Programming Interface',
    distractors: [
      'Application Protocol Integration',
      'Advanced Programming Interface',
      'Automated Process Interface',
    ],
  },
  {
    abbr: 'PIN',
    full: 'Personal Identification Number',
    distractors: [
      'Private Input Number',
      'Personal Information Note',
      'Protected Identity Number',
    ],
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function AbbreviationsGame({ onComplete, onBack, savedStateJSON }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => { try { return savedStateJSON ? JSON.parse(savedStateJSON) : null; } catch { return null; } }, []);
  const [questions] = useState<typeof ABBREVS>(() => saved?.questions ?? shuffle([...ABBREVS]).slice(0, 10));
  const [round, setRound] = useState<number>(() => saved?.round ?? 0);
  const [score, setScore] = useState<number>(() => saved?.score ?? 0);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  useSaveGame('abbreviations', () => ({ questions, round, score }), !done, [round, score], elapsedRef);

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
    const wrong = shuffle([...current.distractors]).slice(0, 3);
    return shuffle([current.full, ...wrong]);
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
          if (selected === v) {
            bg = v === current.full ? colors.number.bg : '#FFE0E0';
            border = v === current.full ? colors.number.ink : colors.danger;
          } else if (selected !== null && v === current.full) {
            bg = colors.number.bg;
            border = colors.number.ink;
          }
          return (
            <TouchableOpacity key={v} style={[s.choice, { backgroundColor: bg, borderColor: border }]} onPress={() => handleChoice(v)} activeOpacity={0.8}>
              <Text style={s.choiceText} numberOfLines={2}>{v}</Text>
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
