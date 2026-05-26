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

// Masyu: draw a loop through all circles
// White circle: pass through straight, turn before or after
// Black circle: turn here, go straight on both sides
// Simplified: drag to connect dots forming a loop

const PUZZLES = [
  {
    size: 5,
    // circles: [row, col, type] - 'B'=black, 'W'=white
    circles: [
      [0,1,'W'],[0,3,'B'],
      [1,0,'B'],[1,4,'W'],
      [2,2,'B'],
      [3,0,'W'],[3,4,'B'],
      [4,1,'B'],[4,3,'W'],
    ] as [number,number,string][],
    // Solution edges: set of "r1,c1-r2,c2"
    solution: new Set([
      '0,0-0,1','0,1-0,2','0,2-0,3','0,3-0,4',
      '0,4-1,4','1,4-2,4','2,4-3,4','3,4-4,4',
      '4,4-4,3','4,3-4,2','4,2-4,1','4,1-4,0',
      '4,0-3,0','3,0-2,0','2,0-1,0','1,0-0,0',
      '1,0-1,1','1,1-1,2','1,2-1,3','1,3-1,4',
      '2,1-2,2','2,2-2,3',
      '3,1-3,2','3,2-3,3',
    ]),
  },
];

const CELL = 60;

interface SavedState {
  edges: string[];
}

export function MasyuGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SavedState>('masyu');

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SavedState | null>(null);

  const puz = PUZZLES[0];
  const SIZE = puz.size;

  const [edges, setEdges] = useState<Set<string>>(() => new Set([]));
  const [lastNode, setLastNode] = useState<[number,number] | null>(null);
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
      save({ edges: [...edges] }, timer.elapsedSeconds);
    }
  }, [edges, done, save, timer.elapsedSeconds]);

  const handleResume = useCallback(() => {
    setShowResumeModal(false);
    if (pendingSavedState) {
      setEdges(new Set(pendingSavedState.edges));
    }
    timer.restoreAndResume(resumeElapsed);
    setPendingSavedState(null);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    setShowResumeModal(false);
    setPendingSavedState(null);
    clear();
    setEdges(new Set());
    setLastNode(null);
    timer.start();
  }, [clear, timer]);

  const finish = useCallback((w: boolean) => {
    clear();
    setWon(w);
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, timer.elapsedSeconds, clear]);

  const edgeKey = (r1: number, c1: number, r2: number, c2: number) => {
    if (r1 < r2 || (r1===r2 && c1<c2)) return `${r1},${c1}-${r2},${c2}`;
    return `${r2},${c2}-${r1},${c1}`;
  };

  const isAdjacent = (r1: number, c1: number, r2: number, c2: number) =>
    (Math.abs(r1-r2)===1 && c1===c2) || (Math.abs(c1-c2)===1 && r1===r2);

  const handleNodePress = useCallback((r: number, c: number) => {
    if (!lastNode) {
      setLastNode([r, c]);
      return;
    }
    const [lr, lc] = lastNode;
    if (lr===r && lc===c) { setLastNode(null); return; }

    if (isAdjacent(lr, lc, r, c)) {
      const key = edgeKey(lr, lc, r, c);
      const newEdges = new Set(edges);
      if (newEdges.has(key)) newEdges.delete(key);
      else newEdges.add(key);
      setEdges(newEdges);
      setLastNode([r, c]);

      // Simple win: check if edges match solution (partial check)
      if (newEdges.size > 8) {
        // Check all circles are covered
        const allCovered = puz.circles.every(([cr, cc]) => {
          // Each circle must have exactly 2 edges
          let count = 0;
          for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nr=cr+dr, nc=cc+dc;
            if (nr>=0&&nr<SIZE&&nc>=0&&nc<SIZE && newEdges.has(edgeKey(cr,cc,nr,nc))) count++;
          }
          return count === 2;
        });
        if (allCovered && newEdges.size >= puz.circles.length * 2) finish(true);
      }
    } else {
      setLastNode([r, c]);
    }
  }, [lastNode, edges, puz, SIZE, finish]);

  const hasEdge = (r1: number, c1: number, r2: number, c2: number) =>
    edges.has(edgeKey(r1, c1, r2, c2));

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="⬤"
        gameName="Masyu"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `${pendingSavedState.edges.length} edges drawn` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.title}>Masyu</Text>
      <Text style={s.subtitle}>Tap nodes to draw a loop through all circles</Text>

      <View style={s.grid}>
        {Array.from({ length: SIZE }, (_, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {Array.from({ length: SIZE }, (_, ci) => {
              const circle = puz.circles.find(([r,c]) => r===ri && c===ci);
              const isLast = lastNode?.[0]===ri && lastNode?.[1]===ci;

              // Draw edges as overlays
              const edgeRight = ci < SIZE-1 && hasEdge(ri,ci,ri,ci+1);
              const edgeDown = ri < SIZE-1 && hasEdge(ri,ci,ri+1,ci);

              return (
                <TouchableOpacity
                  key={ci}
                  style={[s.nodeCell]}
                  onPress={() => handleNodePress(ri, ci)}
                  activeOpacity={0.7}
                >
                  {/* Horizontal edge */}
                  {edgeRight && <View style={s.edgeRight} />}
                  {/* Vertical edge */}
                  {edgeDown && <View style={s.edgeDown} />}
                  {/* Node dot */}
                  <View style={[
                    s.node,
                    circle && (circle[2]==='B' ? s.nodeBlack : s.nodeWhite),
                    isLast && s.nodeLast,
                  ]} />
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <Text style={s.edgesCount}>Edges: {edges.size}</Text>

      <TouchableOpacity style={s.resetBtn} onPress={() => { setEdges(new Set()); setLastNode(null); }} activeOpacity={0.8}>
        <Text style={s.resetBtnText}>Reset</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '⭕' : '❌'}</Text>
            <Text style={s.modalTitle}>{won ? 'Loop Complete!' : 'Try Again'}</Text>
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
              setEdges(new Set()); setLastNode(null);
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
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.inkMuted, marginBottom: 24, textAlign: 'center' },
  grid: {},
  nodeCell: { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  node: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.divider, borderWidth: 2, borderColor: colors.inkMuted, zIndex: 2 },
  nodeBlack: { backgroundColor: colors.ink, borderColor: colors.ink },
  nodeWhite: { backgroundColor: colors.surface, borderColor: colors.ink, borderWidth: 3 },
  nodeLast: { borderColor: colors.logic.ink, borderWidth: 3 },
  edgeRight: { position: 'absolute', left: CELL/2, right: -CELL/2, height: 4, backgroundColor: colors.logic.ink, zIndex: 1, top: CELL/2 - 2 },
  edgeDown: { position: 'absolute', top: CELL/2, bottom: -CELL/2, width: 4, backgroundColor: colors.logic.ink, zIndex: 1, left: CELL/2 - 2 },
  edgesCount: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 8 },
  resetBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999 },
  resetBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
