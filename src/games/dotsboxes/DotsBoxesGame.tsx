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

const N = 4; // 4x4 grid of dots = 4x4 boxes = NxN boxes, N+1 dots per side
const DOT = 8;
const LINE_LEN = 44;
const SPACING = LINE_LEN + DOT;

type Line = boolean;

interface GameState {
  hLines: Line[][];  // (N) rows x N cols of horizontal lines
  vLines: Line[][];  // N rows x (N) cols of vertical lines
  boxes: ('player' | 'ai' | null)[][];
  scores: [number, number];
  turn: 'player' | 'ai';
}

function initState(): GameState {
  return {
    hLines: Array.from({ length: N + 1 }, () => Array(N).fill(false)),
    vLines: Array.from({ length: N }, () => Array(N + 1).fill(false)),
    boxes: Array.from({ length: N }, () => Array(N).fill(null)),
    scores: [0, 0],
    turn: 'player',
  };
}

function checkBoxes(state: GameState): { newBoxes: ('player' | 'ai' | null)[][]; scored: number } {
  let scored = 0;
  const newBoxes = state.boxes.map(r => [...r]) as ('player' | 'ai' | null)[][];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!newBoxes[r][c]) {
        const top = state.hLines[r][c];
        const bottom = state.hLines[r + 1][c];
        const left = state.vLines[r][c];
        const right = state.vLines[r][c + 1];
        if (top && bottom && left && right) {
          newBoxes[r][c] = state.turn;
          scored++;
        }
      }
    }
  }
  return { newBoxes, scored };
}

function aiMove(state: GameState): { type: 'h' | 'v'; r: number; c: number } {
  // Find any completing move first
  for (let r = 0; r <= N; r++) {
    for (let c = 0; c < N; c++) {
      if (!state.hLines[r][c]) {
        const testH = state.hLines.map(row => [...row]);
        testH[r][c] = true;
        const testState = { ...state, hLines: testH };
        const { scored } = checkBoxes(testState);
        if (scored > 0) return { type: 'h', r, c };
      }
    }
  }
  // Random
  const moves: { type: 'h' | 'v'; r: number; c: number }[] = [];
  for (let r = 0; r <= N; r++) {
    for (let c = 0; c < N; c++) {
      if (!state.hLines[r][c]) moves.push({ type: 'h', r, c });
    }
  }
  for (let r = 0; r < N; r++) {
    for (let c = 0; c <= N; c++) {
      if (!state.vLines[r][c]) moves.push({ type: 'v', r, c });
    }
  }
  return moves[Math.floor(Math.random() * moves.length)] ?? { type: 'h', r: 0, c: 0 };
}

interface SaveState {
  state: GameState;
}

export function DotsBoxesGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('dots-boxes');

  const [state, setState] = useState<GameState>(() => initState());
  const [done, setDone] = useState(false);

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
      save({ state }, timer.elapsedSeconds);
    }
  }, [state, timer.elapsedSeconds, done, showResumeModal, save]);

  const handleResume = useCallback(() => {
    if (pendingSavedState) {
      setState(pendingSavedState.state);
    }
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    clear();
    setState(initState());
    setShowResumeModal(false);
    timer.start();
  }, [clear, timer]);

  const finish = useCallback((w: boolean) => {
    timer.pause();
    clear();
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, timer, clear]);

  const applyMove = useCallback((st: GameState, type: 'h' | 'v', r: number, c: number): GameState => {
    const newH = st.hLines.map(row => [...row]);
    const newV = st.vLines.map(row => [...row]);
    if (type === 'h') newH[r][c] = true;
    else newV[r][c] = true;
    const testState = { ...st, hLines: newH, vLines: newV };
    const { newBoxes, scored } = checkBoxes(testState);
    const newScores: [number, number] = [...st.scores] as [number, number];
    if (st.turn === 'player') newScores[0] += scored;
    else newScores[1] += scored;
    const newTurn = scored > 0 ? st.turn : (st.turn === 'player' ? 'ai' : 'player');
    return { hLines: newH, vLines: newV, boxes: newBoxes, scores: newScores, turn: newTurn };
  }, []);

  const handleLine = useCallback((type: 'h' | 'v', r: number, c: number) => {
    if (state.turn !== 'player') return;
    const line = type === 'h' ? state.hLines[r][c] : state.vLines[r][c];
    if (line) return;

    const newState = applyMove(state, type, r, c);
    setState(newState);

    if (newState.scores[0] + newState.scores[1] === N * N) {
      finish(newState.scores[0] > newState.scores[1]);
      return;
    }

    if (newState.turn === 'ai') {
      setTimeout(() => {
        setState(prev => {
          const { type: at, r: ar, c: ac } = aiMove(prev);
          const afterAI = applyMove(prev, at, ar, ac);
          if (afterAI.scores[0] + afterAI.scores[1] === N * N) {
            finish(afterAI.scores[0] > afterAI.scores[1]);
          }
          return afterAI;
        });
      }, 400);
    }
  }, [state, applyMove, finish]);

  const totalW = SPACING * N + DOT;

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="◼️"
        gameName="Dots & Boxes"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `You ${pendingSavedState.state.scores[0]} · AI ${pendingSavedState.state.scores[1]}` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <View style={s.scoreRow}>
        <Text style={s.scoreYou}>You: {state.scores[0]}</Text>
        <Text style={s.title}>Dots & Boxes</Text>
        <Text style={s.scoreAI}>AI: {state.scores[1]}</Text>
      </View>
      <Text style={s.turn}>{state.turn === 'player' ? 'Your turn' : 'AI thinking...'}</Text>

      <View style={{ width: totalW, height: totalW, position: 'relative' }}>
        {/* Horizontal lines */}
        {Array.from({ length: N + 1 }, (_, ri) =>
          Array.from({ length: N }, (_, ci) => (
            <TouchableOpacity
              key={`h${ri}${ci}`}
              style={[
                s.hLine,
                { left: DOT + ci * SPACING, top: ri * SPACING, width: LINE_LEN },
                state.hLines[ri][ci] && s.lineDrawn,
              ]}
              onPress={() => handleLine('h', ri, ci)}
              activeOpacity={0.5}
            />
          ))
        )}
        {/* Vertical lines */}
        {Array.from({ length: N }, (_, ri) =>
          Array.from({ length: N + 1 }, (_, ci) => (
            <TouchableOpacity
              key={`v${ri}${ci}`}
              style={[
                s.vLine,
                { left: ci * SPACING, top: DOT + ri * SPACING, height: LINE_LEN },
                state.vLines[ri][ci] && s.lineDrawn,
              ]}
              onPress={() => handleLine('v', ri, ci)}
              activeOpacity={0.5}
            />
          ))
        )}
        {/* Dots */}
        {Array.from({ length: N + 1 }, (_, ri) =>
          Array.from({ length: N + 1 }, (_, ci) => (
            <View
              key={`d${ri}${ci}`}
              style={[s.dot, { left: ci * SPACING, top: ri * SPACING }]}
            />
          ))
        )}
        {/* Boxes */}
        {state.boxes.map((row, ri) =>
          row.map((owner, ci) => owner ? (
            <View
              key={`b${ri}${ci}`}
              style={[
                s.box,
                { left: DOT + ci * SPACING, top: DOT + ri * SPACING, width: LINE_LEN, height: LINE_LEN },
                { backgroundColor: owner === 'player' ? colors.number.bg : colors.danger + '30' },
              ]}
            >
              <Text style={s.boxLabel}>{owner === 'player' ? 'Y' : 'A'}</Text>
            </View>
          ) : null)
        )}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{state.scores[0] > state.scores[1] ? '🏆' : '🤖'}</Text>
            <Text style={s.modalTitle}>{state.scores[0] > state.scores[1] ? 'You Win!' : state.scores[0] === state.scores[1] ? 'Draw!' : 'AI Wins!'}</Text>
            <Text style={s.modalSub}>You: {state.scores[0]} · AI: {state.scores[1]}</Text>
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
              setState(initState());
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 4 },
  scoreYou: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.number.ink },
  title: { fontFamily: fonts.black, fontSize: 18, color: colors.ink },
  scoreAI: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.danger },
  turn: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 16 },
  hLine: { position: 'absolute', height: DOT + 2, borderRadius: 4, backgroundColor: colors.rule, borderWidth: 1, borderColor: colors.divider },
  vLine: { position: 'absolute', width: DOT + 2, borderRadius: 4, backgroundColor: colors.rule, borderWidth: 1, borderColor: colors.divider },
  lineDrawn: { backgroundColor: colors.ink },
  dot: { position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: colors.ink },
  box: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  boxLabel: { fontFamily: fonts.black, fontSize: 16, color: colors.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
