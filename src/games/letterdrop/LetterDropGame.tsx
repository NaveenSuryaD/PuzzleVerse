import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
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

// Letter Drop: columns of letters fall down; arrange them to form words
// Each column has letters; tap to drop the next letter from each column
const PUZZLES = [
  {
    // 4 columns, target: form 4-letter words using one letter from each column at the current drop position
    cols: [
      ['C','T','B','S'],  // col 0
      ['A','O','I','E'],  // col 1
      ['R','P','G','N'],  // col 2
      ['E','S','T','D'],  // col 3
    ],
    // Words that can be formed (one letter from each col, using indices)
    words: ['CARE','TOPS','BIGS','SEND'],
    targets: ['CARE','TOPS'],
  },
  {
    cols: [
      ['F','P','M','T'],
      ['L','A','O','E'],
      ['A','T','R','N'],
      ['G','H','E','D'],
    ],
    words: ['FLAG','PATH','MORE','TEND'],
    targets: ['FLAG','PATH'],
  },
];

interface SavedState {
  puzIdx: number;
  positions: number[];
  formed: string[];
}

export function LetterDropGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SavedState>('letter-drop');

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SavedState | null>(null);

  const [puzIdx, setPuzIdx] = useState<number>(0);
  const puz = PUZZLES[puzIdx];

  // Current position in each column (which letter is "active")
  const [positions, setPositions] = useState<number[]>(() => puz.cols.map(() => 0));
  const [formed, setFormed] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  const s = useMemo(() => makeStyles(colors), [colors]);

  // Mount effect: load saved state
  useEffect(() => {
    load().then(result => {
      if (result.found && result.gameState) {
        setResumeElapsed(result.elapsedSeconds);
        setPendingSavedState(result.gameState);
        setShowResumeModal(true);
        timer.pause();
      } else {
        timer.start();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save effect
  useEffect(() => {
    if (!done) {
      save({ puzIdx, positions, formed }, timer.elapsedSeconds);
    }
  }, [puzIdx, positions, formed, done, save, timer.elapsedSeconds]);

  const handleResume = useCallback(() => {
    setShowResumeModal(false);
    if (pendingSavedState) {
      setPuzIdx(pendingSavedState.puzIdx);
      setPositions(pendingSavedState.positions);
      setFormed(pendingSavedState.formed);
    }
    timer.restoreAndResume(resumeElapsed);
    setPendingSavedState(null);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    setShowResumeModal(false);
    setPendingSavedState(null);
    clear();
    setPuzIdx(0);
    setPositions(PUZZLES[0].cols.map(() => 0));
    setFormed([]);
    timer.start();
  }, [clear, timer]);

  useEffect(() => {
    setPositions(puz.cols.map(() => 0));
    setFormed([]);
  }, [puzIdx]);

  const finish = useCallback((w: boolean) => {
    clear();
    setWon(w);
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, timer.elapsedSeconds, clear]);

  const currentWord = positions.map((pos, col) => puz.cols[col][pos]).join('');

  const handleDrop = useCallback((col: number) => {
    setPositions(prev => {
      const next = [...prev];
      next[col] = (next[col] + 1) % puz.cols[col].length;
      return next;
    });
  }, [puz]);

  const handleCollect = useCallback(() => {
    if (puz.words.includes(currentWord)) {
      const newFormed = [...new Set([...formed, currentWord])];
      setFormed(newFormed);
      if (puz.targets.every(t => newFormed.includes(t))) finish(true);
    }
  }, [currentWord, formed, puz, finish]);

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="🔤"
        gameName="Letter Drop"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `${pendingSavedState.formed.length} / ${puz.targets.length} words found` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.title}>Letter Drop</Text>
      <Text style={s.subtitle}>Tap arrows to cycle letters · Collect the target words</Text>

      <View style={s.targetRow}>
        {puz.targets.map(t => (
          <View key={t} style={[s.targetChip, formed.includes(t) && s.targetChipDone]}>
            <Text style={[s.targetText, formed.includes(t) && s.targetTextDone]}>{t}</Text>
          </View>
        ))}
      </View>

      <View style={s.columns}>
        {puz.cols.map((col, ci) => {
          const pos = positions[ci];
          return (
            <View key={ci} style={s.column}>
              {/* Show surrounding letters */}
              {[-2,-1,0,1,2].map(offset => {
                const idx = ((pos + offset) + col.length) % col.length;
                const isCurrent = offset === 0;
                return (
                  <View key={offset} style={[s.letterSlot, isCurrent && s.letterSlotActive]}>
                    <Text style={[s.slotLetter, isCurrent && s.slotLetterActive]}>{col[idx]}</Text>
                  </View>
                );
              })}
              <TouchableOpacity style={s.dropBtn} onPress={() => handleDrop(ci)} activeOpacity={0.7}>
                <Text style={s.dropBtnText}>↓</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <View style={s.currentWordRow}>
        <Text style={s.currentWordLabel}>Current: </Text>
        <Text style={[s.currentWord, puz.words.includes(currentWord) && s.currentWordValid]}>{currentWord}</Text>
      </View>

      {puz.words.includes(currentWord) && (
        <TouchableOpacity style={s.collectBtn} onPress={handleCollect} activeOpacity={0.8}>
          <Text style={s.collectBtnText}>Collect Word!</Text>
        </TouchableOpacity>
      )}

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '⬇️' : '❌'}</Text>
            <Text style={s.modalTitle}>{won ? 'Words Caught!' : 'Keep Dropping'}</Text>
            <Text style={s.modalSub}>Found: {formed.join(', ')}</Text>
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
              const next = (puzIdx + 1) % PUZZLES.length;
              setPuzIdx(next);
              timer.start();
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
  subtitle: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginBottom: 16, textAlign: 'center' },
  targetRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  targetChip: { backgroundColor: colors.surface2, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, borderWidth: 2, borderColor: colors.divider },
  targetChipDone: { backgroundColor: colors.number.bg, borderColor: colors.number.ink },
  targetText: { fontFamily: fonts.black, fontSize: 16, color: colors.inkMuted },
  targetTextDone: { color: colors.number.ink },
  columns: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  column: { alignItems: 'center', gap: 4 },
  letterSlot: { width: 56, height: 46, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  letterSlotActive: { backgroundColor: colors.classic.bg, borderColor: colors.classic.ink, borderWidth: 2.5 },
  slotLetter: { fontFamily: fonts.black, fontSize: 18, color: colors.inkMuted },
  slotLetterActive: { fontSize: 26, color: colors.classic.ink },
  dropBtn: { width: 56, height: 36, backgroundColor: colors.surface2, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.divider },
  dropBtnText: { fontFamily: fonts.black, fontSize: 20, color: colors.ink },
  currentWordRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  currentWordLabel: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.inkMuted },
  currentWord: { fontFamily: fonts.black, fontSize: 24, color: colors.ink },
  currentWordValid: { color: colors.success },
  collectBtn: { backgroundColor: colors.number.ink, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999 },
  collectBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
