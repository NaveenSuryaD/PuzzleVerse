import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useTheme, type ThemeColors } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { generatePuzzle } from './generator';
import type { Tile } from './types';
import * as Haptics from 'expo-haptics';
import { useGameTimer } from '../../hooks/useGameTimer';
import { usePersistentGameState } from '../../hooks/usePersistentGameState';
import { ResumeGameModal } from '../../components/ResumeGameModal';

const { width: SCREEN_W } = Dimensions.get('window');
const TILE_SIZE = Math.floor((SCREEN_W - 32 - 3 * 8) / 4);

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  paused?: boolean;
}

interface SaveState {
  puzzle: ReturnType<typeof generatePuzzle>;
  tiles: Tile[];
}

export function NumberBondsGame({ onComplete, onBack,
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

  const { save, load, clear } = usePersistentGameState<SaveState>('number-bonds');

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SaveState | null>(null);

  const [puzzle, setPuzzle] = useState<ReturnType<typeof generatePuzzle>>(() => generatePuzzle());
  const [tiles, setTiles] = useState<Tile[]>(() => puzzle.tiles);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [gameWon, setGameWon] = useState(false);

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
    if (!gameWon) {
      save({ puzzle, tiles }, timer.elapsedSeconds);
    }
  }, [tiles, gameWon, puzzle, timer.elapsedSeconds, save]);

  const handleResume = useCallback(() => {
    if (pendingSavedState) {
      setPuzzle(pendingSavedState.puzzle);
      setTiles(pendingSavedState.tiles);
    }
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    clear();
    setShowResumeModal(false);
    timer.start();
  }, [clear, timer]);

  const checkWin = useCallback((updatedTiles: Tile[]) => {
    if (!updatedTiles.every(t => t.state === 'matched')) return;
    timer.pause();
    clear();
    setGameWon(true);
    onComplete(true, timer.elapsedSeconds);
  }, [onComplete, timer, clear]);

  const handleTap = useCallback((tileId: number) => {
    if (gameWon) return;
    const tile = tiles.find(t => t.id === tileId);
    if (!tile || tile.state === 'matched' || tile.state === 'wrong') return;

    if (selectedId === null) {
      setSelectedId(tileId);
      setTiles(prev => prev.map(t => t.id === tileId ? { ...t, state: 'selected' as const } : t));
    } else if (selectedId === tileId) {
      setSelectedId(null);
      setTiles(prev => prev.map(t => t.id === tileId ? { ...t, state: 'idle' as const } : t));
    } else {
      const first = tiles.find(t => t.id === selectedId)!;
      if (first.value + tile.value === puzzle.target) {
        const next = tiles.map(t =>
          t.id === selectedId || t.id === tileId ? { ...t, state: 'matched' as const } : t,
        );
        setTiles(next);
        setSelectedId(null);
        checkWin(next);
      } else {
        setTiles(prev => prev.map(t =>
          t.id === selectedId || t.id === tileId ? { ...t, state: 'wrong' as const } : t,
        ));
        setSelectedId(null);
        setTimeout(() => {
          setTiles(prev => prev.map(t => t.state === 'wrong' ? { ...t, state: 'idle' as const } : t));
        }, 600);
      }
    }
  }, [tiles, selectedId, gameWon, puzzle.target, checkWin]);

  const restart = useCallback(() => {
    const next = generatePuzzle();
    setPuzzle(next);
    setTiles(next.tiles);
    setSelectedId(null);
    setGameWon(false);
    timer.start();
  }, [timer]);

  const matchedCount = tiles.filter(t => t.state === 'matched').length;

  return (
    <View style={s.root}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="🔢"
        gameName="Number Bonds"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `${pendingSavedState.tiles.filter(t => t.state === 'matched').length / 2} of ${pendingSavedState.tiles.length / 2} pairs found` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      {/* Target header */}
      <View style={s.targetWrap}>
        <Text style={s.targetLabel}>Pairs that sum to</Text>
        <View style={[s.targetBadge, { backgroundColor: colors.number.bg }]}>
          <Text style={[s.targetNum, { color: colors.number.ink }]}>{puzzle.target}</Text>
        </View>
      </View>

      <Text style={s.progress}>{matchedCount / 2} of {puzzle.tiles.length / 2} pairs found</Text>

      {/* Grid */}
      <View style={s.grid}>
        {tiles.map(tile => {
          const isSelected = tile.state === 'selected';
          const isWrong = tile.state === 'wrong';
          const isMatched = tile.state === 'matched';

          return (
            <TouchableOpacity
              key={tile.id}
              onPress={() => handleTap(tile.id)}
              activeOpacity={0.75}
              disabled={isMatched || isWrong}
            >
              <View style={[
                s.tile,
                isSelected && { backgroundColor: colors.number.bg },
                isWrong && { backgroundColor: colors.danger },
                isMatched && s.tileMatched,
              ]}>
                {!isMatched && (
                  <Text style={[
                    s.tileNum,
                    isSelected && { color: colors.number.ink },
                    isWrong && { color: '#FFFFFF' },
                  ]}>{tile.value}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={gameWon} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={[s.trophyCircle, { backgroundColor: colors.number.bg }]}>
              <Text style={s.trophyEmoji}>🔢</Text>
            </View>
            <Text style={s.modalTitle}>Board Cleared!</Text>
            <Text style={s.modalSub}>
              All {puzzle.tiles.length / 2} pairs found · Target: {puzzle.target}
            </Text>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.ink }]}
              onPress={restart}
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
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: {
    flex: 1, backgroundColor: colors.bg,
    alignItems: 'center', paddingTop: 16,
  },
  targetWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6,
  },
  targetLabel: {
    fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkSoft,
  },
  targetBadge: {
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 14,
  },
  targetNum: {
    fontFamily: fonts.black, fontSize: 24, letterSpacing: -0.5,
  },
  progress: {
    fontFamily: fonts.bold, fontSize: 13, color: colors.inkMuted, marginBottom: 20,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16,
    width: SCREEN_W,
  },
  tile: {
    width: TILE_SIZE, height: TILE_SIZE, borderRadius: 18,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.ink, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  tileMatched: {
    backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0,
  },
  tileNum: {
    fontFamily: fonts.black, fontSize: 24, color: colors.ink, letterSpacing: -0.5,
  },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modal: {
    width: '100%', backgroundColor: colors.surface,
    borderRadius: 28, padding: 28, alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 24, elevation: 10,
  },
  trophyCircle: {
    width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center',
  },
  trophyEmoji: { fontSize: 36 },
  modalTitle: {
    fontFamily: fonts.black, fontSize: 26, color: colors.ink, letterSpacing: -0.5,
  },
  modalSub: {
    fontFamily: fonts.semiBold, fontSize: 14, color: colors.inkMuted, textAlign: 'center',
  },
  btn: {
    width: '100%', height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  btnText: { fontFamily: fonts.extraBold, fontSize: 16 },
});
