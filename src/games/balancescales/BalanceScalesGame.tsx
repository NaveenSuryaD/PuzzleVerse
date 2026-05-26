import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { SCALE_PUZZLES } from './puzzles';
import * as Haptics from 'expo-haptics';
import { useGameTimer } from '../../hooks/useGameTimer';
import { usePersistentGameState } from '../../hooks/usePersistentGameState';
import { ResumeGameModal } from '../../components/ResumeGameModal';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  paused?: boolean;
}

interface SaveState {
  puzzleIdx: number;
  round: number;
  score: number;
}

const SHAPES: Record<string, string> = { circle: '●', square: '■', triangle: '▲' };
const SHAPE_COLORS: Record<string, string> = { circle: '#E74C3C', square: '#3498DB', triangle: '#2ECC71' };

export function BalanceScalesGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('balance-scales');

  const [puzzleIdx, setPuzzleIdx] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SaveState | null>(null);

  const s = useMemo(() => makeStyles(colors), [colors]);

  // Mount: load saved state
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

  // Save on meaningful changes
  useEffect(() => {
    if (!done && timer.isRunning) {
      save({ puzzleIdx, round, score }, timer.elapsedSeconds);
    }
  }, [puzzleIdx, round, score]);

  const handleResume = useCallback(() => {
    if (!pendingSavedState) return;
    setPuzzleIdx(pendingSavedState.puzzleIdx);
    setRound(pendingSavedState.round);
    setScore(pendingSavedState.score);
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    clear();
    setPuzzleIdx(0);
    setRound(1);
    setScore(0);
    setShowResumeModal(false);
    timer.start();
  }, [clear, timer]);

  const finish = useCallback((w: boolean) => {
    clear();
    timer.pause();
    setWon(w);
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, clear, timer]);

  const puzzle = SCALE_PUZZLES[puzzleIdx];

  const handleChoice = useCallback((choice: number) => {
    if (selected !== null) return;
    setSelected(choice);
    const correct = choice === puzzle.answer;
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (round >= 5) {
        finish(score + (correct ? 1 : 0) >= 3);
      } else {
        const next = (puzzleIdx + 1) % SCALE_PUZZLES.length;
        setPuzzleIdx(next);
        setRound(r => r + 1);
        setSelected(null);
      }
    }, 800);
  }, [selected, puzzle, round, score, puzzleIdx, finish]);

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="⚖️"
        gameName="Balance Scales"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `Round ${pendingSavedState.round} / 5 · Score: ${pendingSavedState.score}` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.round}>Round {round} / 5  ·  Score: {score}</Text>
      <Text style={s.title}>Balance Scales</Text>

      {/* Scale equations */}
      {puzzle.equations.map((eq, ei) => (
        <View key={ei} style={s.equation}>
          <View style={s.side}>
            {eq.left.map((item, i) => (
              <View key={i} style={s.shapeGroup}>
                {Array.from({ length: item.count }).map((_, j) => (
                  <Text key={j} style={[s.shape, { color: SHAPE_COLORS[item.shape] }]}>
                    {SHAPES[item.shape]}
                  </Text>
                ))}
              </View>
            ))}
          </View>
          <Text style={s.equals}>⚖️</Text>
          <View style={s.side}>
            {eq.right.map((item, i) => (
              <View key={i} style={s.shapeGroup}>
                {Array.from({ length: item.count }).map((_, j) => (
                  <Text key={j} style={[s.shape, { color: SHAPE_COLORS[item.shape] }]}>
                    {SHAPES[item.shape]}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </View>
      ))}

      <Text style={s.question}>
        How many <Text style={[s.questionShape, { color: SHAPE_COLORS[puzzle.question] }]}>
          {SHAPES[puzzle.question]} {puzzle.question}s
        </Text> = 1 unit?
      </Text>

      <View style={s.choices}>
        {puzzle.choices.map(choice => {
          let bg = colors.surface;
          let border = colors.divider;
          if (selected === choice) {
            bg = choice === puzzle.answer ? colors.number.bg : '#FFE0E0';
            border = choice === puzzle.answer ? colors.number.ink : colors.danger;
          } else if (selected !== null && choice === puzzle.answer) {
            bg = colors.number.bg;
            border = colors.number.ink;
          }
          return (
            <TouchableOpacity
              key={choice}
              style={[s.choice, { backgroundColor: bg, borderColor: border }]}
              onPress={() => handleChoice(choice)}
              activeOpacity={0.8}
            >
              <Text style={s.choiceText}>{choice}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '⚖️' : '😅'}</Text>
            <Text style={s.modalTitle}>{won ? 'Balanced!' : 'Keep Practicing'}</Text>
            <Text style={s.modalSub}>Score: {score} / 5</Text>
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
              setPuzzleIdx(0); setRound(1); setScore(0); setSelected(null);
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  round: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted, marginBottom: 8 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 20 },
  equation: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
  side: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' },
  shapeGroup: { flexDirection: 'row', gap: 2 },
  shape: { fontSize: 24 },
  equals: { fontSize: 28 },
  question: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.inkMuted, marginBottom: 20, textAlign: 'center' },
  questionShape: { fontFamily: fonts.black },
  choices: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  choice: { width: 80, height: 64, borderWidth: 2, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  choiceText: { fontFamily: fonts.black, fontSize: 28, color: colors.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
