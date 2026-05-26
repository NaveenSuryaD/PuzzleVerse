import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';
import { useGameTimer } from '../../hooks/useGameTimer';
import { usePersistentGameState } from '../../hooks/usePersistentGameState';
import { ResumeGameModal } from '../../components/ResumeGameModal';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  paused?: boolean;
}

const CATEGORIES = [
  {
    name: 'Animals',
    words: ['DOG','CAT','BIRD','FISH','FROG','LION','BEAR','WOLF','DEER','DUCK','MOLE','CRAB','WORM','MOTH','SEAL','HAWK','DOVE','BULL','MARE','LAMB'],
    definitions: [
      'A loyal domestic pet that barks','A furry pet that purrs','Feathered creature that flies',
      'Aquatic creature with fins','Amphibian that jumps and croaks','King of the jungle',
      'Large furry forest animal','Wild canine that howls at the moon','Antlered forest grazer',
      'Water bird that quacks','Underground digging mammal','Crustacean with claws',
      'Legless invertebrate in soil','Insect attracted to light','Marine mammal with flippers',
      'Bird of prey','Symbol of peace','Male bovine','Female horse','Baby sheep',
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

interface SaveState {
  card: string[];
  order: number[];
  defIdx: number;
  marked: string[];
}

export function WordBingoGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('word-bingo');

  const cat = CATEGORIES[0];
  const [card, setCard] = useState<string[]>(() => shuffle([...cat.words]).slice(0, 25));
  const [order, setOrder] = useState<number[]>(() => shuffle([...Array.from({ length: cat.words.length }, (_, i) => i)]));
  const [defIdx, setDefIdx] = useState<number>(0);
  const [marked, setMarked] = useState<Set<string>>(() => new Set());
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SaveState | null>(null);

  const s = useMemo(() => makeStyles(colors), [colors]);

  // Mount effect: load saved state
  useEffect(() => {
    (async () => {
      const result = await load();
      if (result.found && result.gameState) {
        setPendingSavedState(result.gameState);
        setResumeElapsed(result.elapsedSeconds);
        setShowResumeModal(true);
      } else {
        timer.start();
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save effect
  useEffect(() => {
    if (!done && !showResumeModal) {
      save({ card, order, defIdx, marked: [...marked] }, timer.elapsedSeconds);
    }
  }, [defIdx, marked, timer.elapsedSeconds, done, showResumeModal, save, card, order]);

  const handleResume = useCallback(() => {
    if (pendingSavedState) {
      setCard(pendingSavedState.card);
      setOrder(pendingSavedState.order);
      setDefIdx(pendingSavedState.defIdx);
      setMarked(new Set(pendingSavedState.marked));
    }
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    clear();
    setCard(shuffle([...cat.words]).slice(0, 25));
    setOrder(shuffle([...Array.from({ length: cat.words.length }, (_, i) => i)]));
    setDefIdx(0);
    setMarked(new Set());
    setShowResumeModal(false);
    timer.start();
  }, [clear, timer, cat.words]);

  const finish = useCallback((w: boolean) => {
    timer.pause();
    clear();
    setWon(w);
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, timer, clear]);

  const currentDef = cat.definitions[order[defIdx % cat.definitions.length]];
  const currentWord = cat.words[order[defIdx % cat.words.length]];

  const checkBingo = useCallback((m: Set<string>) => {
    const BINGO_LINES = [
      [0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24],
      [0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24],
      [0,6,12,18,24],[4,8,12,16,20],
    ];
    return BINGO_LINES.some(line => line.every(i => m.has(card[i])));
  }, [card]);

  const handleMark = useCallback((word: string) => {
    const newMarked = new Set(marked);
    newMarked.add(word);
    setMarked(newMarked);
    if (checkBingo(newMarked)) {
      finish(true);
    }
  }, [marked, checkBingo, finish]);

  const handleNext = useCallback(() => {
    setDefIdx(i => i + 1);
  }, []);

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="🎲"
        gameName="Word Bingo"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `${pendingSavedState.marked.length} squares marked` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.title}>Word Bingo: {cat.name}</Text>

      {/* Definition card */}
      <View style={s.defCard}>
        <Text style={s.defText}>{currentDef}</Text>
        <TouchableOpacity style={s.nextBtn} onPress={handleNext} activeOpacity={0.8}>
          <Text style={s.nextBtnText}>Next →</Text>
        </TouchableOpacity>
      </View>

      {/* Bingo card */}
      <View style={s.bingoCard}>
        {['B','I','N','G','O'].map(h => (
          <Text key={h} style={s.bingoHeader}>{h}</Text>
        ))}
        {card.map((word, i) => (
          <TouchableOpacity
            key={i}
            style={[s.bingoCell, marked.has(word) && s.bingoCellMarked, word === currentWord && s.bingoCellCurrent]}
            onPress={() => handleMark(word)}
            activeOpacity={0.8}
          >
            <Text style={[s.bingoCellText, marked.has(word) && { color: colors.bg }]} numberOfLines={1} adjustsFontSizeToFit>
              {word}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🎯' : '📋'}</Text>
            <Text style={s.modalTitle}>{won ? 'BINGO!' : 'Keep Going'}</Text>
            {onBack && (
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 8 }]}
                onPress={onBack}
              >
                <Text style={[s.modalBtnText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.modalBtn} onPress={() => {
              setDone(false);
              setCard(shuffle([...cat.words]).slice(0, 25));
              setOrder(shuffle([...Array.from({ length: cat.words.length }, (_, i) => i)]));
              setMarked(new Set()); setDefIdx(0);
              timer.start();
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
  title: { fontFamily: fonts.black, fontSize: 20, color: colors.ink, marginBottom: 12 },
  defCard: { backgroundColor: colors.word.bg, borderRadius: 16, padding: 16, marginBottom: 12, width: '100%' },
  defText: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.word.ink, marginBottom: 8 },
  nextBtn: { alignSelf: 'flex-end', backgroundColor: colors.word.ink, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999 },
  nextBtnText: { fontFamily: fonts.bold, fontSize: 13, color: colors.bg },
  bingoCard: { flexDirection: 'row', flexWrap: 'wrap', width: 310 },
  bingoHeader: { width: 62, height: 30, fontFamily: fonts.black, fontSize: 18, color: colors.ink, textAlign: 'center', lineHeight: 30 },
  bingoCell: { width: 62, height: 52, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 2 },
  bingoCellMarked: { backgroundColor: colors.ink },
  bingoCellCurrent: { borderColor: colors.word.ink, borderWidth: 2 },
  bingoCellText: { fontFamily: fonts.bold, fontSize: 9, color: colors.ink, textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
