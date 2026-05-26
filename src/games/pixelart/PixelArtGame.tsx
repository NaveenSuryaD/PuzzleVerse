import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { PIXEL_ART_DESIGNS } from './puzzles';
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
  designIdx: number;
  userGrid: number[][];
}

const { width: SCREEN_W } = Dimensions.get('window');
const CELL = Math.min(Math.floor((SCREEN_W - 48) / 8), 40);

export function PixelArtGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('pixel-art');

  const [designIdx] = useState<number>(() => Math.floor(Math.random() * PIXEL_ART_DESIGNS.length));
  const design = PIXEL_ART_DESIGNS[designIdx];

  const [userGrid, setUserGrid] = useState<number[][]>(() =>
    Array.from({ length: 8 }, () => Array(8).fill(-1))
  );
  const [selectedColor, setSelectedColor] = useState(1);
  const [done, setDone] = useState(false);

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
      save({ designIdx, userGrid }, timer.elapsedSeconds);
    }
  }, [userGrid]);

  const handleResume = useCallback(() => {
    if (!pendingSavedState) return;
    setUserGrid(pendingSavedState.userGrid);
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
  }, [pendingSavedState, resumeElapsed, timer]);

  const handleStartFresh = useCallback(() => {
    clear();
    setUserGrid(Array.from({ length: 8 }, () => Array(8).fill(-1)));
    setShowResumeModal(false);
    timer.start();
  }, [clear, timer]);

  const finish = useCallback((w: boolean) => {
    clear();
    timer.pause();
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, clear, timer]);

  const checkComplete = useCallback((grid: number[][]) => {
    const correct = grid.every((row, ri) =>
      row.every((v, ci) => v === design.grid[ri][ci])
    );
    if (correct) finish(true);
  }, [design, finish]);

  const handleCellTap = useCallback((ri: number, ci: number) => {
    setUserGrid(prev => {
      const next = prev.map(r => [...r]);
      next[ri][ci] = selectedColor;
      checkComplete(next);
      return next;
    });
  }, [selectedColor, checkComplete]);

  const uniqueColors = Array.from(new Set(design.grid.flat())).sort();

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="🖼️"
        gameName="Pixel Art"
        elapsedSeconds={resumeElapsed}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <Text style={s.title}>Color by Number</Text>
      <Text style={s.subtitle}>Color the grid to reveal: {design.name}</Text>

      {/* Grid with numbers */}
      <View style={s.grid}>
        {design.grid.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((num, ci) => {
              const userColor = userGrid[ri][ci];
              const bgColor = userColor >= 0 ? design.colors[userColor] : colors.surface;
              return (
                <TouchableOpacity
                  key={ci}
                  style={[s.cell, { width: CELL, height: CELL, backgroundColor: bgColor }]}
                  onPress={() => handleCellTap(ri, ci)}
                  activeOpacity={0.8}
                >
                  {userColor < 0 && (
                    <Text style={s.cellNum}>{num}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Color palette */}
      <View style={s.palette}>
        {uniqueColors.map(i => (
          <TouchableOpacity
            key={i}
            style={[
              s.colorBtn,
              { backgroundColor: design.colors[i] },
              selectedColor === i && s.colorBtnSelected,
            ]}
            onPress={() => setSelectedColor(i)}
            activeOpacity={0.8}
          >
            <Text style={s.colorBtnText}>{i}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>🎨</Text>
            <Text style={s.modalTitle}>Masterpiece!</Text>
            <Text style={s.modalSub}>You painted: {design.name}</Text>
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
              setUserGrid(Array.from({ length: 8 }, () => Array(8).fill(-1)));
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 16 },
  grid: { borderWidth: 1, borderColor: colors.divider, marginBottom: 20 },
  cell: { borderWidth: 0.5, borderColor: colors.rule, alignItems: 'center', justifyContent: 'center' },
  cellNum: { fontFamily: fonts.bold, fontSize: 10, color: colors.inkMuted },
  palette: { flexDirection: 'row', gap: 10 },
  colorBtn: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  colorBtnSelected: { borderColor: colors.ink, shadowColor: colors.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  colorBtnText: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.ink },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
