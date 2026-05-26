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

// Simplified Mahjong Solitaire: match pairs of free tiles
// A tile is "free" if nothing is on top of it and at least one side is open
const SYMBOLS = ['🀇','🀈','🀉','🀊','🀋','🀌','🀍','🀎','🀏','🀙','🀚','🀛','🀜','🀝','🀞','🀟','🀠','🀡'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Simple flat layout: 4 rows x 8 cols = 32 tiles (16 pairs)
function generateTiles(): { id: number; symbol: string; row: number; col: number; removed: boolean }[] {
  const pairs = [...SYMBOLS.slice(0, 16), ...SYMBOLS.slice(0, 16)];
  const shuffled = shuffle(pairs);
  return shuffled.map((symbol, i) => ({
    id: i,
    symbol,
    row: Math.floor(i / 8),
    col: i % 8,
    removed: false,
  }));
}

type TileData = { id: number; symbol: string; row: number; col: number; removed: boolean };

interface SavedState {
  tiles: TileData[];
  pairs: number;
}

export function MahjongGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SavedState>('mahjong');

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SavedState | null>(null);

  const [tiles, setTiles] = useState<TileData[]>(() => generateTiles());
  const [selected, setSelected] = useState<number | null>(null);
  const [pairs, setPairs] = useState<number>(0);
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
      save({ tiles, pairs }, timer.elapsedSeconds);
    }
  }, [tiles, pairs, done, save, timer.elapsedSeconds]);

  const handleResume = useCallback(() => {
    setShowResumeModal(false);
    if (pendingSavedState) {
      setTiles(pendingSavedState.tiles);
      setPairs(pendingSavedState.pairs);
    }
    timer.restoreAndResume(resumeElapsed);
    setPendingSavedState(null);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    setShowResumeModal(false);
    setPendingSavedState(null);
    clear();
    setTiles(generateTiles());
    setPairs(0);
    setSelected(null);
    timer.start();
  }, [clear, timer]);

  const finish = useCallback((w: boolean) => {
    clear();
    setWon(w);
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, timer.elapsedSeconds, clear]);

  // In this simplified version, all remaining tiles are "free"
  const handleTap = useCallback((id: number) => {
    const tile = tiles.find(t => t.id === id);
    if (!tile || tile.removed) return;

    if (selected === null) {
      setSelected(id);
    } else if (selected === id) {
      setSelected(null);
    } else {
      const selTile = tiles.find(t => t.id === selected);
      if (selTile && selTile.symbol === tile.symbol) {
        const newTiles = tiles.map(t =>
          t.id === id || t.id === selected ? { ...t, removed: true } : t
        );
        setTiles(newTiles);
        const newPairs = pairs + 1;
        setPairs(newPairs);
        setSelected(null);
        if (newPairs === 16) finish(true);
      } else {
        setSelected(id);
      }
    }
  }, [tiles, selected, pairs, finish]);

  const remaining = tiles.filter(t => !t.removed);
  const rows = 4, cols = 8;

  return (
    <ScrollView contentContainerStyle={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="🀄"
        gameName="Mahjong"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `${pendingSavedState.pairs} / 16 pairs found` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.title}>Mahjong</Text>
      <Text style={s.subtitle}>Match identical tile pairs</Text>
      <Text style={s.progress}>Pairs: {pairs} / 16  ·  Remaining: {remaining.length}</Text>

      <View style={s.board}>
        {Array.from({ length: rows }, (_, r) => (
          <View key={r} style={{ flexDirection: 'row' }}>
            {Array.from({ length: cols }, (_, c) => {
              const tile = tiles.find(t => t.row === r && t.col === c);
              if (!tile || tile.removed) {
                return <View key={c} style={s.tileEmpty} />;
              }
              const isSel = selected === tile.id;
              return (
                <TouchableOpacity
                  key={c}
                  style={[s.tile, isSel && s.tileSelected]}
                  onPress={() => handleTap(tile.id)}
                  activeOpacity={0.7}
                >
                  <Text style={s.tileSymbol}>{tile.symbol}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <TouchableOpacity style={s.resetBtn} onPress={() => {
        setTiles(generateTiles()); setSelected(null); setPairs(0);
      }} activeOpacity={0.8}>
        <Text style={s.resetBtnText}>Shuffle & Restart</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{won ? '🀄' : '🃏'}</Text>
            <Text style={s.modalTitle}>{won ? 'Cleared!' : 'No more moves'}</Text>
            <Text style={s.modalSub}>{pairs} pairs found</Text>
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
              setTiles(generateTiles()); setSelected(null); setPairs(0);
              timer.start();
            }}>
              <Text style={s.modalBtnText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { alignItems: 'center', padding: 16, paddingBottom: 40 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 8 },
  progress: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted, marginBottom: 16 },
  board: { marginBottom: 20 },
  tile: { width: 40, height: 52, backgroundColor: colors.classic.bg, borderWidth: 1.5, borderColor: colors.classic.ink, borderRadius: 4, alignItems: 'center', justifyContent: 'center', margin: 1 },
  tileSelected: { backgroundColor: colors.logic.bg, borderColor: colors.logic.ink, borderWidth: 2.5 },
  tileEmpty: { width: 40, height: 52, margin: 1 },
  tileSymbol: { fontSize: 20 },
  resetBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999 },
  resetBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
