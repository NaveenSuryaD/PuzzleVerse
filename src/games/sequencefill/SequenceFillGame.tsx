import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions,
} from 'react-native';
import { useTheme, type ThemeColors } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { generateSequences } from './generator';
import type { SequencePuzzle } from './types';
import * as Haptics from 'expo-haptics';
import { useGameTimer } from '../../hooks/useGameTimer';
import { usePersistentGameState } from '../../hooks/usePersistentGameState';
import { ResumeGameModal } from '../../components/ResumeGameModal';

const { width: SCREEN_W } = Dimensions.get('window');
const PAD_KEYS = ['7','8','9','4','5','6','1','2','3','⌫','0','✓'];

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  paused?: boolean;
}

interface SaveState {
  puzzles: SequencePuzzle[];
  pIdx: number;
  solved: boolean[];
}

export function SequenceFillGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('sequence-fill');

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SaveState | null>(null);

  const [puzzles, setPuzzles] = useState<SequencePuzzle[]>(() => generateSequences(8));
  const [pIdx, setPIdx] = useState<number>(0);
  const [bIdx, setBIdx] = useState(0); // which blank we're filling
  const [input, setInput] = useState('');
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const [solved, setSolved] = useState<boolean[]>(() => Array(8).fill(false));
  const [done, setDone] = useState(false);

  // Mount effect: load saved state
  useEffect(() => {
    load().then(result => {
      if (result.found && result.gameState) {
        setPendingSavedState(result.gameState);
        setResumeElapsed(result.elapsedSeconds);
        setShowResumeModal(true);
      } else {
        timer.start();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save effect: save on state changes
  useEffect(() => {
    if (!done) {
      save({ puzzles, pIdx, solved }, timer.elapsedSeconds);
    }
  }, [pIdx, solved, done, puzzles, timer.elapsedSeconds, save]);

  const handleResume = useCallback(() => {
    if (pendingSavedState) {
      setPuzzles(pendingSavedState.puzzles);
      setPIdx(pendingSavedState.pIdx);
      setSolved(pendingSavedState.solved);
    }
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    clear();
    setShowResumeModal(false);
    timer.start();
  }, [clear, timer]);

  const puzzle: SequencePuzzle = puzzles[pIdx];
  const blankCount = puzzle.answers.length;

  const advance = useCallback(() => {
    const nextPIdx = pIdx + 1;
    if (nextPIdx >= puzzles.length) {
      timer.pause();
      clear();
      setDone(true);
      onComplete(true, timer.elapsedSeconds);
    } else {
      setPIdx(nextPIdx);
      setBIdx(0);
      setInput('');
    }
  }, [pIdx, puzzles.length, onComplete, timer, clear]);

  const submit = useCallback(() => {
    if (!input) return;
    const expected = puzzle.answers[bIdx];
    if (parseInt(input, 10) === expected) {
      setFlash('correct');
      const nextBIdx = bIdx + 1;
      if (nextBIdx >= blankCount) {
        setSolved(prev => { const n = [...prev]; n[pIdx] = true; return n; });
        setTimeout(advance, 500);
      } else {
        setBIdx(nextBIdx);
      }
    } else {
      setFlash('wrong');
    }
    setTimeout(() => setFlash(null), 350);
    setInput('');
  }, [input, bIdx, blankCount, puzzle.answers, pIdx, advance]);

  const pressKey = useCallback((key: string) => {
    if (key === '⌫') setInput(p => p.slice(0, -1));
    else if (key === '✓') submit();
    else if (input.length < 6) setInput(p => p + key);
  }, [input, submit]);

  // Build display: sequence items, with blanks shown as input boxes
  let blanksSeen = 0;
  const cells = puzzle.sequence.map((v, i) => {
    if (v !== null) return { key: i, value: String(v), isBlank: false, isActive: false };
    const thisBIdx = blanksSeen++;
    return {
      key: i, value: thisBIdx === bIdx ? input || '' : '?',
      isBlank: true, isActive: thisBIdx === bIdx,
    };
  });

  const solvedCount = solved.filter(Boolean).length;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="🔢"
        gameName="Sequence Fill"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `${pendingSavedState.solved.filter(Boolean).length} of ${pendingSavedState.puzzles.length} solved` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      {/* Progress */}
      <View style={s.topRow}>
        <Text style={s.progressText}>{solvedCount} / {puzzles.length} sequences</Text>
        <View style={[s.hintPill, { backgroundColor: colors.logic.bg }]}>
          <Text style={[s.hintText, { color: colors.logic.ink }]}>{puzzle.hint}</Text>
        </View>
      </View>

      {/* Sequence display */}
      <View style={[s.card, flash && {
        borderWidth: 2,
        borderColor: flash === 'correct' ? colors.success : colors.danger,
      }]}>
        <View style={s.seqRow}>
          {cells.map((cell, ci) => (
            <React.Fragment key={cell.key}>
              <View style={[
                s.cell,
                cell.isBlank && s.cellBlank,
                cell.isActive && { borderColor: colors.ink, borderWidth: 2 },
                flash === 'correct' && cell.isActive && { backgroundColor: colors.success },
                flash === 'wrong' && cell.isActive && { backgroundColor: colors.danger },
              ]}>
                <Text style={[
                  s.cellText,
                  cell.isBlank && { color: cell.isActive ? colors.ink : colors.inkMuted },
                  (flash === 'correct' || flash === 'wrong') && cell.isActive && { color: '#FFFFFF' },
                ]}>
                  {cell.value}
                </Text>
              </View>
              {ci < cells.length - 1 && (
                <Text style={s.comma}>,</Text>
              )}
            </React.Fragment>
          ))}
        </View>
        <Text style={s.blankHint}>Fill blank {bIdx + 1} of {blankCount}</Text>
      </View>

      {/* Num pad */}
      <View style={s.pad}>
        {PAD_KEYS.map(key => (
          <TouchableOpacity
            key={key}
            style={[
              s.padKey,
              key === '✓' && { backgroundColor: colors.number.bg },
            ]}
            onPress={() => pressKey(key)}
            activeOpacity={0.7}
          >
            <Text style={[
              s.padKeyText,
              key === '✓' && { color: colors.number.ink },
            ]}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={[s.trophy, { backgroundColor: colors.logic.bg }]}>
              <Text style={{ fontSize: 36 }}>🌀</Text>
            </View>
            <Text style={s.modalTitle}>All Done!</Text>
            <Text style={s.modalSub}>All {puzzles.length} sequences solved</Text>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.ink }]}
              onPress={() => {
                setDone(false);
                setPIdx(0);
                setBIdx(0);
                setInput('');
                setSolved(Array(8).fill(false));
                setPuzzles(generateSequences(8));
                timer.start();
              }}
              activeOpacity={0.8}
            >
              <Text style={[s.btnText, { color: colors.bg }]}>Play Again</Text>
            </TouchableOpacity>
            {onBack && (
              <TouchableOpacity
                style={[s.btn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 8 }]}
                onPress={onBack}
                activeOpacity={0.8}
              >
                <Text style={[s.btnText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) => {
  const KEY_W = (SCREEN_W - 32 - 8) / 3;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 16, paddingBottom: 32, alignItems: 'center' },

    topRow: {
      width: '100%', paddingHorizontal: 22,
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: 16,
    },
    progressText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted },
    hintPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
    hintText: { fontFamily: fonts.semiBold, fontSize: 12 },

    card: {
      width: SCREEN_W - 32, marginHorizontal: 16,
      backgroundColor: colors.surface, borderRadius: 24,
      paddingVertical: 28, paddingHorizontal: 16,
      alignItems: 'center', gap: 14,
      shadowColor: colors.ink, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
      borderWidth: 2, borderColor: 'transparent',
    },
    seqRow: {
      flexDirection: 'row', flexWrap: 'wrap',
      justifyContent: 'center', alignItems: 'center', gap: 4,
    },
    cell: {
      minWidth: 44, height: 48, borderRadius: 12,
      backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 8, borderWidth: 1, borderColor: 'transparent',
    },
    cellBlank: { backgroundColor: colors.rule, borderStyle: 'dashed', borderColor: colors.inkMuted },
    cellText: { fontFamily: fonts.black, fontSize: 20, color: colors.ink },
    comma: { fontFamily: fonts.bold, fontSize: 18, color: colors.inkMuted, alignSelf: 'flex-end', marginBottom: 4 },
    blankHint: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted },

    pad: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 4,
      paddingHorizontal: 16, marginTop: 20, width: SCREEN_W,
    },
    padKey: {
      width: KEY_W, height: KEY_W * 0.65, borderRadius: 14,
      backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
      shadowColor: colors.ink, shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
    },
    padKeyText: { fontFamily: fonts.extraBold, fontSize: 22, color: colors.ink },

    overlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    },
    modal: {
      width: '100%', backgroundColor: colors.surface,
      borderRadius: 28, padding: 28, alignItems: 'center', gap: 14,
    },
    trophy: {
      width: 72, height: 72, borderRadius: 36,
      alignItems: 'center', justifyContent: 'center',
    },
    modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, letterSpacing: -0.5 },
    modalSub: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.inkMuted },
    btn: {
      width: '100%', height: 52, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center',
    },
    btnText: { fontFamily: fonts.extraBold, fontSize: 16 },
  });
};
